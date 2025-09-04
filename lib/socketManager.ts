// socketManager.ts

// A map to store userID -> socketID
const userSocketIDs: Map<string, string> = new Map();

/**
 * Get the entire userSocketIDs map
 */
export const getUserSocketIDs = (): Map<string, string> => userSocketIDs;

/**
 * Add a socket ID for a user
 */
export const addSocketID = (userID: string, socketID: string): void => {
  userSocketIDs.set(userID, socketID);
  console.log(userSocketIDs, "userSocketIDs");
};

/**
 * Remove a socket ID for a user
 */
export const removeSocketID = (userID: string): void => {
  userSocketIDs.delete(userID);
};

/**
 * Get an array of socket IDs for a list of user IDs
 */
export const getSocketID = (userIDs: string[]): (string | undefined)[] => {
  return userIDs.map((userId) => userSocketIDs.get(userId.toString()));
};

/**
 * Get socket IDs for a list of users excluding the emitter's user ID
 */
export const getSocketIDWithoutEmitter = (
  userIDs: string[],
  currentUserID: string
): (string | undefined)[] => {
  return userIDs.map((userId) => {
    if (userId === currentUserID) {
      return undefined;
    }
    return userSocketIDs.get(userId.toString());
  });
};
