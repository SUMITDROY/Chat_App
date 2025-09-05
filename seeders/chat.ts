import User, { IUser } from "../models/user";
import Chat, { IChat } from "../models/chat";
import Message, { IMessage } from "../models/message";
import { faker, simpleFaker } from "@faker-js/faker";
import mongoose, { Types } from "mongoose";

/**
 * Create one-on-one (single person) chat for every unique pair of users
 * @param numChats - Number of chats to create (not used in this version since it's pair-based)
 */
export const createSinglePersonChats = async (
  numChats: number
): Promise<void> => {
  try {
    const users: Pick<IUser, "_id">[] = await User.find().select("_id");

    const chatsPromise: Promise<IChat>[] = [];

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        chatsPromise.push(
          Chat.create({
            name: faker.lorem.words(2),
            members: [users[i]._id, users[j]._id],
          })
        );
      }
    }

    await Promise.all(chatsPromise);
    console.log("✅ Single-person chats created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating single-person chats:", error);
    process.exit(1);
  }
};

/**
 * Create random group chats with random members
 * @param numChats - Number of group chats to create
 */
export const createGroupChats = async (numChats: number): Promise<void> => {
  try {
    const users: Pick<IUser, "_id">[] = await User.find().select("_id");
    const chatsPromise: Promise<IChat>[] = [];

    for (let i = 0; i < numChats; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members: Types.ObjectId[] = [];

      while (members.length < numMembers) {
        const randomUser = users[Math.floor(Math.random() * users.length)]._id;

        // Avoid duplicate members
        // @ts-ignore
        if (!members.includes(randomUser)) {
          // @ts-ignore
          members.push(randomUser);
        }
      }

      const chat = Chat.create({
        groupChat: true,
        name: faker.lorem.word(),
        members,
        creator: members[0],
      });

      chatsPromise.push(chat);
    }

    await Promise.all(chatsPromise);
    console.log("✅ Group chats created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating group chats:", error);
    process.exit(1);
  }
};

/**
 * Create random messages across different chats
 * @param numMessages - Number of messages to create
 */
export const createMessage = async (numMessages: number): Promise<void> => {
  try {
    const users: Pick<IUser, "_id">[] = await User.find().select("_id");
    const chats: Pick<IChat, "_id">[] = await Chat.find().select("_id");

    const messagePromise: Promise<IMessage>[] = [];

    for (let i = 0; i < numMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]._id;
      const randomChat = chats[Math.floor(Math.random() * chats.length)]._id;

      messagePromise.push(
        Message.create({
          chat: randomChat,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagePromise);
    console.log("✅ Random messages created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating messages:", error);
    process.exit(1);
  }
};

/**
 * Create random messages in a specific chat
 * @param chatID - The ID of the chat to add messages to
 * @param numMessages - Number of messages to create
 */
export const createMessageInAChat = async (
  chatID: string,
  numMessages: number
): Promise<void> => {
  try {
    const users: Pick<IUser, "_id">[] = await User.find().select("_id");
    const messagePromise: Promise<IMessage>[] = [];

    for (let i = 0; i < numMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]._id;

      messagePromise.push(
        Message.create({
          chat: new mongoose.Types.ObjectId(chatID),
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagePromise);
    console.log(`✅ ${numMessages} messages created in chat ${chatID}`);
    process.exit();
  } catch (error) {
    console.error("❌ Error creating messages in chat:", error);
    process.exit(1);
  }
};
