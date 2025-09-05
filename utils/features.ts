import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "cloudinary";
import { getSocketID } from "../lib/socketManager";
import { Request, Response } from "express";

// ======================
// Cookie Options
// ======================
export const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  sameSite: "none" as const,
  httpOnly: true,
  secure: true,
};

// ======================
// MongoDB Connection
// ======================
export const connectDB = async (url: string): Promise<void> => {
  mongoose
    .connect(url)
    .then(() => {
      console.log("✅ Connected to Database");
    })
    .catch((err: Error) => {
      console.error("❌ DB Connection Error:", err);
    });
};

// ======================
// Send JWT Token Response
// ======================
export const sendToken = async (
  res: Response,
  user: { _id: string },
  statusCode: number,
  message: string
): Promise<Response> => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res.status(statusCode).json({
    status: "success",
    message,
    user,
    token,
  });
};

// ======================
// Emit Socket Event
// ======================
export const emitEvent = (
  req: Request,
  event: string,
  users: string[],
  data: unknown
): void => {
  const io = req.app.get("io");
  const membersSockets = getSocketID(users);

  io.to(membersSockets).emit(event, data);
};

// ======================
// Upload Files to Cloudinary
// ======================
interface FileType {
  mimetype: string;
  buffer: Buffer;
}

export const uploadFilesToClodinary = async (
  files: FileType[],
  folder: string
): Promise<{ public_id: string; url: string }[]> => {
  try {
    const uploadPromises = files.map((file) => {
      let finalFolder = folder;

      // Determine folder based on file type
      if (folder !== "profile_pics") {
        if (file.mimetype.startsWith("image/")) {
          finalFolder = "image_attachments";
        } else if (file.mimetype.startsWith("audio/")) {
          finalFolder = "audio_attachments";
        } else if (file.mimetype.startsWith("video/")) {
          finalFolder = "video_attachments";
        } else {
          finalFolder = "file_attachments";
        }
      }

      // Convert buffer to base64 for Cloudinary
      const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      return new Promise<{ public_id: string; url: string }>(
        (resolve, reject) => {
          cloudinary.v2.uploader.upload(
            base64String,
            { resource_type: "auto", folder: finalFolder },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve({
                public_id: result.public_id,
                url: result.secure_url,
              });
            }
          );
        }
      );
    });

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    throw new Error(`Error uploading files to Cloudinary: ${error.message}`);
  }
};

// ======================
// Delete Files from Cloudinary
// ======================
export const deleteFilesFromClodinary = async (
  public_ids: string[]
): Promise<void> => {
  try {
    const deletePromises = public_ids.map((id) =>
      cloudinary.v2.uploader.destroy(id)
    );

    await Promise.all(deletePromises);
    console.log("✅ Files deleted successfully from Cloudinary");
  } catch (error: any) {
    console.error("❌ Error deleting files from Cloudinary:", error.message);
    throw new Error(`Error deleting files: ${error.message}`);
  }
};
