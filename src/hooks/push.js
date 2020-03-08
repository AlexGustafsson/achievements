const utils = require('../utils');
const {parseUser} = utils.bodyParser;

/**
* Check for completion for the 'First blood' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkFirstBlood(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'First blood'))
    return [];

  return [{user, achievement: 'First blood'}];
}

/**
* Check for completion for the 'Night's watchman' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkNightsWatchman(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Night\'s watchman'))
    return [];

  for (const commit of body['commits']) {
    const date = new Date(commit.timestamp);

    const hour = date.getUTCHours();
    if (hour >= 1 && hour <= 3) {
      // Unlock the achievement if the user has authored a commit between 1AM and 3AM
      return [{user, achievement: 'Night\'s watchman'}];
    }
  }

  return [];
}

module.exports = [
  checkFirstBlood,
  checkNightsWatchman
];
