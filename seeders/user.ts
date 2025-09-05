const User = require("../models/user");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

/**
 * Creates multiple fake users in the database
 * @param {number} numUsers - Number of users to create
 */
// @ts-ignore
const createUserMultiple = async (numUsers) => {
  try {
    const userPromise = [];

    // Default password for all fake users
    const password = "Password";

    for (let i = 0; i < numUsers; i++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        username: faker.internet.userName(),
        bio: faker.lorem.sentence(20),
        password: await bcrypt.hash(password, 10),
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });

      userPromise.push(tempUser);
    }

    // Wait for all user creations to complete
    await Promise.all(userPromise);

    console.log(`✅ Users created: ${numUsers}`);
    process.exit(0); // Exit cleanly
  } catch (error) {
    console.error("❌ Error creating users:", error);
    process.exit(1); // Exit with failure
  }
};

module.exports = {
  createUserMultiple,
};
