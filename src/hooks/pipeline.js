const utils = require('../utils');
const {parseUser} = utils.bodyParser;

/**
* Check for completion for the '"Not your day' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkNotYourDay(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Not your day'))
    return [];

  const failed = body['object_attributes']['status'] === 'failed';
  if (!failed)
    return [];

  const created = new Date(body['object_attributes']['created_at']);
  const year = created.getUTCFullYear();
  const month = created.getUTCMonth().toString().padStart(2, '0');
  const day = created.getUTCDate().toString().padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  const metadata = await userStore.getMetadata(user, 'Not your day');
  metadata['pipelines'] = metadata['pipelines'] || {};
  metadata['pipelines'][date] = metadata['pipelines'][date] || 0;
  metadata['pipelines'][date] += 1;
  await userStore.setMetadata(user, 'Not your day', metadata);

  // Unlock the achievement if the user has failed 10 pipelines during a single day
  if (metadata['pipelines'][date] >= 10) {
    // Remove metadata
    await userStore.clearMetadata(user, 'Not your day');
    return [{user, achievement: 'Not your day'}];
  }

  return [];
}

module.exports = [
  checkNotYourDay
];
