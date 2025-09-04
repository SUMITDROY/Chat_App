import { Schema, model, models, Document } from "mongoose";

/**
 * Enum for user status
 */
export type UserStatus = "ONLINE" | "OFFLINE";

/**
 * Interface for Avatar
 */
export interface IAvatar {
  public_id: string;
  url: string;
}

/**
 * Interface for User Document
 */
export interface IUser extends Document {
  name: string;
  username: string;
  bio: string;
  password: string;
  status: UserStatus;
  avatar: IAvatar;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

/**
 * User Model
 */
const User = models.User || model<IUser>("User", userSchema);

export default User;
