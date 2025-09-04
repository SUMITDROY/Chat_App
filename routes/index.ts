import { Router } from "express";
import adminRoutes from "./adminRoutes/admin.routes";
import chatRoutes from "./chatRoutes/chat.routes";
import userRoutes from "./userRoutes/userroutes";

const allRoutes = Router();

/**
 * @route /api/user
 * @desc  All user-related routes
 */
allRoutes.use("/user", userRoutes);

/**
 * @route /api/chat
 * @desc  All chat-related routes
 */
allRoutes.use("/chat", chatRoutes);

/**
 * @route /api/admin
 * @desc  All admin-related routes
 */
allRoutes.use("/admin", adminRoutes);

export default allRoutes;
