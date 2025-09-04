// helper.ts

import { getSocketID } from "./socketManager";
import { Types } from "mongoose";
import { Express } from "express";

/**
 * Get the other member from a list of members, excluding the current user.
 */
export const getOtherMember = (
  members: Array<{ _id: Types.ObjectId }>,
  userID: Types.ObjectId | string
) => {
  return members.find((member) => member._id.toString() !== userID.toString());
};

/**
 * Convert file to Base64 format
 */
export const getBase64 = (file: Express.Multer.File): string => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

// Example if you want to bring back getSockets later:
// export const getSockets = (users: Types.ObjectId[]) => {
//   return users.map(user => getSocketID(user.toString()));
// };
