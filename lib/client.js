'use strict';

const Util = require('util');
const Insync = require('insync');


module.exports = Client;


function Client (manager) {
  if (!(this instanceof Client)) {
    return new Client(manager);
  }

  this._manager = manager;
  this._reporters = [];
  this._commander = null;
}


Client.prototype.setCommander = function setCommander (commander) {
  if (commander === null || typeof commander !== 'object') {
    return this._manager.error(new TypeError('commander must be an object'));
  }

  if (typeof commander.connect !== 'function') {
    return this._manager.error(new TypeError('invalid connect() method'));
  }

  if (typeof commander.respond !== 'function') {
    return this._manager.error(new TypeError('invalid respond() method'));
  }

  this._commander = commander;
};


Client.prototype.addReporter = function addReporter (reporter) {
  if (reporter === null || typeof reporter !== 'object') {
    return this._manager.error(new TypeError('reporter must be an object'));
  }

  if (typeof reporter.report !== 'function') {
    return this._manager.error(new TypeError('invalid report() method'));
  }

  this._reporters.push(reporter);
};


Client.prototype.connect = function connect (callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  if (this._commander === null) {
    return callback(new Error('command interface not configured'));
  }

  this._commander.connect(this._manager, callback);
};


Client.prototype.respond = function respond (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  if (this._commander === null) {
    return callback(new Error('command interface not configured'));
  }

  if (typeof message !== 'string') {
    message = tryStringify(message);

    if (message instanceof Error) {
      return callback(message);
    }
  }

  this._commander.respond(message, callback);
};


Client.prototype.report = function report (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  if (typeof message !== 'string') {
    message = tryStringify(message);

    if (message instanceof Error) {
      return callback(message);
    }
  }

  Insync.each(this._reporters, function eachIterator (reporter, next) {
    reporter.report(message, next);
  }, callback);
};


function noop () {}


function tryStringify (input) {
  let output;

  try {
    output = JSON.stringify(input);
  } catch (err) {
    err.message = `${err.message}: ${Util.format(input)}`;
    output = err;
  }

  return output;
}
