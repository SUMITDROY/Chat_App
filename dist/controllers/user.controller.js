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
exports.getMyFriends = exports.getAllRequests = exports.acceptRequest = exports.sendRequest = exports.searchUsers = exports.logOut = exports.getUserProfileDetail = exports.getUser = exports.createUser = exports.loginUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const user_1 = __importDefault(require("../models/user"));
const chat_1 = __importDefault(require("../models/chat"));
const request_1 = __importDefault(require("../models/request"));
const features_1 = require("../utils/features");
const events_1 = require("../constants/events");
// =======================
// Controller Functions
// =======================
// ===== Login User =====
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, password } = req.body;
        const username = name.trim();
        if (!username || !password) {
            throw new Error("Both fields are required");
        }
        const user = yield user_1.default.findOne({ username }).select("+password");
        if (!user) {
            throw new Error("User not found");
        }
        const isPasswordCorrect = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error("Incorrect password");
        }
        (0, features_1.sendToken)(res, user, 200, `Welcome ${user.username}`);
        return res;
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.loginUser = loginUser;
// ===== Create New User =====
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let result;
    try {
        const { username, name, password, bio } = req.body;
        const file = req.file;
        const trimmedName = name.trim();
        const trimmedUserName = username.trim();
        if (!file) {
            throw new Error("Please upload avatar");
        }
        result = yield (0, features_1.uploadFilesToClodinary)([file], "profile_pics");
        const avatar = {
            public_id: result[0].public_id,
            url: result[0].url,
        };
        const hashedPass = yield bcrypt_1.default.hash(password, 10);
        yield user_1.default.create({
            name: trimmedName,
            username: trimmedUserName,
            password: hashedPass,
            bio,
            avatar,
        });
        return res.status(201).json({ message: "User created", status: "success" });
    }
    catch (error) {
        if (((_a = error === null || error === void 0 ? void 0 : error.errorResponse) === null || _a === void 0 ? void 0 : _a.code) === 11000 && result) {
            // @ts-ignore
            yield cloudinary_1.default.v2.uploader.destroy(result[0].public_id);
            const alreadyUsedValuesKey = Object.keys(error.keyPattern).join(",");
            error.message = `Add another ${alreadyUsedValuesKey}, it's already used`;
        }
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.createUser = createUser;
// ===== Get Current User =====
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const user = yield user_1.default.findById(req.userID);
        return res
            .status(200)
            .json({ status: "success", message: "User found", user });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getUser = getUser;
// ===== Get User Profile by ID =====
const getUserProfileDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userID } = req.query;
        const user = yield user_1.default.findById(userID);
        return res.status(200).json({
            status: "success",
            message: "User profile detail found",
            user,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getUserProfileDetail = getUserProfileDetail;
// ===== Logout User =====
const logOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return (res
            .status(200)
            // @ts-ignore
            .cookie("UserToken", "", Object.assign(Object.assign({}, features_1.cookieOptions), { maxAge: 0 }))
            .json({ status: "success", message: "Logout successfully" }));
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.logOut = logOut;
// ===== Search Users =====
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.query;
        const myChats = yield chat_1.default.find({
            groupChat: false,
            // @ts-ignore
            members: req.userID,
        }).populate("members", "name avatar");
        const otherUserFromMyChats = myChats.flatMap((chat) => chat.members);
        const friendList = yield user_1.default.find({
            _id: { $nin: otherUserFromMyChats },
            name: { $regex: name, $options: "i" },
        });
        const removedSelf = friendList.filter(
        // @ts-ignore
        (friend) => friend._id.toString() !== req.userID.toString());
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
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.searchUsers = searchUsers;
// ===== Send Friend Request =====
const sendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userID } = req.body;
        if (!userID)
            throw new Error("Please provide userID");
        // @ts-ignore
        if (userID === req.userID)
            throw new Error("You cannot send a request to yourself");
        const existingRequest = yield request_1.default.findOne({
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
        const requestData = yield request_1.default.create({
            // @ts-ignore
            sender: req.userID,
            receiver: userID,
        });
        const populatedRequest = yield request_1.default.findById(requestData._id)
            .populate("sender", "name avatar")
            .lean();
        // @ts-ignore
        if (populatedRequest === null || populatedRequest === void 0 ? void 0 : populatedRequest.sender) {
            // @ts-ignore
            populatedRequest.sender.avatar = populatedRequest.sender.avatar.url;
        }
        (0, features_1.emitEvent)(req, events_1.NEW_REQUEST, [userID], populatedRequest);
        return res
            .status(200)
            .json({ status: "success", message: "Friend request has been sent" });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.sendRequest = sendRequest;
// ===== Accept or Reject Friend Request =====
const acceptRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestID, accept } = req.body;
        if (!requestID)
            throw new Error("Please provide requestID");
        const request = yield request_1.default.findById(requestID)
            .populate("sender", "name")
            .populate("receiver", "name");
        if (!request)
            throw new Error("Invalid request ID");
        // @ts-ignore
        if (request.receiver._id.toString() !== req.userID.toString()) {
            throw new Error("You are not authorized to accept this request");
        }
        if (!accept) {
            yield request.deleteOne();
            return res
                .status(200)
                .json({ status: "success", message: "Request rejected" });
        }
        const members = [request.sender._id, request.receiver._id];
        yield Promise.all([
            chat_1.default.create({
                members,
                latestMessage: null,
                name: `${request.sender.name}-${request.receiver.name}`,
            }),
            request.deleteOne(),
        ]);
        // @ts-ignore
        (0, features_1.emitEvent)(req, events_1.REFETCH_CHATS, members);
        return res.status(200).json({
            status: "success",
            message: "Friend request accepted",
            senderId: request.sender._id,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.acceptRequest = acceptRequest;
// ===== Get All Friend Requests =====
const getAllRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const requests = yield request_1.default.find({ receiver: req.userID }).populate("sender", "name avatar");
        const modifiedRequests = requests.map(({ _id, sender }) => ({
            _id,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar.url,
            },
        }));
        return res.status(200).json({ status: "success", data: modifiedRequests });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getAllRequests = getAllRequests;
// ===== Get Friends Not in a Group =====
const getMyFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { chatID, name } = req.query;
        if (!chatID) {
            return res
                .status(400)
                .json({ status: "error", message: "Chat ID is required" });
        }
        const chat = yield chat_1.default.findById(chatID).populate("members", "name avatar");
        if (!chat) {
            return res
                .status(404)
                .json({ status: "error", message: "Chat not found" });
        }
        // @ts-ignore
        const friends = chat.members.filter(
        // @ts-ignore
        (member) => member._id.toString() !== req.userID.toString());
        return res.status(200).json({ status: "success", friends });
    }
    catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getMyFriends = getMyFriends;
