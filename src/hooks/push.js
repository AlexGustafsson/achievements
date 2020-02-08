const utils = require('../utils');
const {parseUser} = utils.bodyParser;
const {userHasAchievement} = utils.state;

/**
* Check for completion for the 'First blood' achievement.
* @param state {Object} - The state object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkFirstBlood(state, body) {
  const user = parseUser(body);
  if (userHasAchievement(state, user, 'First blood'))
    return [];

  // Unlock the achievement if a user pushes a commit they authored
  const firstCommit = body['commits'].find(x => x.author.email === user.email);
  if (firstCommit)
    return [{user, achievement: 'First blood'}];
}

/**
* Check for completion for the 'Night's watchman' achievement.
* @param state {Object} - The state object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkNightsWatchman(state, body) {
  const unlocks = [];
  for (const commit of body['commits']) {
    const date = new Date(commit.timestamp);
    const user = commit.author;
    const hour = date.getUTCHours();
    if (hour >= 1 && hour <= 3 && !userHasAchievement(state, user, 'Night\'s watchman')) {
      // Unlock the achievement if a user has authored a commit between 1AM and 3AM
      unlocks.push({user, achievement: 'Night\'s watchman'});
    }
  }

  return unlocks;
}

module.exports = [
  checkFirstBlood,
  checkNightsWatchman
];
