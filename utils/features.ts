const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const cloudinary = require("cloudinary");
const { getSocketID } = require("../lib/socketManager");

// ======================
// Cookie Options
// ======================
const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

// ======================
// MongoDB Connection
// ======================
const connectDB = async (url) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log("✅ Connected to Database");
    })
    .catch((err) => {
      console.error("❌ DB Connection Error:", err);
    });
};

// ======================
// Send JWT Token Response
// ======================
const sendToken = async (res, user, statusCode, message) => {
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
const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const membersSockets = getSocketID(users);

  io.to(membersSockets).emit(event, data);
};

// ======================
// Upload Files to Cloudinary
// ======================
const uploadFilesToClodinary = async (files, folder) => {
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
          finalFolder = "file_attachments"; // For unsupported file types
        }
      }

      // Convert buffer to base64 for Cloudinary
      const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(
          base64String,
          { resource_type: "auto", folder: finalFolder },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              public_id: result.public_id,
              url: result.secure_url,
            });
          }
        );
      });
    });

    // Wait for all uploads to complete
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Error uploading files to Cloudinary: ${error.message}`);
  }
};

// ======================
// Delete Files from Cloudinary
// ======================
const deleteFilesFromClodinary = async (public_ids) => {
  try {
    const deletePromises = public_ids.map((id) =>
      cloudinary.v2.uploader.destroy(id)
    );
    await Promise.all(deletePromises);

    console.log("✅ Files deleted successfully from Cloudinary");
  } catch (error) {
    console.error("❌ Error deleting files from Cloudinary:", error.message);
    throw new Error(`Error deleting files: ${error.message}`);
  }
};

// ======================
// Module Exports
// ======================
module.exports = {
  connectDB,
  sendToken,
  cookieOptions,
  emitEvent,
  uploadFilesToClodinary,
  deleteFilesFromClodinary,
};
