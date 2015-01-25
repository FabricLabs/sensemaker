var reheat = require('reheat');

function Datastore(namespace) {
  this.connection = new reheat.Connection({
    db: namespace
  });
  this.reheat = reheat;
}

module.exports = Datastore;
