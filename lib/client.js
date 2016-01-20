'use strict';
const Nes = require('nes');


module.exports = Client;


function Client (options) {
  this._id = null;
  this._client = new Nes.Client(options.url);
}


Client.prototype.connect = function connect (commands, handler, callback) {
  const self = this;
  const client = self._client;

  client.connect({ auth: {} }, function connectCb (err) {
    if (err) {
      return callback(err);
    }

    // Don't hold the event loop open
    client._ws._socket.unref();
    client._heartbeat.unref();

    // Register with the server
    client.request({ path: 'register', payload: { commands: commands } }, function registerCb (err, payload) {
      if (err) {
        return callback(err);
      }

      self._id = payload.clientId;

      // Subscribe to commands from the server
      client.subscribe('/command', handler, callback);
    });
  });
};


Client.prototype.report = function report (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  this._client.request({ path: 'report', payload: message }, callback);
};


function noop () {}
