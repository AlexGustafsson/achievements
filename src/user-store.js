const uuid = require('uuid').v4;
const debug = require('debug')('achievements:user-store');

const {createDatabase} = require('./utils').db;

class UserStore {
  constructor() {
    this.db = null;
  }

  async load(path) {
    debug(`Loading database from ${path}`);
    this.db = await createDatabase(path);

    await this.db.run('CREATE TABLE IF NOT EXISTS users (uuid TEXT PRIMARY KEY, id INT UNIQUE, name TEXT, username TEXT UNIQUE, avatar TEXT, email TEXT UNIQUE)');
    await this.db.run('CREATE TABLE IF NOT EXISTS unlocks (user TEXT, name TEXT, timestamp DATETIME, PRIMARY KEY (user, name))');
  }

  /**
  * Lookup a user by its id, username or email.
  * @param user {Object} - Data known about the user.
  */
  async lookupUser(user) {
    const statement = await this.db.prepare('SELECT * FROM users WHERE uuid = ? OR id = ? OR username = ? OR email = ?');

    const rows = await statement.all(user.uuid, user.id, user.username, user.email);
    return rows.length === 0 ? null : rows[0];
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

    const statement = await this.db.prepare('REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?)');
    await statement.run(user.uuid, user.id, user.name, user.username, user.avatar, user.email);
    await statement.finalize();

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

    const statement = await this.db.prepare('SELECT 1 FROM unlocks WHERE user = ? AND name = ?');
    const rows = await statement.all(uuid, achievement);
    await statement.finalize();

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

    const statement = await this.db.prepare('INSERT OR IGNORE INTO unlocks VALUES (?, ?, ?)');
    await statement.run(uuid, achievement, timestamp);
    await statement.finalize();
  }

  /**
  * Get all existing users with their respective unlocks.
  */
  async getUsers() {
    const uuids = await this.db.all('SELECT uuid FROM users');

    const users = [];
    for (const uuid of uuids.map(row => row.uuid)) {
      const user = await this.getUser(uuid); // eslint-disable-line  no-await-in-loop
      users.push(user);
    }

    return users;
  }

  /**
  * Get a specific user with their respective unlocks.
  * @param uuid {String} - The user's uuid.
  */
  async getUser(uuid) {
    const user = await this.lookupUser({uuid});

    if (!user)
      return null;

    const statement = await this.db.prepare('SELECT * FROM unlocks WHERE user = ?');
    user.achievements = await statement.all(uuid);
    if (!user.achievements)
      user.achievements = [];
    // Remove superfluous user uuid
    for (const achievement of user.achievements)
      delete achievement.user;
    await statement.finalize();

    return user;
  }
}

module.exports = UserStore;
