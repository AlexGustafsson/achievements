#!/usr/bin/env node

const fs = require('fs');

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
app.post('/webhook', async (req, res) => {
  const event = req.header('X-Gitlab-Event');
  if (!event)
    return res.status(400).json({error: 'Missing GitLab event header'});

  const token = req.header('X-Gitlab-Token');
  if (token !== GITLAB_TOKEN)
    return res.status(403).json({error: 'Missing or bad GitLab token header'});

  const webhook = req.body;
  try {
    await webhookStore.store(webhook);
  } catch (error) {
    debug('Unable to store webhook', error);
    return res.status(500).json({});
  }

  const kind = webhook['object_kind'];
  const hooks = hookByKind(kind);
  if (!hooks)
    return res.status(400).json({error: 'No such hook'});

  try {
    await executeHooks(userStore, webhook, hooks);
  } catch (error) {
    debug('Unable to execute hooks', error);
    return res.status(500).json({});
  }

  return res.status(200).json({});
});

// List users endpoint
app.get('/users', async (req, res) => {
  let users = [];
  try {
    users = await userStore.getUsers();
  } catch {
    return res.status(500).json({});
  }

  // Strip emails
  for (const user of users)
    delete user.email;
  return res.json(users);
});

// List specific user endpoint
app.get('/users/:uuid', async (req, res) => {
  const {uuid} = req.params;

  let user = null;
  try {
    user = await userStore.getUser(uuid);
  } catch (error) {
    debug(`Unable to get user with uuid ${uuid}`, error);
    return res.status(500).json({});
  }

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

app.get('/info', async (req, res) => {
  let info = null;
  try {
    info = await webhookStore.getWebhookInfo();
  } catch (error) {
    debug('Unable to get webhook storage info', error);
    return res.status(500).json({});
  }

  return res.json(info);
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
    if (hooks) {
      try {
        await executeHooks(userStore, webhook.body, hooks, webhook.created); // eslint-disable-line no-await-in-loop
      } catch (error) {
        debug('Unable to execute hook', error);
      }
    }
  }
}

async function start() {
  debug('Starting achievements server');

  // Initialize the webhook store
  try {
    await webhookStore.load(WEBHOOK_STORE_FILE);
  } catch (error) {
    debug('Unable to load webhook store', error);
    process.exit(1);
  }

  // Remove the user store if it exists, it will be recreated using stored webhooks
  // This is to resolve any potential conflicts for stateful hooks
  try {
    debug('Removing user store file if it exists');
    fs.unlinkSync(USER_STORE_FILE);
  } catch (error) {
    debug('Unable to remove user store', error);
  }

  // Initialize the user store
  try {
    await userStore.load(USER_STORE_FILE);
  } catch (error) {
    debug('Unable to load user store', error);
    process.exit(1);
  }

  await checkStoredWebhooks();

  // Start the server
  const port = PORT;
  app.listen(port);
  debug(`Ready and listening on port ${port}`);
}

start();

process.on('SIGINT', () => {
  process.exit();
});
