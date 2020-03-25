const utils = require('../utils');
const {parseUser} = utils.bodyParser;

/**
* Check for completion for the 'Not your day' achievement.
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

/**
* Check for completion for the 'You shall not pass' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkYouShallNotPass(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'You shall not pass'))
    return [];

  const failed = body['object_attributes']['status'] === 'failed';
  if (failed)
    return [{user, achievement: 'You shall not pass'}];

  return [];
}

/**
* Check for completion for the '<Rank> of the Pipeline' achievements.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkPipelineRank(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Guardian of the Pipeline'))
    return [];

  const metadata = await userStore.getMetadata(user, 'Pipeline Rank');
  metadata['pipelines'] = metadata['pipelines'] || 0;

  const status = body['object_attributes']['status'];
  if (status === 'failed')
    metadata['pipelines'] = 0;
  else if (status === 'success')
    metadata['pipelines'] += 1;
  else
    return [];

  await userStore.setMetadata(user, 'Pipeline Rank', metadata);

  if (metadata['pipelines'] === 20) {
    // Remove metadata
    await userStore.clearMetadata(user, 'Pipeline Rank');
    return [{user, achievement: 'Guardian of the Pipeline'}];
  }

  if (metadata['pipelines'] === 15)
    return [{user, achievement: 'Knight of the Pipeline'}];

  if (metadata['pipelines'] === 7)
    return [{user, achievement: 'Protector of the Pipeline'}];

  if (metadata['pipelines'] === 2)
    return [{user, achievement: 'Prospector of the Pipeline'}];
}

module.exports = [
  checkNotYourDay,
  checkYouShallNotPass,
  checkPipelineRank
];
