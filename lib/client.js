'use strict';
const Nes = require('nes');


module.exports = Client;


function Client (options) {
  this._id = null;
  this._reporting = null;
  this._client = new Nes.Client(options.server);
}


Client.prototype.connect = function connect (options, callback) {
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
    client.request(options.route, function registerCb (err, payload) {
      if (err) {
        return callback(err);
      }

      self._reporting = payload.reporting;

      // Subscribe to commands from the server
      client.subscribe(payload.subscribe, options.handler, function subCb (err) {
        self._id = payload.id;
        callback(err);
      });
    });
  });
};


Client.prototype.report = function report (options, callback) {
  const client = this._client;
  const route = Object.assign({ payload: options.payload }, this._reporting);

  client.request(route, function requestCb (err, payload) {
    callback(err, payload);
  });
};
