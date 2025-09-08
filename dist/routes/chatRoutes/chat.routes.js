"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../../controllers/chat.controller");
const user_controller_1 = require("../../controllers/user.controller");
const auth_1 = require("../../middlewares/auth");
const multer_1 = require("../../middlewares/multer");
const chatRoutes = (0, express_1.Router)();
/**
 * ✅ Apply authentication middleware globally
 * All routes below this line will require authentication
 */
chatRoutes.use(auth_1.isAuthenticated);
/**
 * @route   POST /api/chats/new-group
 * @desc    Create a new group chat
 */
chatRoutes.post("/new-group", multer_1.singleAvatar, chat_controller_1.newGroupChat);
/**
 * @route   GET /api/chats/get-my-chat
 * @desc    Get all chats for the logged-in user
 */
chatRoutes.get("/get-my-chat", chat_controller_1.getMyChat);
/**
 * @route   POST /api/chats/make-admin
 * @desc    Promote a member to group admin
 */
chatRoutes.post("/make-admin", chat_controller_1.makeAdmin);
/**
 * @route   POST /api/chats/remove-admin
 * @desc    Remove a member from group admin
 */
chatRoutes.post("/remove-admin", chat_controller_1.removeAdmin);
/**
 * @route   GET /api/chats/get-my-group
 * @desc    Get groups created or managed by logged-in user
 */
chatRoutes.get("/get-my-group", chat_controller_1.getMyGroup);
/**
 * @route   GET /api/chats/get-my-memberNotInGroup
 * @desc    Get friends who are not in the group
 */
chatRoutes.get("/get-my-memberNotInGroup", user_controller_1.getMyFriends);
/**
 * @route   PUT /api/chats/add-members
 * @desc    Add new members to a group
 */
chatRoutes.put("/add-members", chat_controller_1.addMembers);
/**
 * @route   PUT /api/chats/remove-member
 * @desc    Remove a member from a group
 */
chatRoutes.put("/remove-member", chat_controller_1.removeMember);
/**
 * @route   DELETE /api/chats/leave-group/:id
 * @desc    Leave a group chat
 */
chatRoutes.delete("/leave-group/:id", chat_controller_1.leaveGroup);
/**
 * @route   POST /api/chats/message
 * @desc    Send attachments in a chat
 */
chatRoutes.post("/message", multer_1.attachmentsMulter, chat_controller_1.sendAttachments);
/**
 * @route   GET /api/chats/message/:id
 * @desc    Get all messages for a specific chat
 */
chatRoutes.get("/message/:id", chat_controller_1.getMessages);
/**
 * @route   GET /api/chats/edit/:id
 * @desc    Get group chat details for editing
 */
chatRoutes.get("/edit/:id", chat_controller_1.getChatDetailsEdit);
/**
 * @route   PUT /api/chats/edit/:id
 * @desc    Change group name
 */
chatRoutes.put("/edit/:id", chat_controller_1.changeGroupName);
/**
 * @route   GET, PUT, DELETE /api/chats/:id
 * @desc    Get, update, or delete a chat
 */
chatRoutes
    .route("/:id")
    .get(chat_controller_1.getChatDetails)
    .put(chat_controller_1.renameGroup)
    .delete(chat_controller_1.deleteChat);
exports.default = chatRoutes;
