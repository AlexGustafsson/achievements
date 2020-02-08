const utils = require('../utils');
const {parseUser} = utils.bodyParser;
const {userHasAchievement} = utils.state;

/**
* Check for completion for the 'First blood' achievement.
* @param state {Object} - The state object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
*/
async function checkFirstBlood(state, body) {
  const user = parseUser(body);
  if (userHasAchievement(state, user, 'First blood'))
    return;

  // Unlock the achievement if a user pushes a commit they authored
  const firstCommit = body['commits'].find(x => x.author.email === user.email);
  if (firstCommit)
    return {user, achievement: 'First blood'};
}

module.exports = [
  checkFirstBlood
];
