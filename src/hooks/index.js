const hooks = {
  push: require('./push'),
  tag: require('./tag'),
  issue: require('./issue'),
  comment: require('./comment'),
  mergeRequest: require('./merge-request'),
  wiki: require('./wiki'),
  pipeline: require('./pipeline'),
  job: require('./job')
};

/**
* Return the relevant hooks for a specific event type.
* @param kind {String} - The event object kind as received from the GitLab webhook.
* @returns {Array} - An array of hooks for the event type or null if it's an unknown kind.
*/
function hookByKind(kind) {
  if (kind === 'push')
    return hooks.push;

  if (kind === 'tag_push')
    return hooks.tag;

  if (kind === 'issue')
    return hooks.issue;

  if (kind === 'note')
    return hooks.comment;

  if (kind === 'merge_request')
    return hooks.mergeRequest;

  if (kind === 'wiki_page')
    return hooks.wiki;

  if (kind === 'pipeline')
    return hooks.pipeline;

  if (kind === 'build')
    return hooks.job;

  return null;
}

module.exports = {
  hooks,
  hookByKind
};
