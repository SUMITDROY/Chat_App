"use strict";
// helper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBase64 = exports.getOtherMember = void 0;
/**
 * Get the other member from a list of members, excluding the current user.
 */
const getOtherMember = (members, userID) => {
    return members.find((member) => member._id.toString() !== userID.toString());
};
exports.getOtherMember = getOtherMember;
/**
 * Convert file to Base64 format
 */
const getBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};
exports.getBase64 = getBase64;
// Example if you want to bring back getSockets later:
// export const getSockets = (users: Types.ObjectId[]) => {
//   return users.map(user => getSocketID(user.toString()));
// };
