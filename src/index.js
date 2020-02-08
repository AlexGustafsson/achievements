const debug = require('debug')('achievements:server');
const express = require('express');
const bodyParser = require('body-parser');

const {hookByKind} = require('./hooks');
const utils = require('./utils');
const State = require('./state');
const achievements = require('./achievements.json');
const {executeHooks} = utils.hooks;

const app = express();
// Initialize the state store
const state = new State(process.env.STORE_PATH || './store.json');

// Setup Body Parser as a middleware
app.use(bodyParser.json());

// The GitLab webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.header('X-Gitlab-Event');
  if (!event)
    return res.status(400).json({error: 'Missing GitLab event header'});

  const token = req.header('X-Gitlab-Token');
  if (token !== process.env.GITLAB_TOKEN)
    return res.status(403).json({error: 'Missing or bad GitLab token header'});

  const kind = req.body['object_kind'];
  const hooks = hookByKind(kind);
  if (!hooks)
    return res.status(400).json({error: 'No such hook'});

  executeHooks(state, req.body, hooks);
  return res.status(200).json({});
});

// List users endpoint
app.get('/users', (req, res) => {
  const users = state.db.get('users').value();
  return res.json(users);
});

// List specific user endpoint
app.get('/users/:username', (req, res) => {
  const username = req.params.username;
  const user = state.db.get('users').find({username}).value();
  if (user)
    return res.json(user);

  return res.status(404).json({error: 'User not found'});
});

// List all achievements endpoint
app.get('/achievements', (req, res) => {
  return res.json(achievements);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port);
debug(`Listening on port ${port}`);
