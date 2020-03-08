const utils = require('../utils');
const {parseUser} = utils.bodyParser;

/**
* Check for completion for the 'You see my point?' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkYouSeeMyPoint(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'You see my point?'))
    return [];

  // Unlock the achievement if a user has commented on a merge request
  if (body['merge_request'])
    return [{user, achievement: 'You see my point?'}];
}

module.exports = [
  checkYouSeeMyPoint
];
