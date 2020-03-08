const uuid = require('uuid').v4;
const debug = require('debug')('achievements:user-store');
const sqlite3 = require('sqlite3').verbose();

const {promisify} = require('./utils').db;

class UserStore {
  constructor() {
    this.db = null;
  }

  async load(path) {
    debug(`Loading database from ${path}`);
    this.db = new sqlite3.Database(path);
    promisify(this.db);

    await this.db.run('CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, id INT UNIQUE, name TEXT, username TEXT UNIQUE, avatar TEXT, email TEXT UNIQUE)');
    await this.db.run('CREATE TABLE IF NOT EXISTS unlocks (user TEXT, name TEXT, timestamp DATETIME, PRIMARY KEY (user, name))');
  }

  /**
  * Lookup a user by its id, username or email.
  * @param user {Object} - Data known about the user.
  */
  async lookupUser(user) {
    const statement = this.db.prepare('SELECT * FROM users WHERE uuid = ? OR id = ? OR username = ? OR email = ?');

    try {
      const rows = await statement.all(user.uuid, user.id, user.username, user.email);
      return rows.length === 0 ? null : rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
  * Create a user if it does not exist or update it if it does.
  * @param user {Object} - The user to create.
  * @returns {String} - The UUID of the user created or updated.
  */
  async createOrUpdateUser(user) {
    const existingUser = await this.lookupUser(user);
    if (existingUser) {
      // Update the user's username, id and email to ensure they're available
      // as GitLab webhooks don't always provide all values
      user = {...user, ...existingUser};
    } else {
      debug(`Creating user '${user.name}' (id: ${user.id || 'unknown'} - username: ${user.username || 'unknown'} - email: ${user.email || 'unknown'})`);
      user.uuid = uuid();
    }

    const statement = this.db.prepare('REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?)');
    await statement.run(user.uuid, user.id, user.name, user.username, user.avatar, user.email);
    statement.finalize();

    return user.uuid;
  }

  /**
  * Check if a user has unlocked an achievement.
  * Implicitly creates the user if it did not exist previously.
  * @param user {Object} - The user for which to check the achievement.
  * @param achievement {String} - The name of the achievement to check.
  * @returns {Boolean} - Whether or not the achievement is unlocked for a user.
  */
  async userHasAchievement(user, achievement) {
    const uuid = await this.createOrUpdateUser(user);
    const statement = this.db.prepare('SELECT 1 FROM unlocks WHERE user = ? AND name = ?');

    let rows = [];
    try {
      rows = await statement.all(uuid, achievement);
      statement.finalize();
    } catch (error) {
      throw error;
    }

    return rows && rows.length > 0;
  }

  /**
  * Unlock an achievement for a user.
  * Implicitly creates the user if it did not exist previously.
  * @param user {Object} - The user for which to unlock the achievement.
  * @param achievement {String} - The name of the achievement to unlock.
  * @param timestamp {Number} - The timestamp where the achievement was unlocked.
  */
  async unlockAchievement(user, achievement, timestamp = Date.now()) {
    const uuid = await this.createOrUpdateUser(user);
    debug(`User '${user.name}' (id: ${user.id || 'unknown'} - username: ${user.username || 'unknown'} - email: ${user.email || 'unknown'}) unlocked '${achievement}' ${timestamp}`);

    const statement = this.db.prepare('INSERT OR IGNORE INTO unlocks VALUES (?, ?, ?)');
    await statement.run(uuid, achievement, timestamp);
    statement.finalize();
  }

  /**
  * Get all existing users with their respective unlocks.
  */
  async getUsers() {
    let uuids = [];
    try {
      uuids = await this.db.all('SELECT uuid FROM users');
    } catch (error) {
      throw error;
    }

    const users = [];
    for (const uuid of uuids.map(row => row.uuid)) {
      try {
        const user = await this.getUser(uuid);
        users.push(user);
      } catch (error) {
        throw error;
      }
    }

    return users;
  }

  /**
  * Get a specific user with their respective unlocks.
  * @param uuid {String} - The user's uuid.
  */
  async getUser(uuid) {
    let user = null;
    try {
      user = await this.lookupUser({uuid});
    } catch (error) {
      throw error;
    }

    if (!user)
      return null;

    try {
      const statement = this.db.prepare('SELECT * FROM unlocks WHERE user = ?');
      user.achievements = await statement.all(uuid);
      if (!user.achievements)
        user.achievements = [];
      // Remove superfluous user uuid
      for (const achievement of user.achievements)
        delete achievement.user;
      statement.finalize();
    } catch (error) {
      throw error;
    }

    return user;
  }
}

module.exports = UserStore;
