'use strict';
const Insync = require('insync');
const Own2Json = require('own2json');


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

  Insync.each(plugins, function iterator (obj, cb) {
    const plugin = obj.plugin;
    const options = obj.options || {};

    plugin.register(self, options, cb);
  }, callback);
};


Command.prototype.execute = function execute (message) {
  const client = this._client;
  const cmd = this._cmds.get(message.type);

  if (typeof cmd !== 'function') {
    const err = new Error(`unknown command ${message.type}`);
    err.toJSON = Own2Json;
    return respond(client,
                   'command-error',
                   message.type,
                   err);
  }

  cmd(message.payload, function executeCb (err, results) {
    if (err) {
      err.toJSON = Own2Json;
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
      data: data
    }
  });
}
