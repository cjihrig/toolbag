'use strict';

const Os = require('os');


module.exports = { register };


function register (manager, options, callback) {
  const commander = new Ipc(options);

  manager.client.setCommander(commander);
  callback();
}


function Ipc () {
  this._client = typeof process.send === 'function' ? noop : null;

  process.on('disconnected', function onDisconnected () {
    process.exit(0);
  });
}


Ipc.prototype.write = function write (data, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  if (typeof process.send !== 'function') {
    return callback();
  }

  process.send(data, callback);
};


Ipc.prototype.connect = function connect (manager, callback) {
  const commands = manager.list();
  const info = {
    pid: process.pid,
    argv: process.argv,
    version: process.version,
    hostname: Os.hostname()
  };

  process.on('message', function onMessage (message) {
    let data = message;

    if (typeof message === 'string') {
      try {
        data = JSON.parse(message);
      } catch (err) {
        return manager.error(err);
      }
    }

    manager.execute(data);
  });

  // Register with the parent process
  this.write({ path: 'register', payload: { commands, info } }, callback);
};


Ipc.prototype.respond = function respond (message, callback) {
  this.write({ path: 'respond', payload: message }, callback);
};


function noop () {}
