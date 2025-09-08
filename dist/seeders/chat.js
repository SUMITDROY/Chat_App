"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageInAChat = exports.createMessage = exports.createGroupChats = exports.createSinglePersonChats = void 0;
const user_1 = __importDefault(require("../models/user"));
const chat_1 = __importDefault(require("../models/chat"));
const message_1 = __importDefault(require("../models/message"));
const faker_1 = require("@faker-js/faker");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Create one-on-one (single person) chat for every unique pair of users
 * @param numChats - Number of chats to create (not used in this version since it's pair-based)
 */
const createSinglePersonChats = (numChats) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find().select("_id");
        const chatsPromise = [];
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                chatsPromise.push(chat_1.default.create({
                    name: faker_1.faker.lorem.words(2),
                    members: [users[i]._id, users[j]._id],
                }));
            }
        }
        yield Promise.all(chatsPromise);
        console.log("✅ Single-person chats created successfully!");
        process.exit();
    }
    catch (error) {
        console.error("❌ Error creating single-person chats:", error);
        process.exit(1);
    }
});
exports.createSinglePersonChats = createSinglePersonChats;
/**
 * Create random group chats with random members
 * @param numChats - Number of group chats to create
 */
const createGroupChats = (numChats) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find().select("_id");
        const chatsPromise = [];
        for (let i = 0; i < numChats; i++) {
            const numMembers = faker_1.simpleFaker.number.int({ min: 3, max: users.length });
            const members = [];
            while (members.length < numMembers) {
                const randomUser = users[Math.floor(Math.random() * users.length)]._id;
                // Avoid duplicate members
                // @ts-ignore
                if (!members.includes(randomUser)) {
                    // @ts-ignore
                    members.push(randomUser);
                }
            }
            const chat = chat_1.default.create({
                groupChat: true,
                name: faker_1.faker.lorem.word(),
                members,
                creator: members[0],
            });
            chatsPromise.push(chat);
        }
        yield Promise.all(chatsPromise);
        console.log("✅ Group chats created successfully!");
        process.exit();
    }
    catch (error) {
        console.error("❌ Error creating group chats:", error);
        process.exit(1);
    }
});
exports.createGroupChats = createGroupChats;
/**
 * Create random messages across different chats
 * @param numMessages - Number of messages to create
 */
const createMessage = (numMessages) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find().select("_id");
        const chats = yield chat_1.default.find().select("_id");
        const messagePromise = [];
        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)]._id;
            const randomChat = chats[Math.floor(Math.random() * chats.length)]._id;
            messagePromise.push(message_1.default.create({
                chat: randomChat,
                sender: randomUser,
                content: faker_1.faker.lorem.sentence(),
            }));
        }
        yield Promise.all(messagePromise);
        console.log("✅ Random messages created successfully!");
        process.exit();
    }
    catch (error) {
        console.error("❌ Error creating messages:", error);
        process.exit(1);
    }
});
exports.createMessage = createMessage;
/**
 * Create random messages in a specific chat
 * @param chatID - The ID of the chat to add messages to
 * @param numMessages - Number of messages to create
 */
const createMessageInAChat = (chatID, numMessages) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find().select("_id");
        const messagePromise = [];
        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)]._id;
            messagePromise.push(message_1.default.create({
                chat: new mongoose_1.default.Types.ObjectId(chatID),
                sender: randomUser,
                content: faker_1.faker.lorem.sentence(),
            }));
        }
        yield Promise.all(messagePromise);
        console.log(`✅ ${numMessages} messages created in chat ${chatID}`);
        process.exit();
    }
    catch (error) {
        console.error("❌ Error creating messages in chat:", error);
        process.exit(1);
    }
});
exports.createMessageInAChat = createMessageInAChat;
