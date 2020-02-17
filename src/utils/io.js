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

module.exports = {
  createDirectory,
  storeWebhook
};
