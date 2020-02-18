const debug = require('debug')('achievements:server');
const express = require('express');
const bodyParser = require('body-parser');

const {hookByKind} = require('./hooks');
const utils = require('./utils');
const State = require('./state');
const achievements = require('./achievements.json');
const {executeHooks} = utils.hooks;
const {createDirectory, storeWebhook, loadWebhooks} = utils.io;

const DATA_DIRECTORY = process.env.DATA_DIRECTORY || './data';
const WEBHOOKS_DIRECTORY = `${DATA_DIRECTORY}/webhooks`;
const STORE_FILE = `${DATA_DIRECTORY}/store.json`;
const {GITLAB_TOKEN} = process.env;
const PORT = process.env.PORT || 3000;

const app = express();
const state = new State();

// Setup Body Parser as a middleware
app.use(bodyParser.json());

// The GitLab webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.header('X-Gitlab-Event');
  if (!event)
    return res.status(400).json({error: 'Missing GitLab event header'});

  const token = req.header('X-Gitlab-Token');
  if (token !== GITLAB_TOKEN)
    return res.status(403).json({error: 'Missing or bad GitLab token header'});

  const webhook = req.body;
  storeWebhook(WEBHOOKS_DIRECTORY, webhook);

  const kind = webhook['object_kind'];
  const hooks = hookByKind(kind);
  if (!hooks)
    return res.status(400).json({error: 'No such hook'});

  executeHooks(state, webhook, hooks);
  return res.status(200).json({});
});

// List users endpoint
app.get('/users', (req, res) => {
  const users = state.db.get('users').value();
  // Strip emails
  for (const user of users)
    delete user.email;
  return res.json(users);
});

// List specific user endpoint
app.get('/users/:username', (req, res) => {
  const {username} = req.params;
  const user = state.db.get('users').find({username}).value();
  if (user) {
    // Strip email
    delete user.email;
    return res.json(user);
  }

  return res.status(404).json({error: 'User not found'});
});

// List all achievements endpoint
app.get('/achievements', (req, res) => {
  return res.json(achievements);
});

async function checkStoredWebhooks() {
  // Run through all stored hooks to check for new achievements
  let webhooks = [];
  try {
    webhooks = await loadWebhooks(WEBHOOKS_DIRECTORY);
  } catch (error) {
    debug('Unable to load stored webhooks. Skipping check', error);
  }

  debug(`Loaded ${webhooks.length} stored webhook(s). Checking them for new achievements`);
  for (const webhook of webhooks) {
    const kind = webhook['object_kind'];
    const hooks = hookByKind(kind);
    if (hooks)
      await executeHooks(state, webhook, hooks); // eslint-disable-line no-await-in-loop
  }
}

async function start() {
  // Initialize data directories
  await createDirectory(WEBHOOKS_DIRECTORY);

  // Initialize the state store
  state.load(STORE_FILE);

  await checkStoredWebhooks();

  // Start the server
  const port = PORT;
  app.listen(port);
  debug(`Listening on port ${port}`);
}

start();
