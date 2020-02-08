const utils = require('../utils');
const {parseUser} = utils.bodyParser;
const {userHasAchievement} = utils.state;

/**
* Check for completion for the 'You see my point?' achievement.
* @param state {Object} - The state object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
*/
async function checkYouSeeMyPoint(state, body) {
  const user = parseUser(body);
  if (userHasAchievement(state, user, 'You see my point?'))
    return;

  // Unlock the achievement if a user has commented on a merge request
  if (body['merge_request'])
    return {user, achievement: 'You see my point?'};
}

module.exports = [
  checkYouSeeMyPoint
];
