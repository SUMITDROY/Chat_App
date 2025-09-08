"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
/**
 * Chat Schema
 */
const chatSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    groupChat: {
        type: Boolean,
        default: false,
    },
    groupImg: {
        type: String,
    },
    groupImgPublicId: {
        type: String,
    },
    creator: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
    },
    admin: [
        {
            type: mongoose_1.Types.ObjectId,
            ref: "User",
        },
    ],
    latestMessage: {
        type: mongoose_1.Types.ObjectId,
        ref: "Message",
    },
    latestMessageTime: {
        type: Date,
        default: Date.now,
    },
    members: [
        {
            type: mongoose_1.Types.ObjectId,
            ref: "User",
        },
    ],
}, { timestamps: true });
/**
 * Chat Model
 */
const Chat = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
exports.default = Chat;
