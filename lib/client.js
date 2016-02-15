'use strict';

const Insync = require('insync');


module.exports = Client;


function Client (options) {
  this._reporters = [];
  this._commander = null;
}


Client.prototype.setCommander = function setCommander (commander) {
  this._commander = commander;
};


Client.prototype.addReporter = function addReporter (reporter) {
  this._reporters.push(reporter);
};


Client.prototype.connect = function connect (manager, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  this._commander.connect(manager, callback);
};


Client.prototype.respond = function respond (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  if (this._commander === null) {
    return callback(new Error('client not connected'));
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
    output = err;
  }

  return output;
}
