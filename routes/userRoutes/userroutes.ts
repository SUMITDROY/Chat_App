import { Router } from "express";
import {
  getUser,
  createUser,
  loginUser,
  logOut,
  searchUsers,
  sendRequest,
  acceptRequest,
  getAllRequests,
  getMyFriends,
  getUserProfileDetail,
  getAllUser,
} from "../../controllers/user.controller";

import { registerValidator, validateHandle } from "../../lib/validators";
import { isAuthenticated } from "../../middlewares/auth";
import { singleAvatar } from "../../middlewares/multer";

const userRoutes = Router();

/**
 * @route   POST /api/users/create
 * @desc    Register a new user
 * @access  Public
 */
userRoutes.post(
  "/create",
  singleAvatar,
  registerValidator(),
  validateHandle,
  createUser
);

/**
 * @route   POST /api/users
 * @desc    Login user
 * @access  Public
 */
userRoutes.post("/", loginUser);

/**
 * ✅ Apply authentication middleware globally
 * All routes below this line will require authentication
 */
userRoutes.use(isAuthenticated);

/**
 * @route   GET /api/users/get-user
 * @desc    Get current logged-in user details
 */
userRoutes.get("/get-user", getUser);

/**
 * @route   GET /api/users/all-users
 * @desc    Get all users
 */
userRoutes.get("/all-users", getAllUser);

/**
 * @route   GET /api/users/get-user-profile-detail
 * @desc    Get a specific user profile detail
 */
userRoutes.get("/get-user-profile-detail", getUserProfileDetail);

/**
 * @route   GET /api/users/logout
 * @desc    Logout the current user
 */
userRoutes.get("/logout", logOut);

/**
 * @route   GET /api/users/search-users
 * @desc    Search for users
 */
userRoutes.get("/search-users", searchUsers);

/**
 * @route   PUT /api/users/send-request
 * @desc    Send a friend request
 */
userRoutes.put("/send-request", sendRequest);

/**
 * @route   PUT /api/users/accept-request
 * @desc    Accept a friend request
 */
userRoutes.put("/accept-request", acceptRequest);

/**
 * @route   GET /api/users/get-all-requests
 * @desc    Get all friend requests
 */
userRoutes.get("/get-all-requests", getAllRequests);

/**
 * @route   GET /api/users/get-all-friends
 * @desc    Get all friends of logged-in user
 */
userRoutes.get("/get-all-friends", getMyFriends);

export default userRoutes;
