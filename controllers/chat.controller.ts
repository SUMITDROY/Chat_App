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

// =======================
// Create New Group Chat
// =======================
export const newGroupChat = async (
  req: Request<{}, {}, NewGroupRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { groupName, members } = req.body;

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

    // Upload group image
    const result = await uploadFilesToClodinary([req.file], "group_img");

    const avatar = {
      url:
        result[0]?.url ||
        "https://media.istockphoto.com/id/1076599848/vector/meeting-isolated-on-white-background-vector-illustration.jpg",
    };

    // Add creator to group
    // @ts-ignore
    parsedMembers.push(req.userID);

    await Chat.create({
      name: groupName,
      groupImg: avatar.url,
      groupChat: true,
      // @ts-ignore
      creator: req.userID,
      // @ts-ignore
      admin: [req.userID],
      members: parsedMembers,
      groupImgPublicId: result[0]?.public_id,
    });

    // @ts-ignore
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
// Get All Chats of User
// =======================
export const getMyChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // @ts-ignore
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
        // @ts-ignore
        const otherMember = await getOtherMember(chat.members, req.userID);

        allChats.push({
          ...chat.toObject(),
          // @ts-ignore
          avatar: otherMember?.avatar?.url,
          // @ts-ignore
          name: otherMember?.name,
          members: otherMember,
        });
      } else {
        chat.members = chat.members
          // @ts-ignore
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
// Get Only Group Chats
// =======================
export const getMyGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // @ts-ignore
    const groups = await Chat.find({
      groupChat: true,
      members: req.userID,
    }).populate("members", "name avatar status");

    return res.status(200).json({
      status: "success",
      message: "Group chats fetched successfully",
      groups,
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

    // @ts-ignore
    if (chat.creator.toString() !== req.userID.toString()) {
      throw new Error("You are not an admin of this group");
    }

    let alreadyAddedMembers: string[] = [];

    for (const memberID of members) {
      const user = await User.findById(memberID, "name");
      if (user && !chat.members.includes(user._id)) {
        chat.members.push(user._id);
      } else if (user) {
        alreadyAddedMembers.push(user.name);
      }
    }

    await chat.save();

    emitEvent(req, ADDED_IN_GROUP, chat.members, "New members added");
    // @ts-ignore
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
// Remove a Member
// =======================
export const removeMember = async (
  req: Request<{}, {}, RemoveMemberRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { chatID, userToRemoveID } = req.body;

    const chat = await Chat.findById(chatID);
    if (!chat) throw new Error("Chat not found");
    if (!chat.groupChat) throw new Error("Not a group");

    // @ts-ignore
    if (!chat.admin.includes(req.userID.toString())) {
      throw new Error("Only admins can remove members");
    }

    chat.members = chat.members.filter(
      (memberID: any) => memberID.toString() !== userToRemoveID
    );
    await chat.save();

    // @ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      status: "success",
      message: "Member removed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Leave Group
// =======================
export const leaveGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { chatID } = req.query;

    const chat = await Chat.findById(chatID);
    if (!chat) throw new Error("Group not found");

    // @ts-ignore
    chat.members = chat.members.filter(
      (member: any) => member.toString() !== req.userID
    );
    await chat.save();

    // @ts-ignore
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      status: "success",
      message: "You have left the group",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Send Attachments
// =======================
export const sendAttachments = async (
  req: Request<{}, {}, SendAttachmentsRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { chatID, content } = req.body;

    const message = await Message.create({
      chat: chatID,
      content,
      // @ts-ignore
      sender: req.userID,
    });

    await Chat.findByIdAndUpdate(chatID, {
      latestMessage: message._id,
      latestMessageTime: new Date(),
    });

    emitEvent(req, NEW_MESSAGE, chatID, message);
    emitEvent(req, NEW_MESSAGE_ALERT, chatID, message);

    return res.status(201).json({
      status: "success",
      message: "Attachment sent successfully",
      data: message,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Get Chat Details
// =======================
export const getChatDetails = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { chatID } = req.query;

    const chat = await Chat.findById(chatID)
      .populate("members", "name avatar")
      .populate("admin", "name");

    if (!chat) throw new Error("Chat not found");

    return res.status(200).json({
      status: "success",
      message: "Chat details fetched successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Edit Group Details
// =======================
export const getChatDetailsEdit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { chatID } = req.query;

    const chat = await Chat.findById(chatID).populate("members", "name avatar");

    if (!chat) throw new Error("Chat not found");

    return res.status(200).json({
      status: "success",
      message: "Chat details (edit) fetched successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Rename Group
// =======================
export const renameGroup = async (
  req: Request<{ id: string }, {}, RenameGroupRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const chat = await Chat.findByIdAndUpdate(id, { name }, { new: true });

    if (!chat) throw new Error("Group not found");

    return res.status(200).json({
      status: "success",
      message: "Group renamed successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Change Group Name
// =======================
export const changeGroupName = async (
  req: Request<ChangeGroupNameParams, {}, RenameGroupRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const chat = await Chat.findByIdAndUpdate(id, { name }, { new: true });

    if (!chat) throw new Error("Group not found");

    return res.status(200).json({
      status: "success",
      message: "Group name changed successfully",
      chat,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Delete Chat
// =======================
export const deleteChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { chatID } = req.query;

    const chat = await Chat.findByIdAndDelete(chatID);
    if (!chat) throw new Error("Chat not found");

    return res.status(200).json({
      status: "success",
      message: "Chat deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Get Messages
// =======================
export const getMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { chatID } = req.query;

    const messages = await Message.find({ chat: chatID })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      status: "success",
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// =======================
// Make Admin
// =======================
export const makeAdmin = async (
  req: Request<{}, {}, {}, MakeAdminQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { groupID, userID } = req.query;

    const group = await Chat.findById(groupID);
    if (!group) throw new Error("Group not found");

    if (group.admin.includes(userID)) throw new Error("User is already admin");

    group.admin.push(userID);
    await group.save();

    // @ts-ignore
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

    const group = await Chat.findById(groupID);
    if (!group) throw new Error("Group not found");

    if (!group.admin.includes(userID)) throw new Error("User is not an admin");

    group.admin = group.admin.filter((id: string) => id !== userID);
    await group.save();

    // @ts-ignore
    emitEvent(req, REMOVE_GROUP_ADMIN, group.members);

    return res.status(200).json({
      status: "success",
      message: "User removed from admin role",
    });
  } catch (error: any) {
    return res.status(500).json({ status: "error", error: error.message });
  }
};
