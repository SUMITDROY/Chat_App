import { Router } from "express";
import {
  getAllUsers,
  allChats,
  allMessages,
  getDashboardStats,
  verifyAdmin,
} from "../../controllers/admin.controller";
import { isAuthenticated } from "../../middlewares/auth";

const adminRoutes = Router();

// ✅ Apply authentication middleware to all admin routes
adminRoutes.use(isAuthenticated);

// ✅ Admin verification route
adminRoutes.get("/", verifyAdmin);

// ✅ Fetch all users
adminRoutes.get("/users", getAllUsers);

// ✅ Fetch all chats
adminRoutes.get("/chats", allChats);

// ✅ Fetch all messages
adminRoutes.get("/messages", allMessages);

// ✅ Fetch dashboard statistics
adminRoutes.get("/stats", getDashboardStats);

export default adminRoutes;
