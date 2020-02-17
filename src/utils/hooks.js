const {unlockAchievement} = require('./state');

/**
* Execute hooks in series and handle unlocks.
* @param state {Object} - The state object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @param hooks {Array} - An array of hooks to call.
*/
async function executeHooks(state, body, hooks) {
  /* eslint-disable no-await-in-loop */
  for (const hook of hooks) {
    const unlocks = await hook(state, body);
    // Skip non-arrays
    if (!Array.isArray(unlocks))
      continue;
    for (const unlock of unlocks) {
      const {user, achievement} = unlock;
      unlockAchievement(state, user, achievement);
    }
  }
  /* eslint-enable no-await-in-loop */
}

module.exports = {
  executeHooks
};
