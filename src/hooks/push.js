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
      // Unlock the achievement if the user has authored a commit between 1AM and 4AM
      return [{user, achievement: 'Night\'s watchman'}];
    }
  }

  return [];
}

/**
* Check for completion for the 'Up with the Birds' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkUpWithTheBirds(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Up with the Birds'))
    return [];

  for (const commit of body['commits']) {
    const date = new Date(commit.timestamp);

    const hour = date.getUTCHours();
    if (hour >= 5 && hour < 7) {
      // Unlock the achievement if the user has authored a commit between 5AM and 7AM
      return [{user, achievement: 'Up with the Birds'}];
    }
  }

  return [];
}

/**
* Check for completion for the 'Skipping lunch' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkSkippingLunch(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Skipping lunch'))
    return [];

  for (const commit of body['commits']) {
    const date = new Date(commit.timestamp);

    const hour = date.getUTCHours();
    if (hour >= 11 && hour < 12) {
      // Unlock the achievement if the user has authored a commit between 11AM and 12AM
      return [{user, achievement: 'Skipping lunch'}];
    }
  }

  return [];
}

/**
* Check for completion for the 'Tree of life' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkTreeOfLife(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Tree of life'))
    return [];

  const branchMatches = body['ref'].match(/refs\/heads\/(.*)/);
  // Skip unknown branches
  if (!branchMatches)
    return [];

  const branch = branchMatches[1];

  const created = new Date(body['_webhook_timestamp']);
  const year = created.getUTCFullYear();
  const month = created.getUTCMonth().toString().padStart(2, '0');
  const day = created.getUTCDate().toString().padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  const metadata = await userStore.getMetadata(user, 'Tree of life');
  metadata['branches'] = metadata['branches'] || {};
  metadata['branches'][date] = metadata['branches'][date] || {};
  metadata['branches'][date][branch] = true;
  await userStore.setMetadata(user, 'Tree of life', metadata);

  // Unlock the achievement if the user has pushed to five or more branches the same day
  if (Object.keys(metadata['branches'][date]).length >= 5) {
    // Remove metadata
    await userStore.clearMetadata(user, 'Tree of life');
    return [{user, achievement: 'Tree of life'}];
  }

  return [];
}

module.exports = [
  checkFirstBlood,
  checkNightsWatchman,
  checkUpWithTheBirds,
  checkSkippingLunch,
  checkTreeOfLife
];
