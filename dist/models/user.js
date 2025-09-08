"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
/**
 * User Schema
 */
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
    },
    bio: {
        type: String,
        required: [true, "Bio is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false, // Hidden by default for security
    },
    status: {
        type: String,
        enum: ["ONLINE", "OFFLINE"],
        default: "OFFLINE",
    },
    avatar: {
        public_id: {
            type: String,
            required: [true, "Avatar public_id is required"],
        },
        url: {
            type: String,
            required: [true, "Avatar URL is required"],
        },
    },
}, { timestamps: true });
/**
 * User Model
 */
const User = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
exports.default = User;
