import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import cloudinary from "cloudinary";

// ---------- Local Imports ----------
import allRoutes from "./routes";
import connectDB from "./config/db";
import EVENT_NEW_MESSAGE from "./constants/events";
import EVENT_NEW_MESSAGE_ALERT  from "./constants/events";
import  EVENT_TYPING_START  from "./constants/events";
import  EVENT_TYPING_STOP  from "./constants/events";
import  EVENT_USER_ONLINE  from "./constants/events";
import  EVENT_USER_OFFLINE  from "./constants/events";

import { socketAuthenticator } from "./middlewares/auth";

import {
  registerSocket,
  unregisterSocket,
  getSocketID,
  getSocketIDWithoutEmitter,
  getUserSocketIDs
} from "./lib/socketManager";


import Message from "./models/message";
import Chat from "./models/chat";
import User from "./models/user";

// ---------- Types ----------
interface ChatMessagePayload {
  chatID: string;
  members: string[];
  message: string;
}

interface TypingStatusPayload {
  chatID: string;
  members: string[];
  userName?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    name: string;
    avatar: string;
  };
}

// ---------- Config ----------
dotenv.config({ path: "./.env.local" });

const APP_PORT = parseInt(process.env.PORT || "8000", 10);
const DATABASE_URI = process.env.DBLink || "";

// ---------- Cloudinary Setup ----------
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ---------- Express & Socket Server ----------
const chatApp: Application = express();
const chatServer = createServer(chatApp);

const socketServer = new Server(chatServer, {
  cors: {
    origin: [process.env.FRONTEND_URL!, process.env.FRONTEND_URL_PREVIEW!],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

chatApp.set("io", socketServer);

// ---------- Middleware ----------
chatApp.use(
  cors({
    origin: [process.env.FRONTEND_URL!, process.env.FRONTEND_URL_PREVIEW!],
    credentials: true,
  })
);
chatApp.use(express.json());
chatApp.use(cookieParser());

// ---------- Routes ----------
chatApp.get("/", async (_req: Request, res: Response) => {
  res.send("Chat app working 🚀");
});

chatApp.use("/api/v1", allRoutes);

// ---------- Cron Job ----------
cron.schedule(
  "*/10 * * * *",
  async () => {
    try {
      const response = await axios.get(`${process.env.BACK_SERVER_URL}`);
      console.log("Cron Job Successful:", response.data);
    } catch (error: any) {
      console.error("Cron Job Error:", error.message);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// ---------- Socket Authentication ----------
socketServer.use(async (socket: AuthenticatedSocket, next) => {
  await socketAuthenticator(socket, next);
});

// ---------- Socket Events ----------
socketServer.on("connection", async (socket: AuthenticatedSocket) => {
  if (!socket.user) return;

  const currentUser = socket.user;

  // Register socket on user connection
  registerSocket(currentUser._id.toString(), socket.id.toString());

  // Update user status to ONLINE
  const onlineUser = await User.findByIdAndUpdate(currentUser._id, {
    status: "ONLINE",
  });
  // @ts-ignore
  socketServer.emit(EVENT_USER_ONLINE, onlineUser);

  // ----- New Message Event -----
  socket.on(
    // @ts-ignore
    EVENT_NEW_MESSAGE,
    async ({ chatID, members, message }: ChatMessagePayload) => {
      const messageRealTime = {
        content: message,
        _id: uuidv4(),
        sender: {
          _id: currentUser._id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        chat: chatID,
        createdAt: new Date().toISOString(),
      };

      const messageToDB = {
        content: message,
        sender: currentUser._id,
        chat: chatID,
      };

      // Notify all members in the chat
      const targetSocketIds = getSocketID(members);
      console.log("Active Sockets:", targetSocketIds);

      if (targetSocketIds.length > 0) {
        // @ts-ignore
        socketServer.to(targetSocketIds).emit(EVENT_NEW_MESSAGE, {
          chatID,
          message: messageRealTime,
        });
        // @ts-ignore
        socketServer.to(targetSocketIds).emit(EVENT_NEW_MESSAGE_ALERT, {
          chatID,
          message: messageRealTime,
        });
      }

      try {
        const chat = await Chat.findById(chatID);
        if (chat) {
          const savedMessage = await Message.create(messageToDB);
          chat.latestMessage = savedMessage._id;
          chat.latestMessageTime = Date.now();
          await chat.save();
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    }
  );

  // ----- Typing Started -----
  socket.on(
    // @ts-ignore
    EVENT_TYPING_START,
    async ({ chatID, members, userName }: TypingStatusPayload) => {
      const targetSocketIds = getSocketIDWithoutEmitter(
        members,
        currentUser._id.toString()
      );
      if (targetSocketIds.length > 0) {
        // @ts-ignore
        socketServer.to(targetSocketIds).emit(EVENT_TYPING_START, {
          chatID,
          userName,
        });
      }
    }
  );

  // ----- Typing Stopped -----
  socket.on(
    // @ts-ignore
    EVENT_TYPING_STOP,
    async ({ chatID, members }: TypingStatusPayload) => {
      const targetSocketIds = getSocketIDWithoutEmitter(
        members,
        currentUser._id.toString()
      );
      if (targetSocketIds.length > 0) {
        // @ts-ignore
        socketServer.to(targetSocketIds).emit(EVENT_TYPING_STOP, {
          chatID,
        });
      }
    }
  );

  // ----- User Disconnect -----
  socket.on("disconnect", async () => {
    unregisterSocket(currentUser._id.toString());

    const offlineUser = await User.findByIdAndUpdate(currentUser._id, {
      status: "OFFLINE",
    });
    // @ts-ignore
    socketServer.emit(EVENT_USER_OFFLINE, offlineUser);
    console.log("User disconnected:", socket.id);
  });
});

// ---------- Start the Server ----------
chatServer.listen(APP_PORT, async () => {
  console.log(
    `🚀 Server running on port ${APP_PORT} in ${process.env.NODE_ENV?.trim()} Mode`
  );
  await connectDB();
});

