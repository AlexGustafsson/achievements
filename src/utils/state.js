const debug = require('debug')('achievements:utils:state');

/**
* Create a user if it does not exist.
* @param state {Object} - The state object to use.
* @param user {Object} - The user to create.
*/
function createUserIfNotExists(state, user) {
  const existingUser = state.db.get('users').find({username: user.username}).value();
  if (!existingUser) {
    debug(`Created user '${user.name}' (${user.username})`);
    state.db.get('users').push({...user, achievements: []}).write();
  }
}

/**
* Check if a user has unlocked an achievement.
* Implicitly creates the user if it did not exist previously.
* @param state {Object} - The state object to use.
* @param user {Object} - The user for which to check the achievement.
* @param achievement {String} - The name of the achievement to check.
* @returns {Boolean} - Whether or not the achievement is unlocked for a user.
*/
function userHasAchievement(state, user, achievement) {
  createUserIfNotExists(state, user, achievement);

  return Boolean(state.db.get('users').find({username: user.username}).get('achievements').find({name: achievement}).value());
}

/**
* Unlock an achievement for a user.
* Implicitly creates the user if it did not exist previously.
* @param state {Object} - The state object to use.
* @param user {Object} - The user for which to unlock the achievement.
* @param achievement {String} - The name of the achievement to unlock.
*/
function unlockAchievement(state, user, achievement) {
  createUserIfNotExists(state, user, achievement);

  debug(`User '${user.name}' (${user.username}) unlocked '${achievement}'`);
  state.db.get('users').find({username: user.username}).get('achievements').push({name: achievement, timestamp: Date.now()}).write();
}

module.exports = {
  createUserIfNotExists,
  userHasAchievement,
  unlockAchievement
};
