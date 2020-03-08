const fs = require('fs');
const path = require('path');

const WebhookStore = require('./src/webhook-store');
const UserStore = require('./src/user-store');

const DATA_DIRECTORY = process.env.DATA_DIRECTORY || './data';
const WEBHOOKS_DIRECTORY = `${DATA_DIRECTORY}/webhooks`;
const WEBHOOK_STORE_FILE = `${DATA_DIRECTORY}/webhooks.sqlite3`;
const USER_STORE_FILE = `${DATA_DIRECTORY}/users.sqlite3`;

async function main() {
  const webhookStore = new WebhookStore();
  const userStore = new UserStore();

  // Initialize the webhook store
  await webhookStore.load(WEBHOOK_STORE_FILE);
  await userStore.load(USER_STORE_FILE);

  const filePaths = await fs.promises.readdir(WEBHOOKS_DIRECTORY);
  for (const filePath of filePaths) {
    try {
      const file = path.resolve(WEBHOOKS_DIRECTORY, `./${filePath}`);
      const content = await fs.promises.readFile(file); // eslint-disable-line  no-await-in-loop
      const webhook = JSON.parse(content);
      const {birthtime} = await fs.promises.stat(file); // eslint-disable-line no-await-in-loop
      webhookStore.store(webhook, birthtime);
    } catch (error) {
      throw new Error(`Unable to read stored webhook '${filePath}'`, error);
    }
  }

  const store = require(path.resolve(DATA_DIRECTORY, './store.json'));
  for (const user of store.users) {
    const values = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    };

    await userStore.createOrUpdateUser(values); // eslint-disable-line  no-await-in-loop

    for (const achievement of user.achievements)
      await userStore.unlockAchievement(values, achievement.name, achievement.timestamp); // eslint-disable-line  no-await-in-loop
  }
}

main();
