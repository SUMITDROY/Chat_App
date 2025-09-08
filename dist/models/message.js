"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
/**
 * Message Schema
 */
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
    },
    attachements: [
        {
            _id: false,
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    // @ts-ignore
    sender: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // @ts-ignore
    chat: {
        type: mongoose_1.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
}, { timestamps: true });
/**
 * Message Model
 */
const Message = mongoose_1.models.Message || (0, mongoose_1.model)("Message", messageSchema);
exports.default = Message;
