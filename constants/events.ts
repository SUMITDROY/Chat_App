// ---------- Event Constants ----------

export const ALERT = "ALERT";
export const REFETCH_CHATS = "REFETCH_CHATS";
export const REFETCH_GROUP_DETAIL = "REFETCH_GROUP_DETAIL";
export const ADDED_IN_GROUP = "ADDED_IN_GROUP";

export const NEW_ATTACHMENT = "NEW_ATTACHMENT";
export const NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";

export const NEW_REQUEST = "NEW_REQUEST";
export const USER_ONLINE = "USER_ONLINE";
export const USER_OFFLINE = "USER_OFFLINE";
export const NEW_MESSAGE = "NEW_MESSAGE";
export const TYPING_MESSAGE = "TYPING_MESSAGE";
export const TYPING_STOPPED_MESSAGE = "TYPING_STOPPED_MESSAGE";
export const MAKE_GROUP_ADMIN = "MAKE_GROUP_ADMIN";
export const REMOVE_GROUP_ADMIN = "REMOVE_GROUP_ADMIN";

// ---------- Type for Event Keys ----------

export type SocketEvent =
  | typeof ALERT
  | typeof REFETCH_CHATS
  | typeof REFETCH_GROUP_DETAIL
  | typeof ADDED_IN_GROUP
  | typeof NEW_ATTACHMENT
  | typeof NEW_MESSAGE_ALERT
  | typeof NEW_REQUEST
  | typeof USER_ONLINE
  | typeof USER_OFFLINE
  | typeof NEW_MESSAGE
  | typeof TYPING_MESSAGE
  | typeof TYPING_STOPPED_MESSAGE
  | typeof MAKE_GROUP_ADMIN
  | typeof REMOVE_GROUP_ADMIN;

// ---------- Default Export (optional) ----------

const events = {
  ALERT,
  REFETCH_CHATS,
  REFETCH_GROUP_DETAIL,
  ADDED_IN_GROUP,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  NEW_REQUEST,
  USER_ONLINE,
  USER_OFFLINE,
  NEW_MESSAGE,
  TYPING_MESSAGE,
  TYPING_STOPPED_MESSAGE,
  MAKE_GROUP_ADMIN,
  REMOVE_GROUP_ADMIN,
};

export default events;
