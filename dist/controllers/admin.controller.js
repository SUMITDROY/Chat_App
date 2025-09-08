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
exports.verifyAdmin = exports.getDashboardStats = exports.allMessages = exports.allChats = exports.getAllUsers = void 0;
const chat_1 = __importDefault(require("../models/chat"));
const message_1 = __importDefault(require("../models/message"));
const user_1 = __importDefault(require("../models/user"));
// ---------- Get All Users ----------
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find({});
        const transformedUsers = yield Promise.all(users.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ name, username, avatar, _id }) {
            const [groupsCount, friendsCount] = yield Promise.all([
                chat_1.default.countDocuments({ groupChat: true, members: _id }),
                chat_1.default.countDocuments({ groupChat: false, members: _id }),
            ]);
            return {
                _id,
                name,
                username,
                avatar: avatar.url,
                groupsCount,
                friendsCount,
            };
        })));
        res.status(200).json({
            status: "success",
            message: "All users fetched for admin",
            data: transformedUsers,
        });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getAllUsers = getAllUsers;
// ---------- Get All Chats ----------
const allChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chats = yield chat_1.default.find({})
            .populate("members", "name avatar")
            .populate("creator", "name avatar");
        const transformedChats = yield Promise.all(chats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const totalMessages = yield message_1.default.countDocuments({ chat: chat._id });
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
                    name: ((_a = chat.creator) === null || _a === void 0 ? void 0 : _a.name) || "None",
                    avatar: ((_b = chat.creator) === null || _b === void 0 ? void 0 : _b.avatar.url) || "",
                },
                totalMembers: chat.members.length,
                totalMessages,
            };
        })));
        return res.status(200).json({
            status: "success",
            message: "All Chats fetched for admin",
            chats: transformedChats,
        });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.allChats = allChats;
// ---------- Get All Messages ----------
const allMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = yield message_1.default.find({})
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
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.allMessages = allMessages;
// ---------- Dashboard Stats ----------
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [groupsCount, usersCount, messagesCount, totalChatsCount] = yield Promise.all([
            chat_1.default.countDocuments({ groupChat: true }),
            user_1.default.countDocuments(),
            message_1.default.countDocuments(),
            chat_1.default.countDocuments(),
        ]);
        const today = new Date();
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last7DaysMessages = yield message_1.default.find({
            createdAt: {
                $gte: last7Days,
                $lte: today,
            },
        }).select("createdAt");
        const messagesArray = new Array(7).fill(0);
        const dayInMilliseconds = 1000 * 60 * 60 * 24;
        last7DaysMessages.forEach((message) => {
            const indexApprox = (today.getTime() - message.createdAt.getTime()) / dayInMilliseconds;
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
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getDashboardStats = getDashboardStats;
// ---------- Verify Admin ----------
const verifyAdmin = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json({ admin: true });
});
exports.verifyAdmin = verifyAdmin;
// ---------- Export as default object ----------
exports.default = {
    getAllUsers: exports.getAllUsers,
    allChats: exports.allChats,
    allMessages: exports.allMessages,
    getDashboardStats: exports.getDashboardStats,
    verifyAdmin: exports.verifyAdmin,
};
