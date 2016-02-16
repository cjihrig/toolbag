'use strict';

const Os = require('os');
const Nes = require('nes');


module.exports = { register };


function register (manager, options, callback) {
  const commander = new Commander(Object.assign(options, { manager }));

  manager.client.setCommander(commander);
  callback();
}


function Commander (options) {
  this._id = null;
  this._client = new Nes.Client(options.host);
  this._client.onError = options.manager.error;
}


Commander.prototype.connect = function connect (manager, callback) {
  const self = this;
  const client = self._client;

  if (client === null) {
    return callback(new Error('client not connected'));
  }

  client.connect({ auth: {} }, function connectCb (err) {
    if (err) {
      return callback(err);
    }

    // Don't hold the event loop open
    client._ws._socket.unref();
    client._heartbeat.unref();

    const commands = manager.list();
    const info = {
      pid: process.pid,
      argv: process.argv,
      version: process.version,
      hostname: Os.hostname()
    };

    function messageHandler (message) {
      manager.execute(message);
    }

    // Register with the server
    client.request({ path: 'register', payload: { commands, info } }, function registerCb (err, payload) {
      if (err) {
        return callback(err);
      }

      self._id = payload.clientId;

      // Subscribe to commands from the server
      client.subscribe('/command', messageHandler, callback);
    });
  });
};


Commander.prototype.respond = function respond (message, callback) {
  this._client.request({ path: 'respond', payload: message }, callback);
};
