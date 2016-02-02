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

Command.prototype.list = function list () {
  const commands = [];
  for (const cmd of this._cmds.keys()) {
    commands.push(cmd);
  }
  return commands;
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
  const cmd = this._cmds.get(message.command);

  if (typeof cmd !== 'function') {
    const err = new Error(`unknown command ${message.command}`);
    err.toJSON = Own2Json;
    return respond(client,
                   'command-error',
                   message.command,
                   err);
  }

  cmd(message.options || {}, function executeCb (err, results) {
    if (err) {
      err.toJSON = Own2Json;
      return respond(client, 'command-error', message.command, err);
    }

    if (results) {
      respond(client, 'command-result', message.command, results);
    }
  });
};


function respond (client, command, responseTo, data) {
  client.respond({
    command,
    payload: {
      type: responseTo,
      data: data
    }
  });
}
