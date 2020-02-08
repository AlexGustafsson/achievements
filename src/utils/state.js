const debug = require('debug')('achievements:utils:state');

/**
* Lookup a user by its id, username or email.
* @returns {Object} - The user lowdb value
*/
function lookupUser(state, user) {
  const userById = state.db.get('users').find({id: user.id});
  const userByUsername = state.db.get('users').find({username: user.username});
  const userByEmail = state.db.get('users').find({email: user.email});

  if (userById.value() && userById.value().id)
    return userById;

  if (userByUsername.value() && userByUsername.value().username)
    return userByUsername;

  if (userByEmail.value() && userByEmail.value().email)
    return userByEmail;

  return null;
}

/**
* Create a user if it does not exist or update it if it does.
* @param state {Object} - The state object to use.
* @param user {Object} - The user to create.
*/
function createOrUpdateUser(state, user) {
  const existingUser = lookupUser(state, user);
  if (existingUser && existingUser.value()) {
    // Update the user's username, id and email to ensure they're available
    // as GitLab webhooks don't always provide all values
    const {username, email, id} = existingUser.value();
    existingUser.set('username', username || user.username)
      .set('email', email || user.email)
      .set('id', id || user.id)
      .write();
  } else {
    debug(`Created user '${user.name}' (id: ${user.id || 'unknown'} - username: ${user.username || 'unknown'} - email: ${user.email || 'unknown'})`);
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
  createOrUpdateUser(state, user);

  return Boolean(lookupUser(state, user).get('achievements').find({name: achievement}).value());
}

/**
* Unlock an achievement for a user.
* Implicitly creates the user if it did not exist previously.
* @param state {Object} - The state object to use.
* @param user {Object} - The user for which to unlock the achievement.
* @param achievement {String} - The name of the achievement to unlock.
*/
function unlockAchievement(state, user, achievement) {
  createOrUpdateUser(state, user);

  debug(`User '${user.name}' (id: ${user.id || 'unknown'} - username: ${user.username || 'unknown'} - email: ${user.email || 'unknown'}) unlocked '${achievement}'`);
  lookupUser(state, user).get('achievements').push({name: achievement, timestamp: Date.now()}).write();
}

module.exports = {
  lookupUser,
  createOrUpdateUser,
  userHasAchievement,
  unlockAchievement
};
