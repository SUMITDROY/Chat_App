import { Request, Response } from "express";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import User from "../models/user";
import Chat from "../models/chat";
import RequestModel from "../models/request";
import {
  sendToken,
  cookieOptions,
  emitEvent,
  uploadFilesToClodinary,
} from "../utils/features";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events";

// =======================
// Types for Request Bodies and Queries
// =======================
interface LoginRequestBody {
  name: string;
  password: string;
}

interface CreateUserRequestBody {
  username: string;
  name: string;
  password: string;
  bio: string;
}

interface SendRequestBody {
  userID: string;
}

interface AcceptRequestBody {
  requestID: string;
  accept: boolean;
}

interface GetMyFriendsQuery {
  chatID: string;
  name?: string;
}

interface SearchUsersQuery {
  name?: string;
}

// =======================
// Controller Functions
// =======================

// ===== Login User =====
export const loginUser = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { name, password } = req.body;
    const username = name.trim();

    if (!username || !password) {
      throw new Error("Both fields are required");
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new Error("Incorrect password");
    }

    sendToken(res, user, 200, `Welcome ${user.username}`);
    return res;
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Create New User =====
export const createUser = async (
  req: Request<{}, {}, CreateUserRequestBody>,
  res: Response
): Promise<Response> => {
  let result;
  try {
    const { username, name, password, bio } = req.body;
    const file = req.file;

    const trimmedName = name.trim();
    const trimmedUserName = username.trim();

    if (!file) {
      throw new Error("Please upload avatar");
    }

    result = await uploadFilesToClodinary([file], "profile_pics");

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    const hashedPass = await bcrypt.hash(password, 10);
    await User.create({
      name: trimmedName,
      username: trimmedUserName,
      password: hashedPass,
      bio,
      avatar,
    });

    return res.status(201).json({ message: "User created", status: "success" });
  } catch (error: any) {
    if (error?.errorResponse?.code === 11000 && result) {
      // @ts-ignore
      await cloudinary.v2.uploader.destroy(result[0].public_id);
      const alreadyUsedValuesKey = Object.keys(error.keyPattern).join(",");
      error.message = `Add another ${alreadyUsedValuesKey}, it's already used`;
    }

    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Get Current User =====
export const getUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // @ts-ignore
    const user = await User.findById(req.userID);

    return res
      .status(200)
      .json({ status: "success", message: "User found", user });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Get User Profile by ID =====
export const getUserProfileDetail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userID } = req.query;
    const user = await User.findById(userID);

    return res.status(200).json({
      status: "success",
      message: "User profile detail found",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Logout User =====
export const logOut = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    return (
      res
        .status(200)
        // @ts-ignore
        .cookie("UserToken", "", { ...cookieOptions, maxAge: 0 })
        .json({ status: "success", message: "Logout successfully" })
    );
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Search Users =====
export const searchUsers = async (
  req: Request<{}, {}, {}, SearchUsersQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { name } = req.query;

    const myChats = await Chat.find({
      groupChat: false,
      // @ts-ignore
      members: req.userID,
    }).populate("members", "name avatar");

    const otherUserFromMyChats = myChats.flatMap((chat) => chat.members);

    const friendList = await User.find({
      _id: { $nin: otherUserFromMyChats },
      name: { $regex: name, $options: "i" },
    });

    const removedSelf = friendList.filter(
      // @ts-ignore
      (friend) => friend._id.toString() !== req.userID.toString()
    );

    const users = removedSelf.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res.status(200).json({
      status: "success",
      message: name,
      otherUserFromMyChats,
      users,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Send Friend Request =====
export const sendRequest = async (
  req: Request<{}, {}, SendRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { userID } = req.body;

    if (!userID) throw new Error("Please provide userID");

    // @ts-ignore
    if (userID === req.userID)
      throw new Error("You cannot send a request to yourself");

    const existingRequest = await RequestModel.findOne({
      $or: [
        // @ts-ignore
        { sender: req.userID, receiver: userID },
        // @ts-ignore
        { sender: userID, receiver: req.userID },
      ],
    });

    if (existingRequest) {
      throw new Error("Request already sent");
    }

    // @ts-ignore
    const requestData = await RequestModel.create({
      // @ts-ignore
      sender: req.userID,
      receiver: userID,
    });

    const populatedRequest = await RequestModel.findById(requestData._id)
      .populate("sender", "name avatar")
      .lean();

    // @ts-ignore
    if (populatedRequest?.sender) {
      // @ts-ignore
      populatedRequest.sender.avatar = populatedRequest.sender.avatar.url;
    }

    emitEvent(req, NEW_REQUEST, [userID], populatedRequest);

    return res
      .status(200)
      .json({ status: "success", message: "Friend request has been sent" });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Accept or Reject Friend Request =====
export const acceptRequest = async (
  req: Request<{}, {}, AcceptRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { requestID, accept } = req.body;

    if (!requestID) throw new Error("Please provide requestID");

    const request = await RequestModel.findById(requestID)
      .populate("sender", "name")
      .populate("receiver", "name");

    if (!request) throw new Error("Invalid request ID");

    // @ts-ignore
    if (request.receiver._id.toString() !== req.userID.toString()) {
      throw new Error("You are not authorized to accept this request");
    }

    if (!accept) {
      await request.deleteOne();
      return res
        .status(200)
        .json({ status: "success", message: "Request rejected" });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
      Chat.create({
        members,
        latestMessage: null,
        name: `${request.sender.name}-${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);
    // @ts-ignore
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
      status: "success",
      message: "Friend request accepted",
      senderId: request.sender._id,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Get All Friend Requests =====
export const getAllRequests = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // @ts-ignore
    const requests = await RequestModel.find({ receiver: req.userID }).populate(
      "sender",
      "name avatar"
    );

    const modifiedRequests = requests.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    }));

    return res.status(200).json({ status: "success", data: modifiedRequests });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===== Get Friends Not in a Group =====
export const getMyFriends = async (
  req: Request<{}, {}, {}, GetMyFriendsQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { chatID, name } = req.query;

    if (!chatID) {
      return res
        .status(400)
        .json({ status: "error", message: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatID).populate("members", "name avatar");

    if (!chat) {
      return res
        .status(404)
        .json({ status: "error", message: "Chat not found" });
    }

    // @ts-ignore
    const friends = chat.members.filter(
      // @ts-ignore
      (member) => member._id.toString() !== req.userID.toString()
    );

    return res.status(200).json({ status: "success", friends });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
