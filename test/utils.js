const test = require('ava');

const utils = require('../src/utils');
const {parseUser} = utils.bodyParser;

test('can parse user', t => {
  const result = parseUser({
    'user': {
      'name': 'Administrator',
      'username': 'root',
      'avatar_url': 'http://www.gravatar.com/avatar/e64c7d89f26bd1972efa854d13d7dd61?s=40\u0026d=identicon'
    }
  });

  t.is('Administrator', result['name']);
});
