"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
/**
 * Request Schema
 */
const requestSchema = new mongoose_1.Schema({
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected"],
    },
    // @ts-ignore
    sender: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // @ts-ignore
    receiver: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
/**
 * Request Model
 */
const Request = mongoose_1.models.Request || (0, mongoose_1.model)("Request", requestSchema);
exports.default = Request;
