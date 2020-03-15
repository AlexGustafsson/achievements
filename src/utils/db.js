const util = require('util');

const sqlite3 = require('sqlite3').verbose();

/**
* Promisify a database.
* @param db {Object} - The sqlite3 database.
*/
function promisify(db) {
  // Promisify the run function
  db._run = db.run;
  db.run = util.promisify(db._run);

  // Promisify the all function
  db._all = db.all;
  db.all = util.promisify(db._all);

  // Promisify the prepared statements
  db._prepare = db.prepare;
  db.prepare = query => {
    return new Promise((resolve, reject) => {
      const statement = db._prepare(query, error => {
        if (error)
          return reject(error);

        // Promisify the run function
        statement._run = statement.run;
        statement.run = util.promisify(statement._run);

        // Promisify the all function
        statement._all = statement.all;
        statement.all = util.promisify(statement._all);

        // Promisify the finalize function
        statement._finalize = statement.finalize;
        statement.finalize = util.promisify(statement._finalize);

        resolve(statement);
      });
    });
  };
}

/**
* Promisify the database creation.
* @param db {String} - The path to the database.
* @returns {Object} - The created database.
*/
function createDatabase(path) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path, error => {
      if (error)
        return reject(error);

      promisify(db);

      resolve(db);
    });
  });
}

module.exports = {
  promisify,
  createDatabase
};
