"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentsMulter = exports.singleAvatar = exports.multerUpload = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer with file size limit
const multerUpload = (0, multer_1.default)({
    limits: {
        fileSize: 1024 * 1024 * 20, // 20MB limit
    },
});
exports.multerUpload = multerUpload;
/**
 * Middleware to handle single avatar upload
 * Field name: "avatar"
 */
const singleAvatar = multerUpload.single("avatar");
exports.singleAvatar = singleAvatar;
/**
 * Middleware to handle multiple file uploads
 * Field name: "files"
 * Max count: 5 files
 */
const attachmentsMulter = multerUpload.array("files", 5);
exports.attachmentsMulter = attachmentsMulter;
