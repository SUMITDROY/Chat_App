"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../../controllers/admin.controller");
const auth_1 = require("../../middlewares/auth");
const adminRoutes = (0, express_1.Router)();
// ✅ Apply authentication middleware to all admin routes
adminRoutes.use(auth_1.isAuthenticated);
// ✅ Admin verification route
adminRoutes.get("/", admin_controller_1.verifyAdmin);
// ✅ Fetch all users
adminRoutes.get("/users", admin_controller_1.getAllUsers);
// ✅ Fetch all chats
adminRoutes.get("/chats", admin_controller_1.allChats);
// ✅ Fetch all messages
adminRoutes.get("/messages", admin_controller_1.allMessages);
// ✅ Fetch dashboard statistics
adminRoutes.get("/stats", admin_controller_1.getDashboardStats);
exports.default = adminRoutes;
