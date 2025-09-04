import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// Configure multer with file size limit
const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 20, // 20MB limit
  },
});

/**
 * Middleware to handle single avatar upload
 * Field name: "avatar"
 */
const singleAvatar = multerUpload.single("avatar");

/**
 * Middleware to handle multiple file uploads
 * Field name: "files"
 * Max count: 5 files
 */
const attachmentsMulter = multerUpload.array("files", 5);

export { multerUpload, singleAvatar, attachmentsMulter };
