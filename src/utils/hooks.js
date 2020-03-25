/**
* Execute hooks in series and handle unlocks.
* @param userStore {Object} - The user store to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @param hooks {Array} - An array of hooks to call.
* @param timestamp {Number} - The timestamp of the hook execution.
*/
async function executeHooks(userStore, body, hooks, timestamp = Date.now()) {
  // Add the webhook's creation timestamp
  body['_webhook_timestamp'] = timestamp;

  /* eslint-disable no-await-in-loop */
  for (const hook of hooks) {
    const unlocks = await hook(userStore, body);

    // Skip non-arrays
    if (!Array.isArray(unlocks))
      continue;

    for (const unlock of unlocks) {
      const {user, achievement} = unlock;
      await userStore.unlockAchievement(user, achievement, timestamp);
    }
  }
  /* eslint-enable no-await-in-loop */
}

module.exports = {
  executeHooks
};
