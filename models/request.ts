import { Schema, model, models, Types, Document } from "mongoose";

/**
 * Enum for request status
 */
export type RequestStatus = "pending" | "accepted" | "rejected";

/**
 * Interface for Request Document
 */
export interface IRequest extends Document {
  status: RequestStatus;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request Schema
 */
const requestSchema = new Schema<IRequest>(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    // @ts-ignore
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    // @ts-ignore
    receiver: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Request Model
 */
const Request = models.Request || model<IRequest>("Request", requestSchema);

export default Request;
