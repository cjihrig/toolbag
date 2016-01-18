'use strict';
const Nes = require('nes');


module.exports = Client;


function Client (options) {
  this._id = null;
  this._reporting = null;
  this._register = options.register;
  this._client = new Nes.Client(options.url);
}


Client.prototype.connect = function connect (handler, callback) {
  const self = this;
  const client = self._client;

  client.connect(function connectCb (err) {
    if (err) {
      return callback(err);
    }

    // Don't hold the event loop open
    client._ws._socket.unref();
    client._heartbeat.unref();

    // Register with the server
    client.request(self._register, function registerCb (err, payload) {
      if (err) {
        return callback(err);
      }

      self._reporting = payload.reporting;

      // Subscribe to commands from the server
      client.subscribe(payload.subscribe, handler, function subscribeCb (err) {
        self._id = payload.id;
        callback(err);
      });
    });
  });
};


Client.prototype.report = function report (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  this._client.request({
    method: this._reporting.method,
    path: this._reporting.path,
    payload: message
  }, callback);
};


function noop () {}
