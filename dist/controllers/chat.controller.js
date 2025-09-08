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
exports.removeAdmin = exports.makeAdmin = exports.getMessages = exports.deleteChat = exports.changeGroupName = exports.renameGroup = exports.getChatDetailsEdit = exports.getChatDetails = exports.sendAttachments = exports.leaveGroup = exports.removeMember = exports.addMembers = exports.getMyGroup = exports.getMyChat = exports.newGroupChat = void 0;
const events_1 = require("../constants/events");
const helper_1 = require("../lib/helper");
const chat_1 = __importDefault(require("../models/chat"));
const user_1 = __importDefault(require("../models/user"));
const message_1 = __importDefault(require("../models/message"));
const features_1 = require("../utils/features");
// =======================
// Create New Group Chat
// =======================
const newGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { groupName, members } = req.body;
        let parsedMembers;
        try {
            parsedMembers = JSON.parse(members);
        }
        catch (_c) {
            throw new Error("Invalid members format. Must be a valid JSON string.");
        }
        if (parsedMembers.length < 2) {
            throw new Error("Group must have at least 3 members.");
        }
        if (!req.file) {
            throw new Error("Please upload an avatar.");
        }
        // Upload group image
        const result = yield (0, features_1.uploadFilesToClodinary)([req.file], "group_img");
        const avatar = {
            url: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.url) ||
                "https://media.istockphoto.com/id/1076599848/vector/meeting-isolated-on-white-background-vector-illustration.jpg",
        };
        // Add creator to group
        // @ts-ignore
        parsedMembers.push(req.userID);
        yield chat_1.default.create({
            name: groupName,
            groupImg: avatar.url,
            groupChat: true,
            // @ts-ignore
            creator: req.userID,
            // @ts-ignore
            admin: [req.userID],
            members: parsedMembers,
            groupImgPublicId: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.public_id,
        });
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, parsedMembers);
        return res.status(201).json({
            status: "success",
            message: "Group created",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.newGroupChat = newGroupChat;
// =======================
// Get All Chats of User
// =======================
const getMyChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // @ts-ignore
        let chats = yield chat_1.default.find({ members: req.userID })
            .populate("members", "name avatar status")
            .populate({
            path: "latestMessage",
            populate: { path: "sender", select: "name" },
        })
            .sort({ latestMessageTime: -1 });
        let allChats = [];
        for (let chat of chats) {
            if (!chat.groupChat) {
                // @ts-ignore
                const otherMember = yield (0, helper_1.getOtherMember)(chat.members, req.userID);
                allChats.push(Object.assign(Object.assign({}, chat.toObject()), { 
                    // @ts-ignore
                    avatar: (_a = otherMember === null || otherMember === void 0 ? void 0 : otherMember.avatar) === null || _a === void 0 ? void 0 : _a.url, 
                    // @ts-ignore
                    name: otherMember === null || otherMember === void 0 ? void 0 : otherMember.name, members: otherMember }));
            }
            else {
                chat.members = chat.members
                    // @ts-ignore
                    .filter((member) => member._id.toString() !== req.userID)
                    .map((member) => member._id);
                allChats.push(chat);
            }
        }
        return res.status(200).json({
            status: "success",
            message: "All chats fetched",
            chats: allChats,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.getMyChat = getMyChat;
// =======================
// Get Only Group Chats
// =======================
const getMyGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const groups = yield chat_1.default.find({
            groupChat: true,
            // @ts-ignore
            members: req.userID,
        }).populate("members", "name avatar status");
        return res.status(200).json({
            status: "success",
            message: "Group chats fetched successfully",
            groups,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.getMyGroup = getMyGroup;
// =======================
// Add Members to Group
// =======================
const addMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID, members } = req.body;
        const chat = yield chat_1.default.findById(chatID);
        if (!chat)
            throw new Error("Chat not found");
        if (!chat.groupChat)
            throw new Error("Not a group");
        // @ts-ignore
        if (chat.creator.toString() !== req.userID.toString()) {
            throw new Error("You are not an admin of this group");
        }
        let alreadyAddedMembers = [];
        for (const memberID of members) {
            const user = yield user_1.default.findById(memberID, "name");
            if (user && !chat.members.includes(user._id)) {
                chat.members.push(user._id);
            }
            else if (user) {
                alreadyAddedMembers.push(user.name);
            }
        }
        yield chat.save();
        (0, features_1.emitEvent)(req, events_1.ADDED_IN_GROUP, chat.members, "New members added");
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
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
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.addMembers = addMembers;
// =======================
// Remove a Member
// =======================
const removeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID, userToRemoveID } = req.body;
        const chat = yield chat_1.default.findById(chatID);
        if (!chat)
            throw new Error("Chat not found");
        if (!chat.groupChat)
            throw new Error("Not a group");
        // @ts-ignore
        if (!chat.admin.includes(req.userID.toString())) {
            throw new Error("Only admins can remove members");
        }
        chat.members = chat.members.filter((memberID) => memberID.toString() !== userToRemoveID);
        yield chat.save();
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res.status(200).json({
            status: "success",
            message: "Member removed successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.removeMember = removeMember;
// =======================
// Leave Group
// =======================
const leaveGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID } = req.query;
        const chat = yield chat_1.default.findById(chatID);
        if (!chat)
            throw new Error("Group not found");
        // @ts-ignore
        chat.members = chat.members.filter(
        // @ts-ignore
        (member) => member.toString() !== req.userID);
        yield chat.save();
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, chat.members);
        return res.status(200).json({
            status: "success",
            message: "You have left the group",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.leaveGroup = leaveGroup;
// =======================
// Send Attachments
// =======================
const sendAttachments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID, content } = req.body;
        const message = yield message_1.default.create({
            chat: chatID,
            content,
            // @ts-ignore
            sender: req.userID,
        });
        yield chat_1.default.findByIdAndUpdate(chatID, {
            latestMessage: message._id,
            latestMessageTime: new Date(),
        });
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.NEW_MESSAGE, chatID, message);
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.NEW_MESSAGE_ALERT, chatID, message);
        return res.status(201).json({
            status: "success",
            message: "Attachment sent successfully",
            data: message,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.sendAttachments = sendAttachments;
// =======================
// Get Chat Details
// =======================
const getChatDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID } = req.query;
        const chat = yield chat_1.default.findById(chatID)
            .populate("members", "name avatar")
            .populate("admin", "name");
        if (!chat)
            throw new Error("Chat not found");
        return res.status(200).json({
            status: "success",
            message: "Chat details fetched successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.getChatDetails = getChatDetails;
// =======================
// Edit Group Details
// =======================
const getChatDetailsEdit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID } = req.query;
        const chat = yield chat_1.default.findById(chatID).populate("members", "name avatar");
        if (!chat)
            throw new Error("Chat not found");
        return res.status(200).json({
            status: "success",
            message: "Chat details (edit) fetched successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.getChatDetailsEdit = getChatDetailsEdit;
// =======================
// Rename Group
// =======================
const renameGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const chat = yield chat_1.default.findByIdAndUpdate(id, { name }, { new: true });
        if (!chat)
            throw new Error("Group not found");
        return res.status(200).json({
            status: "success",
            message: "Group renamed successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.renameGroup = renameGroup;
// =======================
// Change Group Name
// =======================
const changeGroupName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const chat = yield chat_1.default.findByIdAndUpdate(id, { name }, { new: true });
        if (!chat)
            throw new Error("Group not found");
        return res.status(200).json({
            status: "success",
            message: "Group name changed successfully",
            chat,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.changeGroupName = changeGroupName;
// =======================
// Delete Chat
// =======================
const deleteChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID } = req.query;
        const chat = yield chat_1.default.findByIdAndDelete(chatID);
        if (!chat)
            throw new Error("Chat not found");
        return res.status(200).json({
            status: "success",
            message: "Chat deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.deleteChat = deleteChat;
// =======================
// Get Messages
// =======================
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID } = req.query;
        const messages = yield message_1.default.find({ chat: chatID })
            .populate("sender", "name avatar")
            .sort({ createdAt: 1 });
        return res.status(200).json({
            status: "success",
            message: "Messages fetched successfully",
            data: messages,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.getMessages = getMessages;
// =======================
// Make Admin
// =======================
const makeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { groupID, userID } = req.query;
        const group = yield chat_1.default.findById(groupID);
        if (!group)
            throw new Error("Group not found");
        if (group.admin.includes(userID))
            throw new Error("User is already admin");
        group.admin.push(userID);
        yield group.save();
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.MAKE_GROUP_ADMIN, group.members);
        return res.status(200).json({
            status: "success",
            message: "User promoted to admin",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.makeAdmin = makeAdmin;
// =======================
// Remove Admin
// =======================
const removeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { groupID, userID } = req.query;
        const group = yield chat_1.default.findById(groupID);
        if (!group)
            throw new Error("Group not found");
        if (!group.admin.includes(userID))
            throw new Error("User is not an admin");
        group.admin = group.admin.filter((id) => id !== userID);
        yield group.save();
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REMOVE_GROUP_ADMIN, group.members);
        return res.status(200).json({
            status: "success",
            message: "User removed from admin role",
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
});
exports.removeAdmin = removeAdmin;
