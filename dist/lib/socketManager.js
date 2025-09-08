"use strict";
// socketManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIDWithoutEmitter = exports.getSocketID = exports.removeSocketID = exports.addSocketID = exports.getUserSocketIDs = void 0;
// A map to store userID -> socketID
const userSocketIDs = new Map();
/**
 * Get the entire userSocketIDs map
 */
const getUserSocketIDs = () => userSocketIDs;
exports.getUserSocketIDs = getUserSocketIDs;
/**
 * Add a socket ID for a user
 */
const addSocketID = (userID, socketID) => {
    userSocketIDs.set(userID, socketID);
    console.log(userSocketIDs, "userSocketIDs");
};
exports.addSocketID = addSocketID;
/**
 * Remove a socket ID for a user
 */
const removeSocketID = (userID) => {
    userSocketIDs.delete(userID);
};
exports.removeSocketID = removeSocketID;
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
    return userIDs.map((userId) => {
        if (userId === currentUserID) {
            return undefined;
        }
        return userSocketIDs.get(userId.toString());
    });
};
exports.getSocketIDWithoutEmitter = getSocketIDWithoutEmitter;
