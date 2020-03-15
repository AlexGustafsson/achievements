const crypto = require('crypto');

const debug = require('debug')('achievements:webhook-store');

const {createDatabase} = require('./utils').db;

class WebhookStore {
  constructor() {
    this.db = null;
  }

  async load(path) {
    debug(`Loading database from ${path}`);
    this.db = await createDatabase(path);

    await this.db.run('CREATE TABLE IF NOT EXISTS webhooks (hash TEXT, created DATETIME, body TEXT)');
  }

  /**
  * Store a webhook for later use.
  * @param webhook {Object} - The webhook as received from GitLab.
  */
  async store(webhook, ingestTimestamp = Date.now()) {
    const body = JSON.stringify(webhook);

    // A weak file hash used for creating a unique name
    const hash = crypto.createHash('md5').update(body).digest('hex');
    debug(`Storing webhook with hash ${hash}. Ignoring if duplicate`);

    const statement = await this.db.prepare('INSERT OR IGNORE INTO webhooks VALUES (?, ?, ?)');
    await statement.run(hash, ingestTimestamp, body);
    await statement.finalize();
  }

  async getWebhooks() {
    const rows = await this.db.all('SELECT * FROM webhooks');

    for (const row of rows)
      row.body = JSON.parse(row.body);

    return rows;
  }

  async getWebhookInfo() {
    const count = await this.db.all('SELECT COUNT(1) FROM webhooks');
    const latest = await this.db.all('SELECT created FROM webhooks ORDER BY created DESC LIMIT 1');

    return {
      webhooks: count[0]['COUNT(1)'],
      latest: latest[0]['created']
    };
  }
}

module.exports = WebhookStore;
