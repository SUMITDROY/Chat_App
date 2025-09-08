"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_cron_1 = __importDefault(require("node-cron"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// ---------- Local Imports ----------
const routes_1 = __importDefault(require("./routes"));
const db_1 = __importDefault(require("./config/db"));
const events_1 = require("./constants/events");
const auth_1 = require("./middlewares/auth");
const socketManager_1 = require("./lib/socketManager");
const message_1 = __importDefault(require("./models/message"));
const chat_1 = __importDefault(require("./models/chat"));
const user_1 = __importDefault(require("./models/user"));
// ---------- Config ----------
dotenv_1.default.config({ path: "./.env.local" });
const APP_PORT = parseInt(process.env.PORT || "8000", 10);
const DATABASE_URI = process.env.DBLink || "";
// ---------- Cloudinary Setup ----------
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ---------- Express & Socket Server ----------
const chatApp = (0, express_1.default)();
const chatServer = (0, http_1.createServer)(chatApp);
const socketServer = new socket_io_1.Server(chatServer, {
    cors: {
        origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_PREVIEW],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
chatApp.set("io", socketServer);
// ---------- Middleware ----------
chatApp.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_PREVIEW],
    credentials: true,
}));
chatApp.use(express_1.default.json());
chatApp.use((0, cookie_parser_1.default)());
// ---------- Routes ----------
chatApp.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Chat app working 🚀");
}));
chatApp.use("/api/v1", routes_1.default);
// ---------- Cron Job ----------
node_cron_1.default.schedule("*/10 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`${process.env.BACK_SERVER_URL}`);
        console.log("Cron Job Successful:", response.data);
    }
    catch (error) {
        console.error("Cron Job Error:", error.message);
    }
}), {
    timezone: "Asia/Kolkata",
});
// ---------- Socket Authentication ----------
socketServer.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, auth_1.socketAuthenticator)(socket, next);
}));
// ---------- Socket Events ----------
socketServer.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    if (!socket.user)
        return;
    const currentUser = socket.user;
    // Register socket on user connection
    (0, socketManager_1.registerSocket)(currentUser._id.toString(), socket.id.toString());
    // Update user status to ONLINE
    const onlineUser = yield user_1.default.findByIdAndUpdate(currentUser._id, {
        status: "ONLINE",
    });
    socketServer.emit(events_1.EVENT_USER_ONLINE, onlineUser);
    // ----- New Message Event -----
    socket.on(events_1.EVENT_NEW_MESSAGE, (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatID, members, message }) {
        const messageRealTime = {
            content: message,
            _id: (0, uuid_1.v4)(),
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
        const targetSocketIds = (0, socketManager_1.fetchSocketIds)(members);
        console.log("Active Sockets:", targetSocketIds);
        if (targetSocketIds.length > 0) {
            socketServer.to(targetSocketIds).emit(events_1.EVENT_NEW_MESSAGE, {
                chatID,
                message: messageRealTime,
            });
            socketServer.to(targetSocketIds).emit(events_1.EVENT_NEW_MESSAGE_ALERT, {
                chatID,
                message: messageRealTime,
            });
        }
        try {
            const chat = yield chat_1.default.findById(chatID);
            if (chat) {
                const savedMessage = yield message_1.default.create(messageToDB);
                chat.latestMessage = savedMessage._id;
                chat.latestMessageTime = Date.now();
                yield chat.save();
            }
        }
        catch (error) {
            console.error("Error saving message:", error);
        }
    }));
    // ----- Typing Started -----
    socket.on(events_1.EVENT_TYPING_START, (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatID, members, userName }) {
        const targetSocketIds = (0, socketManager_1.fetchSocketIdsExceptSender)(members, currentUser._id.toString());
        if (targetSocketIds.length > 0) {
            socketServer.to(targetSocketIds).emit(events_1.EVENT_TYPING_START, {
                chatID,
                userName,
            });
        }
    }));
    // ----- Typing Stopped -----
    socket.on(events_1.EVENT_TYPING_STOP, (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatID, members }) {
        const targetSocketIds = (0, socketManager_1.fetchSocketIdsExceptSender)(members, currentUser._id.toString());
        if (targetSocketIds.length > 0) {
            socketServer.to(targetSocketIds).emit(events_1.EVENT_TYPING_STOP, {
                chatID,
            });
        }
    }));
    // ----- User Disconnect -----
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        (0, socketManager_1.unregisterSocket)(currentUser._id.toString());
        const offlineUser = yield user_1.default.findByIdAndUpdate(currentUser._id, {
            status: "OFFLINE",
        });
        socketServer.emit(events_1.EVENT_USER_OFFLINE, offlineUser);
        console.log("User disconnected:", socket.id);
    }));
}));
// ---------- Start the Server ----------
chatServer.listen(APP_PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`🚀 Server running on port ${APP_PORT} in ${(_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.trim()} Mode`);
    yield (0, db_1.default)(DATABASE_URI);
}));
