import { Schema, model, models, Types, Document } from "mongoose";

/**
 * Interface for Chat Document
 */
export interface IChat extends Document {
  name: string;
  groupChat: boolean;
  groupImg?: string;
  groupImgPublicId?: string;
  creator?: Types.ObjectId;
  admin: Types.ObjectId[];
  latestMessage?: Types.ObjectId;
  latestMessageTime: Date;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat Schema
 */
const chatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    groupImg: {
      type: String,
    },
    groupImgPublicId: {
      type: String,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    admin: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: Types.ObjectId,
      ref: "Message",
    },
    latestMessageTime: {
      type: Date,
      default: Date.now,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

/**
 * Chat Model
 */
const Chat = models.Chat || model<IChat>("Chat", chatSchema);

export default Chat;
