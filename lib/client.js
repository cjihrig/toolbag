'use strict';

const Os = require('os');
const Insync = require('insync');
const Nes = require('nes');


module.exports = Client;


function Client (options) {
  this._id = null;
  this._client = new Nes.Client(options.server.host);
  this._reporters = options.reporters.map(function reporterMap (opts) {
    const Reporter = require(opts.id);

    return new Reporter(opts);
  });
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

    const info = {
      pid: process.pid,
      argv: process.argv,
      version: process.version,
      hostname: Os.hostname()
    };

    // Register with the server
    client.request({ path: 'register', payload: { commands, info } }, function registerCb (err, payload) {
      if (err) {
        return callback(err);
      }

      self._id = payload.clientId;

      // Subscribe to commands from the server
      client.subscribe('/command', handler, callback);
    });
  });
};


Client.prototype.respond = function respond (message, callback) {
  if (typeof callback !== 'function') {
    callback = noop;
  }

  this._client.request({ path: 'respond', payload: message }, callback);
};


Client.prototype.report = function report (message, callback) {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  if (typeof callback !== 'function') {
    callback = noop;
  }

  Insync.each(this._reporters, function eachIterator (reporter, next) {
    reporter.report(message, next);
  }, callback);
};


function noop () {}
