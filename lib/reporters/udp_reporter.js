'use strict';

const Dgram = require('dgram');
const Merge = require('lodash.merge');
const defaults = {
  socketType: 'udp4'
};


function UdpReporter (options) {
  this._options = Merge({}, defaults, options);
}

module.exports = UdpReporter;


UdpReporter.prototype.report = function report (message, callback) {
  const settings = this._options;
  const client = Dgram.createSocket(settings.socketType);

  client.send(message,
              0,
              message.length,
              settings.port,
              settings.host,
              function sendCb (err) {
    client.close(function closeCb () {
      callback(err);
    });
  });
};
