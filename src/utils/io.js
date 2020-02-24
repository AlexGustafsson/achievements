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

module.exports = {
  createDirectory
};
