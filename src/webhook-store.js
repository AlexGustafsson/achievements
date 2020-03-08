const crypto = require('crypto');

const debug = require('debug')('achievements:webhook-store');
const sqlite3 = require('sqlite3').verbose();

const {promisify} = require('./utils').db;

class WebhookStore {
  constructor() {
    this.db = null;
  }

  load(path) {
    debug(`Loading database from ${path}`);
    this.db = new sqlite3.Database(path);
    promisify(this.db);

    this.db.run('CREATE TABLE IF NOT EXISTS webhooks (hash TEXT, created DATETIME, body TEXT)');
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

    const statement = this.db.prepare('INSERT OR IGNORE INTO webhooks VALUES (?, ?, ?)');
    await statement.run(hash, ingestTimestamp, body);
    statement.finalize();
  }

  async getWebhooks() {
    let rows = [];
    try {
      rows = await this.db.all('SELECT * FROM webhooks');
    } catch (error) {
      throw error;
    }

    for (const row of rows)
      row.body = JSON.parse(row.body);

    return rows;
  }

  async getWebhookInfo() {
    let count = [];
    try {
      count = await this.db.all('SELECT COUNT(1) FROM webhooks');
    } catch (error) {
      throw error;
    }

    let latest = [];
    try {
      latest = await this.db.all('SELECT created FROM webhooks ORDER BY created DESC LIMIT 1');
    } catch (error) {
      throw error;
    }

    return {
      webhooks: count[0]['COUNT(1)'],
      latest: latest[0]['created']
    };
  }
}

module.exports = WebhookStore;
