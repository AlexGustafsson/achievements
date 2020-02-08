const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class State {
  constructor(path) {
    this.adapter = new FileSync(path);
    this.db = low(this.adapter);

    this.db.defaults({users: []}).write();
  }
}

module.exports = State;
