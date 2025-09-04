import { Schema, model, models, Types, Document } from "mongoose";

/**
 * Interface for Attachment
 */
export interface IAttachment {
  public_id: string;
  url: string;
}

/**
 * Interface for Message Document
 */
export interface IMessage extends Document {
  content?: string;
  attachements: IAttachment[];
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Schema
 */
const messageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
    },
    attachements: [
      {
        _id: false,
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Message Model
 */
const Message = models.Message || model<IMessage>("Message", messageSchema);

export default Message;
