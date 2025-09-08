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
const User = require("../models/user");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");
/**
 * Creates multiple fake users in the database
 * @param {number} numUsers - Number of users to create
 */
// @ts-ignore
const createUserMultiple = (numUsers) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userPromise = [];
        // Default password for all fake users
        const password = "Password";
        for (let i = 0; i < numUsers; i++) {
            const tempUser = User.create({
                name: faker.person.fullName(),
                username: faker.internet.userName(),
                bio: faker.lorem.sentence(20),
                password: yield bcrypt.hash(password, 10),
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName(),
                },
            });
            userPromise.push(tempUser);
        }
        // Wait for all user creations to complete
        yield Promise.all(userPromise);
        console.log(`✅ Users created: ${numUsers}`);
        process.exit(0); // Exit cleanly
    }
    catch (error) {
        console.error("❌ Error creating users:", error);
        process.exit(1); // Exit with failure
    }
});
module.exports = {
    createUserMultiple,
};
