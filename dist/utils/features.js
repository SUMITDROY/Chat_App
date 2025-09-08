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
exports.deleteFilesFromClodinary = exports.uploadFilesToClodinary = exports.emitEvent = exports.sendToken = exports.connectDB = exports.cookieOptions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const socketManager_1 = require("../lib/socketManager");
// ======================
// Cookie Options
// ======================
exports.cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    sameSite: "none",
    httpOnly: true,
    secure: true,
};
// ======================
// MongoDB Connection
// ======================
const connectDB = (url) => __awaiter(void 0, void 0, void 0, function* () {
    mongoose_1.default
        .connect(url)
        .then(() => {
        console.log("✅ Connected to Database");
    })
        .catch((err) => {
        console.error("❌ DB Connection Error:", err);
    });
});
exports.connectDB = connectDB;
// ======================
// Send JWT Token Response
// ======================
const sendToken = (res, user, statusCode, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.JWT_SECRET);
    return res.status(statusCode).json({
        status: "success",
        message,
        user,
        token,
    });
});
exports.sendToken = sendToken;
// ======================
// Emit Socket Event
// ======================
const emitEvent = (req, event, users, data) => {
    const io = req.app.get("io");
    const membersSockets = (0, socketManager_1.getSocketID)(users);
    io.to(membersSockets).emit(event, data);
};
exports.emitEvent = emitEvent;
const uploadFilesToClodinary = (files, folder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uploadPromises = files.map((file) => {
            let finalFolder = folder;
            // Determine folder based on file type
            if (folder !== "profile_pics") {
                if (file.mimetype.startsWith("image/")) {
                    finalFolder = "image_attachments";
                }
                else if (file.mimetype.startsWith("audio/")) {
                    finalFolder = "audio_attachments";
                }
                else if (file.mimetype.startsWith("video/")) {
                    finalFolder = "video_attachments";
                }
                else {
                    finalFolder = "file_attachments";
                }
            }
            // Convert buffer to base64 for Cloudinary
            const base64String = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            return new Promise((resolve, reject) => {
                cloudinary_1.default.v2.uploader.upload(base64String, { resource_type: "auto", folder: finalFolder }, (error, result) => {
                    if (error || !result)
                        return reject(error);
                    resolve({
                        public_id: result.public_id,
                        url: result.secure_url,
                    });
                });
            });
        });
        return yield Promise.all(uploadPromises);
    }
    catch (error) {
        throw new Error(`Error uploading files to Cloudinary: ${error.message}`);
    }
});
exports.uploadFilesToClodinary = uploadFilesToClodinary;
// ======================
// Delete Files from Cloudinary
// ======================
const deleteFilesFromClodinary = (public_ids) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletePromises = public_ids.map((id) => cloudinary_1.default.v2.uploader.destroy(id));
        yield Promise.all(deletePromises);
        console.log("✅ Files deleted successfully from Cloudinary");
    }
    catch (error) {
        console.error("❌ Error deleting files from Cloudinary:", error.message);
        throw new Error(`Error deleting files: ${error.message}`);
    }
});
exports.deleteFilesFromClodinary = deleteFilesFromClodinary;
