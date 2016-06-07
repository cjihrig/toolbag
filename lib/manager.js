'use strict';

const EventEmitter = require('events');
const Util = require('util');
const Insync = require('insync');
const Own2Json = require('own2json');
const Reach = require('reach');
const Client = require('./client');


module.exports = Manager;


function Manager (options) {
  if (!(this instanceof Manager)) {
    return new Manager(options);
  }

  if (options === null || typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  this._errorPolicies = new Map([
    ['swallow', noop],
    ['log', logError],
    ['log-verbose', logVerboseError],
    ['throw', throwError],
    ['terminate', terminateOnError]
  ]);

  const errorPolicy = Reach(options,
                            'errors.policy',
                            { default: '' }).toLowerCase();

  this._cmds = new Map();
  this.setErrorHandler(errorPolicy);
  this.client = new Client(this);
}

Util.inherits(Manager, EventEmitter);


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

  Insync.eachSeries(plugins, function iterator (obj, cb) {
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
  }, function iteratorCb (err) {
    if (err) {
      return callback(err);
    }

    self.emit('register');
    callback();
  });
};


Manager.prototype.execute = function execute (message, callback) {
  const client = this.client;
  const cmd = this._cmds.get(message.command);

  if (typeof cmd !== 'function') {
    const err = new Error(`unknown command ${message.command}`);
    err.toJSON = Own2Json;
    return respond(client,
                   'command-error',
                   message.command,
                   err,
                   callback);
  }

  cmd(message.options || {}, function executeCb (err, results) {
    if (err) {
      err.toJSON = Own2Json;
      return respond(client, 'command-error', message.command, err, callback);
    }

    if (results !== undefined) {
      respond(client, 'command-result', message.command, results, callback);
    }
  });
};


Manager.prototype.getErrorHandler = function getErrorHandler (policy) {
  return this._errorPolicies.get(policy);
};


Manager.prototype.setErrorHandler = function setErrorHandler (policy) {
  const errorHandler = this.getErrorHandler(policy);

  if (typeof errorHandler !== 'function') {
    throw new TypeError(`unknown error policy: ${policy}`);
  }

  this.error = errorHandler;
};


Manager.prototype.defineErrorHandler = function defineErrorHandler (policy,
                                                                    handler) {
  if (typeof policy !== 'string') {
    throw new TypeError('policy must be a string');
  }

  if (typeof handler !== 'function') {
    throw new TypeError('handler must be a function');
  }

  this._errorPolicies.set(policy, handler);
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


function respond (client, command, responseTo, data, callback) {
  client.respond({
    command,
    payload: {
      type: responseTo,
      data: data
    }
  }, callback);
}
