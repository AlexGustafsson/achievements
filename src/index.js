const debug = require('debug')('achievements:server');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const {hookByKind} = require('./hooks');
const utils = require('./utils');
const achievements = require('./achievements.json');
const WebhookStore = require('./webhook-store');
const UserStore = require('./user-store');
const {executeHooks} = utils.hooks;

const DATA_DIRECTORY = process.env.DATA_DIRECTORY || './data';
const WEBHOOK_STORE_FILE = `${DATA_DIRECTORY}/webhooks.sqlite3`;
const USER_STORE_FILE = `${DATA_DIRECTORY}/users.sqlite3`;
const {GITLAB_TOKEN} = process.env;
const PORT = process.env.PORT || 3000;

const app = express();
const webhookStore = new WebhookStore();
const userStore = new UserStore();

// Setup Body Parser as a middleware
app.use(bodyParser.json());

// Setup CORS
app.use(cors());

// The GitLab webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.header('X-Gitlab-Event');
  if (!event)
    return res.status(400).json({error: 'Missing GitLab event header'});

  const token = req.header('X-Gitlab-Token');
  if (token !== GITLAB_TOKEN)
    return res.status(403).json({error: 'Missing or bad GitLab token header'});

  const webhook = req.body;
  webhookStore.store(webhook);

  const kind = webhook['object_kind'];
  const hooks = hookByKind(kind);
  if (!hooks)
    return res.status(400).json({error: 'No such hook'});

  executeHooks(userStore, webhook, hooks);
  return res.status(200).json({});
});

// List users endpoint
app.get('/users', async (req, res) => {
  const users = await userStore.getUsers();
  console.log(users);
  // Strip emails
  for (const user of users)
    delete user.email;
  return res.json(users);
});

// List specific user endpoint
app.get('/users/:uuid', async (req, res) => {
  const {uuid} = req.params;
  const user = await userStore.getUser(uuid);
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
    webhooks = await webhookStore.getWebhooks();
  } catch (error) {
    debug('Unable to load stored webhooks. Skipping check', error);
  }

  debug(`Loaded ${webhooks.length} stored webhook(s). Checking them for new achievements`);
  for (const webhook of webhooks) {
    const kind = webhook.body['object_kind'];
    const hooks = hookByKind(kind);
    if (hooks)
      await executeHooks(userStore, webhook.body, hooks, webhook.created); // eslint-disable-line no-await-in-loop
  }
}

async function start() {
  // Initialize the webhook store
  await webhookStore.load(WEBHOOK_STORE_FILE);

  // Initialize the user store
  await userStore.load(USER_STORE_FILE);

  await checkStoredWebhooks();

  // Start the server
  const port = PORT;
  app.listen(port);
  debug(`Listening on port ${port}`);
}

start();
