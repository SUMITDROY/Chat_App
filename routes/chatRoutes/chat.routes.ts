import { Router } from "express";
import {
  newGroupChat,
  getMyChat,
  getMyGroup,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
  getChatDetailsEdit,
  changeGroupName,
  makeAdmin,
  removeAdmin,
} from "../../controllers/chat.controller";
import { getMyFriends } from "../../controllers/user.controller";
import { isAuthenticated } from "../../middlewares/auth";
import { attachmentsMulter, singleAvatar } from "../../middlewares/multer";

const chatRoutes = Router();

/**
 * ✅ Apply authentication middleware globally
 * All routes below this line will require authentication
 */
chatRoutes.use(isAuthenticated);

/**
 * @route   POST /api/chats/new-group
 * @desc    Create a new group chat
 */
chatRoutes.post("/new-group", singleAvatar, newGroupChat);

/**
 * @route   GET /api/chats/get-my-chat
 * @desc    Get all chats for the logged-in user
 */
chatRoutes.get("/get-my-chat", getMyChat);

/**
 * @route   POST /api/chats/make-admin
 * @desc    Promote a member to group admin
 */
chatRoutes.post("/make-admin", makeAdmin);

/**
 * @route   POST /api/chats/remove-admin
 * @desc    Remove a member from group admin
 */
chatRoutes.post("/remove-admin", removeAdmin);

/**
 * @route   GET /api/chats/get-my-group
 * @desc    Get groups created or managed by logged-in user
 */
chatRoutes.get("/get-my-group", getMyGroup);

/**
 * @route   GET /api/chats/get-my-memberNotInGroup
 * @desc    Get friends who are not in the group
 */
chatRoutes.get("/get-my-memberNotInGroup", getMyFriends);

/**
 * @route   PUT /api/chats/add-members
 * @desc    Add new members to a group
 */
chatRoutes.put("/add-members", addMembers);

/**
 * @route   PUT /api/chats/remove-member
 * @desc    Remove a member from a group
 */
chatRoutes.put("/remove-member", removeMember);

/**
 * @route   DELETE /api/chats/leave-group/:id
 * @desc    Leave a group chat
 */
chatRoutes.delete("/leave-group/:id", leaveGroup);

/**
 * @route   POST /api/chats/message
 * @desc    Send attachments in a chat
 */
chatRoutes.post("/message", attachmentsMulter, sendAttachments);

/**
 * @route   GET /api/chats/message/:id
 * @desc    Get all messages for a specific chat
 */
chatRoutes.get("/message/:id", getMessages);

/**
 * @route   GET /api/chats/edit/:id
 * @desc    Get group chat details for editing
 */
chatRoutes.get("/edit/:id", getChatDetailsEdit);

/**
 * @route   PUT /api/chats/edit/:id
 * @desc    Change group name
 */
chatRoutes.put("/edit/:id", changeGroupName);

/**
 * @route   GET, PUT, DELETE /api/chats/:id
 * @desc    Get, update, or delete a chat
 */
chatRoutes
  .route("/:id")
  .get(getChatDetails)
  .put(renameGroup)
  .delete(deleteChat);

export default chatRoutes;
