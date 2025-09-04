import { Request, Response } from "express";
import {
  ALERT,
  REFETCH_CHATS,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  NEW_MESSAGE,
  REFETCH_GROUP_DETAIL,
  ADDED_IN_GROUP,
  MAKE_GROUP_ADMIN,
  REMOVE_GROUP_ADMIN,
} from "../constants/events";
import { getOtherMember } from "../lib/helper";
import Chat from "../models/chat";
import User from "../models/user";
import Message from "../models/message";
import {
  emitEvent,
  deleteFilesFromClodinary,
  uploadFilesToClodinary,
} from "../utils/features";

// ===== INTERFACES =====
interface NewGroupRequestBody {
  groupName: string;
  members: string; // JSON string
}

interface AddMembersRequestBody {
  chatID: string;
  members: string[];
}

interface RemoveMemberRequestBody {
  chatID: string;
  userToRemoveID: string;
}

interface SendAttachmentsRequestBody {
  chatID: string;
  content: string;
}

interface RenameGroupRequestBody {
  name: string;
}

interface ChangeGroupNameParams {
  id: string;
}

interface MakeAdminQuery {
  groupID: string;
  userID: string;
}

interface RemoveAdminQuery {
  groupID: string;
  userID: string;
}

// ===== CONTROLLERS =====

export const newGroupChat = async (
  req: Request<{}, {}, NewGroupRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { groupName, members } = req.body;

    // Parse members JSON string
    let parsedMembers: string[];
    try {
      parsedMembers = JSON.parse(members);
    } catch {
      throw new Error("Invalid members format. Must be a valid JSON string.");
    }

    if (parsedMembers.length < 2) {
      throw new Error("Group must have at least 3 members.");
    }

    if (!req.file) {
      throw new Error("Please upload an avatar.");
    }

    // Upload group image to Cloudinary
    const result = await uploadFilesToClodinary([req.file], "group_img");

    const avatar = {
      url:
        result[0]?.url ||
        "https://media.istockphoto.com/id/1076599848/vector/meeting-isolated-on-white-background-vector-illustration.jpg",
    };

    // Add creator to group
    parsedMembers.push(req.userID);

    await Chat.create({
      name: groupName,
      groupImg: avatar.url,
      groupChat: true,
      creator: req.userID,
      admin: [req.userID],
      members: parsedMembers,
      groupImgPublicId: result[0]?.public_id,
    });

    emitEvent(req, REFETCH_CHATS, parsedMembers);

    return res.status(201).json({
      status: "success",
      message: "Group created",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Get User Chats
// =======================
export const getMyChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const searchTerm = req.query.search as string;
    let filter = req.query.filter as string;

    let chats = await Chat.find({ members: req.userID })
      .populate("members", "name avatar status")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "name" },
      })
      .sort({ latestMessageTime: -1 });

    let allChats: any[] = [];

    for (let chat of chats) {
      if (!chat.groupChat) {
        const otherMember = await getOtherMember(chat.members, req.userID);

        allChats.push({
          ...chat.toObject(),
          avatar: otherMember?.avatar?.url,
          name: otherMember?.name,
          members: otherMember,
        });
      } else {
        chat.members = chat.members
          .filter((member: any) => member._id.toString() !== req.userID)
          .map((member: any) => member._id);

        allChats.push(chat);
      }
    }

    return res.status(200).json({
      status: "success",
      message: "All chats fetched",
      chats: allChats,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Add Members to Group
// =======================
export const addMembers = async (
  req: Request<{}, {}, AddMembersRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { chatID, members } = req.body;

    const chat = await Chat.findById(chatID);
    if (!chat) throw new Error("Chat not found");
    if (!chat.groupChat) throw new Error("Not a group");

    if (chat.creator.toString() !== req.userID.toString()) {
      throw new Error("You are not an admin of this group");
    }

    let alreadyAddedMembers: string[] = [];
    let userAdded = false;

    for (const memberID of members) {
      const user = await User.findById(memberID, "name");
      if (user && !chat.members.includes(user._id)) {
        chat.members.push(user._id);
        userAdded = true;
      } else if (user) {
        alreadyAddedMembers.push(user.name);
      }
    }

    await chat.save();

    emitEvent(req, ADDED_IN_GROUP, chat.members, "New members added");
    emitEvent(req, REFETCH_CHATS, chat.members);

    if (alreadyAddedMembers.length > 0) {
      return res.status(200).json({
        status: "success",
        message: "Members added successfully",
        error: `${alreadyAddedMembers.join(", ")} are already in the group`,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Members added successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Promote to Admin
// =======================
export const makeAdmin = async (
  req: Request<{}, {}, {}, MakeAdminQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { groupID, userID } = req.query;

    if (!groupID || !userID)
      throw new Error("Group ID and User ID are required");

    const group = await Chat.findById(groupID);
    if (!group) throw new Error("Group not found");

    if (group.admin.includes(userID)) {
      throw new Error("User is already an admin");
    }

    group.admin.push(userID);
    await group.save();

    emitEvent(req, MAKE_GROUP_ADMIN, group.members);

    return res.status(200).json({
      status: "success",
      message: "User promoted to admin",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Remove Admin
// =======================
export const removeAdmin = async (
  req: Request<{}, {}, {}, RemoveAdminQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { groupID, userID } = req.query;

    if (!groupID || !userID)
      throw new Error("Group ID and User ID are required");

    const group = await Chat.findById(groupID);
    if (!group) throw new Error("Group not found");

    if (!group.admin.includes(userID)) {
      throw new Error("User is not an admin");
    }

    group.admin = group.admin.filter((adminID: string) => adminID !== userID);
    await group.save();

    emitEvent(req, REMOVE_GROUP_ADMIN, group.members);

    return res.status(200).json({
      status: "success",
      message: "User removed from admin role",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};
