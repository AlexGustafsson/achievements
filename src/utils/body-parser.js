/**
* Parse user information from the GitLab event body.
* @param body {Object} - The parsed JSON body received from GitLab.
* @returns {Object} - The parsed user object.
*/
function parseUser(body) {
  let user = null;

  if (body['user']) {
    user = {
      id: body['user']['id'] || null,
      name: body['user']['name'] || null,
      username: body['user']['username'] || null,
      avatar: body['user']['avatar_url'] || null,
      email: body['user']['email'] || null
    };
  } else {
    user = {
      id: body['user_id'] || null,
      name: body['user_name'] || null,
      username: body['user_username'] || null,
      email: body['user_email'] || null,
      avatar: body['user_avatar'] || null
    };
  }

  user.email = user.email === '' ? null : user.email;

  return user;
}

module.exports = {
  parseUser
};
