"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../../controllers/user.controller");
const admin_controller_1 = require("../../controllers/admin.controller");
const validators_1 = require("../../lib/validators");
const validators_2 = require("../../lib/validators");
const auth_1 = require("../../middlewares/auth");
const multer_1 = require("../../middlewares/multer");
const userRoutes = (0, express_1.Router)();
/**
 * @route   POST /api/users/create
 * @desc    Register a new user
 * @access  Public
 */
userRoutes.post("/create", multer_1.singleAvatar, (0, validators_1.registerValidator)(), validators_2.validateHandle, user_controller_1.createUser);
/**
 * @route   POST /api/users
 * @desc    Login user
 * @access  Public
 */
userRoutes.post("/", user_controller_1.loginUser);
/**
 * ✅ Apply authentication middleware globally
 * All routes below this line will require authentication
 */
userRoutes.use(auth_1.isAuthenticated);
/**
 * @route   GET /api/users/get-user
 * @desc    Get current logged-in user details
 */
userRoutes.get("/get-user", user_controller_1.getUser);
/**
 * @route   GET /api/users/all-users
 * @desc    Get all users
 */
userRoutes.get("/all-users", admin_controller_1.getAllUsers);
/**
 * @route   GET /api/users/get-user-profile-detail
 * @desc    Get a specific user profile detail
 */
userRoutes.get("/get-user-profile-detail", user_controller_1.getUserProfileDetail);
/**
 * @route   GET /api/users/logout
 * @desc    Logout the current user
 */
userRoutes.get("/logout", user_controller_1.logOut);
/**
 * @route   GET /api/users/search-users
 * @desc    Search for users
 */
userRoutes.get("/search-users", user_controller_1.searchUsers);
/**
 * @route   PUT /api/users/send-request
 * @desc    Send a friend request
 */
userRoutes.put("/send-request", user_controller_1.sendRequest);
/**
 * @route   PUT /api/users/accept-request
 * @desc    Accept a friend request
 */
userRoutes.put("/accept-request", user_controller_1.acceptRequest);
/**
 * @route   GET /api/users/get-all-requests
 * @desc    Get all friend requests
 */
userRoutes.get("/get-all-requests", user_controller_1.getAllRequests);
/**
 * @route   GET /api/users/get-all-friends
 * @desc    Get all friends of logged-in user
 */
userRoutes.get("/get-all-friends", user_controller_1.getMyFriends);
exports.default = userRoutes;
