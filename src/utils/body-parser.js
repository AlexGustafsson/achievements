/**
* Parse user information from the GitLab event body.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Object} - The parsed user object.
*/
function parseUser(body) {
  if (body['user']) {
    return {
      id: null,
      name: body['user']['name'],
      username: body['user']['username'],
      avatar: body['user']['avatar_url']
    };
  }

  return {
    id: body['user_id'],
    name: body['user_name'],
    username: body['user_username'],
    email: body['user_email'],
    avatar: body['user_avatar']
  };
}

module.exports = {
  parseUser
};
