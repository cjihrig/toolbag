'use strict';

const Insync = require('insync');
const Own2Json = require('own2json');
const Reach = require('reach');
const Client = require('./client');

const errorPolicyMap = {
  'swallow': noop,
  'log': logError,
  'log-verbose': logVerboseError,
  'throw': throwError,
  'terminate': terminateOnError
};


module.exports = Manager;


function Manager (options) {
  if (!(this instanceof Manager)) {
    return new Manager(options);
  }

  if (options === null || typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  const errorPolicy = Reach(options,
                            'errors.policy',
                            { default: '' }).toLowerCase();

  const errorHandler = errorPolicyMap[errorPolicy];

  if (typeof errorHandler !== 'function') {
    throw new TypeError(`unknown error policy: ${errorPolicy}`);
  }

  this._cmds = new Map();
  this.error = errorHandler;
  this.client = new Client(this);
}


Manager.prototype.add = function add (name, fn) {
  if (typeof name !== 'string') {
    return this.error(new TypeError('command name must be a string'));
  }

  if (typeof fn !== 'function') {
    return this.error(new TypeError('command must be a function'));
  }

  this._cmds.set(name, fn);
};


Manager.prototype.list = function list () {
  const commands = [];

  for (const cmd of this._cmds.keys()) {
    commands.push(cmd);
  }

  return commands;
};


Manager.prototype.register = function register (plugins, callback) {
  const self = this;

  plugins = [].concat(plugins);

  if (typeof callback !== 'function') {
    callback = noop;
  }

  Insync.each(plugins, function iterator (obj, cb) {
    if (obj === null || typeof obj !== 'object') {
      return cb(new TypeError('plugin must be an object'));
    }

    const plugin = obj.plugin;

    if (plugin === null || typeof plugin !== 'object') {
      return cb(new TypeError('plugin must be an object'));
    }

    if (typeof plugin.register !== 'function') {
      return cb(new TypeError('invalid register() method'));
    }

    const options = obj.options !== undefined ? obj.options : {};

    plugin.register(self, options, cb);
  }, callback);
};


Manager.prototype.execute = function execute (message) {
  const client = this.client;
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

    if (results !== undefined) {
      respond(client, 'command-result', message.command, results);
    }
  });
};


function noop () {}


function logError (err) {
  console.error(`toolbag: ${err.message}`);
}


function logVerboseError (err) {
  console.error(`toolbag: ${err.stack}`);
}


function throwError (err) {
  throw err;
}


function terminateOnError (err) {
  logVerboseError(err);
  process.exit(1);
}


function respond (client, command, responseTo, data) {
  client.respond({
    command,
    payload: {
      type: responseTo,
      data: data
    }
  });
}
