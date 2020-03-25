const utils = require('../utils');
const {parseUser} = utils.bodyParser;

/**
* Check for completion for the 'You see my point?' achievement.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkYouSeeMyPoint(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'You see my point?'))
    return [];

  // Unlock the achievement if a user has commented on a merge request
  if (body['merge_request'])
    return [{user, achievement: 'You see my point?'}];
}

/**
* Check for completion for the '<Rank> Reviewer' achievements.
* @param userStore {Object} - The user store object to use.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Array} - An array of unlocked achievements.
*/
async function checkReviewerRank(userStore, body) {
  const user = parseUser(body);
  if (await userStore.userHasAchievement(user, 'Grandmaster Reviewer'))
    return [];

  // Skip comments not made on merge requests
  if (!body['merge_request'])
    return [];

  const commentAuthorId = body['object_attributes']['author_id'];
  const mergeRequestAuthorId = body['merge_request']['author_id'];

  // Skip comments on the author's own merge request
  if (commentAuthorId === mergeRequestAuthorId)
    return [];

  const metadata = await userStore.getMetadata(user, 'Reviewer Rank');
  metadata['comments'] = metadata['comments'] || 0;
  metadata['comments'] += 1;
  await userStore.setMetadata(user, 'Reviewer Rank', metadata);

  if (metadata['comments'] === 200) {
    // Remove metadata
    await userStore.clearMetadata(user, 'Reviewer Rank');
    return [{user, achievement: 'Grandmaster Reviewer'}];
  }

  if (metadata['comments'] === 150)
    return [{user, achievement: 'Master Reviewer'}];

  if (metadata['comments'] === 75)
    return [{user, achievement: 'Adept Reviewer'}];

  if (metadata['comments'] === 25)
    return [{user, achievement: 'Apprentice Reviewer'}];
}

module.exports = [
  checkYouSeeMyPoint,
  checkReviewerRank
];
