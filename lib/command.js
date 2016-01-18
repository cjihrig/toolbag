'use strict';
const Insync = require('insync');


module.exports = Command;


function Command (options) {
  this._cmds = new Map();
  this._client = options.client;
}


Command.prototype.add = function add (name, fn) {
  this._cmds.set(name, fn);
};


Command.prototype.register = function register (plugins, callback) {
  const self = this;

  plugins = [].concat(plugins);

  Insync.each(plugins, function iterator (plugin, cb) {
    plugin.register(self, cb);
  }, callback);
};


Command.prototype.execute = function execute (message) {
  const client = this._client;
  const cmd = this._cmds.get(message.type);

  if (typeof cmd !== 'function') {
    return respond(client,
                   'command-error',
                   message.type,
                   new Error(`unknown command ${message.type}`));
  }

  cmd(message.payload, function executeCb (err, results) {
    if (err) {
      return respond(client, 'command-error', message.type, err);
    }

    if (results) {
      respond(client, 'command-result', message.type, results);
    }
  });
};


function respond (client, type, responseTo, data) {
  client.report({
    type,
    payload: {
      type: responseTo,
      data: data instanceof Error ? data.message : data
    }
  });
}
