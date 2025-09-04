import { Request, Response } from "express";
import Chat from "../models/chat";
import Message from "../models/message";
import User from "../models/user";

// ---------- Types ----------
interface PopulatedUser {
  _id: string;
  name: string;
  avatar: { url: string };
}

interface PopulatedChat {
  _id: string;
  groupChat: boolean;
  name: string;
  groupImg: string;
  creator: PopulatedUser | null;
  members: PopulatedUser[];
}

// ---------- Get All Users ----------
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});

    const transformedUsers = await Promise.all(
      users.map(async ({ name, username, avatar, _id }) => {
        const [groupsCount, friendsCount] = await Promise.all([
          Chat.countDocuments({ groupChat: true, members: _id }),
          Chat.countDocuments({ groupChat: false, members: _id }),
        ]);

        return {
          _id,
          name,
          username,
          avatar: avatar.url,
          groupsCount,
          friendsCount,
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "All users fetched for admin",
      data: transformedUsers,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ---------- Get All Chats ----------
export const allChats = async (req: Request, res: Response) => {
  try {
    const chats = await Chat.find({})
      .populate("members", "name avatar")
      .populate("creator", "name avatar");

    const transformedChats = await Promise.all(
      chats.map(async (chat: PopulatedChat) => {
        const totalMessages = await Message.countDocuments({ chat: chat._id });

        return {
          _id: chat._id,
          groupChat: chat.groupChat,
          name: chat.name,
          avatar: chat.groupImg,
          members: chat.members.map((member) => ({
            _id: member._id,
            name: member.name,
            avatar: member.avatar.url,
          })),
          creator: {
            name: chat.creator?.name || "None",
            avatar: chat.creator?.avatar.url || "",
          },
          totalMembers: chat.members.length,
          totalMessages,
        };
      })
    );

    return res.status(200).json({
      status: "success",
      message: "All Chats fetched for admin",
      chats: transformedChats,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ---------- Get All Messages ----------
export const allMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");

    const transformedMessages = messages.map((msg) => ({
      _id: msg._id,
      content: msg.content,
      attachements: msg.attachements,
      createdAt: msg.createdAt,
      chat: msg.chat._id,
      groupChat: msg.chat.groupChat,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        avatar: msg.sender.avatar.url,
      },
    }));

    return res.status(200).json({
      status: "success",
      message: "All messages fetched for admin",
      messages: transformedMessages,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ---------- Dashboard Stats ----------
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [groupsCount, usersCount, messagesCount, totalChatsCount] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments(),
      ]);

    const today = new Date();

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last7DaysMessages = await Message.find({
      createdAt: {
        $gte: last7Days,
        $lte: today,
      },
    }).select("createdAt");

    const messagesArray = new Array(7).fill(0);
    const dayInMilliseconds = 1000 * 60 * 60 * 24;

    last7DaysMessages.forEach((message) => {
      const indexApprox =
        (today.getTime() - message.createdAt.getTime()) / dayInMilliseconds;
      const index = Math.floor(indexApprox);

      messagesArray[6 - index]++;
    });

    const stats = {
      groupsCount,
      usersCount,
      messagesCount,
      totalChatsCount,
      messagesChart: messagesArray,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ---------- Verify Admin ----------
export const verifyAdmin = async (_req: Request, res: Response) => {
  return res.status(200).json({ admin: true });
};

// ---------- Export as default object ----------
export default {
  getAllUsers,
  allChats,
  allMessages,
  getDashboardStats,
  verifyAdmin,
};
