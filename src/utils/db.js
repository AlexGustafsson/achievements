const util = require('util');

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
    const statement = db._prepare(query);

    // Promisify the run function
    statement._run = statement.run;
    statement.run = util.promisify(statement._run);

    // Promisify the all function
    statement._all = statement.all;
    statement.all = util.promisify(statement._all);

    return statement;
  };
}

module.exports = {
  promisify
};
