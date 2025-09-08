"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_routes_1 = __importDefault(require("./adminRoutes/admin.routes"));
const chat_routes_1 = __importDefault(require("./chatRoutes/chat.routes"));
const userroutes_1 = __importDefault(require("./userRoutes/userroutes"));
const allRoutes = (0, express_1.Router)();
/**
 * @route /api/user
 * @desc  All user-related routes
 */
allRoutes.use("/user", userroutes_1.default);
/**
 * @route /api/chat
 * @desc  All chat-related routes
 */
allRoutes.use("/chat", chat_routes_1.default);
/**
 * @route /api/admin
 * @desc  All admin-related routes
 */
allRoutes.use("/admin", admin_routes_1.default);
exports.default = allRoutes;
