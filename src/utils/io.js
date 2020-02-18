const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
* Create a directory as needed.
* @param directory {String} - THe directory to create.
*/
async function createDirectory(directory) {
  await fs.promises.mkdir(directory, {recursive: true});
}

/**
* Store a webhook for later use.
* @param directory {String} - The directory to store the webhook in.
* @param webhook {Object} - The webhook as received from GitLab.
*/
async function storeWebhook(directory, webhook) {
  const text = JSON.stringify(webhook);

  // A weak file hash used for creating a unique name
  const hash = crypto.createHash('md5').update(text).digest('hex');

  await fs.promises.writeFile(path.resolve(directory, `./${hash}`), text);
}

/**
* Load stored webhooks from the data directory.
* @param directory {String} - The directory to load webhooks from.
* @returns {Array} - An array of webhook objects.
*/
async function loadWebhooks(directory) {
  const filePaths = await fs.promises.readdir(directory);

  const webhooks = [];

  for (const filePath of filePaths) {
    let content = null;
    try {
      content = await fs.promises.readFile(path.resolve(directory, `./${filePath}`)); // eslint-disable-line no-await-in-loop
    } catch (error) {
      throw new Error(`Unable to read stored webhook '${filePath}'`, error);
    }

    let webhook = null;
    try {
      webhook = JSON.parse(content);
    } catch (error) {
      throw new Error(`Unable to parse stored webhook '${filePath}'`, error);
    }

    webhooks.push(webhook);
  }

  return webhooks;
}

module.exports = {
  createDirectory,
  storeWebhook,
  loadWebhooks
};
