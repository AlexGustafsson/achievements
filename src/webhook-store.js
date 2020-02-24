const crypto = require('crypto');

const debug = require('debug')('achievements:webhook-store');
const sqlite3 = require('sqlite3').verbose();

class WebhookStore {
  constructor() {
    this.db = null;
  }

  load(path) {
    debug(`Loading database from ${path}`);
    this.db = new sqlite3.Database(path);
    this.db.run('CREATE TABLE IF NOT EXISTS webhooks (hash TEXT, created DATETIME, body TEXT)');
  }

  /**
  * Store a webhook for later use.
  * @param webhook {Object} - The webhook as received from GitLab.
  */
  store(webhook) {
    const body = JSON.stringify(webhook);

    // A weak file hash used for creating a unique name
    const hash = crypto.createHash('md5').update(body).digest('hex');
    debug(`Storing webhook with hash ${hash}. Ignoring if duplicate`);

    const statement = this.db.prepare('INSERT OR IGNORE INTO webhooks VALUES (?, ?, ?)');
    statement.run(hash, Date.now(), body);
    statement.finalize();
  }

  getWebhooks() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM webhooks', (error, rows) => {
        if (error)
          return reject(error);

        resolve(rows.map(row => JSON.parse(row.body)));
      });
    });
  }
}

module.exports = WebhookStore;
