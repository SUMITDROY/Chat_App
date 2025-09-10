"use strict";
// socketManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIDWithoutEmitter = exports.getSocketID = exports.unregisterSocket = exports.registerSocket = exports.getUserSocketIDs = void 0;
// A map to store userID -> socketID
const userSocketIDs = new Map();
/**
 * Get the entire userSocketIDs map
 */
const getUserSocketIDs = () => userSocketIDs;
exports.getUserSocketIDs = getUserSocketIDs;
/**
 * Register a socket ID for a user
 */
const registerSocket = (userID, socketID) => {
    userSocketIDs.set(userID, socketID);
    console.log("✅ Registered Socket:", userSocketIDs);
};
exports.registerSocket = registerSocket;
/**
 * Unregister a socket ID for a user
 */
const unregisterSocket = (userID) => {
    userSocketIDs.delete(userID);
    console.log(`❌ Socket removed for user: ${userID}`);
};
exports.unregisterSocket = unregisterSocket;
/**
 * Get an array of socket IDs for a list of user IDs
 */
const getSocketID = (userIDs) => {
    return userIDs.map((userId) => userSocketIDs.get(userId.toString()));
};
exports.getSocketID = getSocketID;
/**
 * Get socket IDs for a list of users excluding the emitter's user ID
 */
const getSocketIDWithoutEmitter = (userIDs, currentUserID) => {
    return userIDs
        .filter((userId) => userId !== currentUserID)
        .map((userId) => userSocketIDs.get(userId.toString()));
};
exports.getSocketIDWithoutEmitter = getSocketIDWithoutEmitter;
