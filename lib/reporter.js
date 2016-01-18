'use strict';
const Os = require('os');
const Gc = require('./gc');


module.exports = Reporter;


function Reporter (options) {
  this.period = options.period;
  this._client = options.client;
  this._interval = null;
}


Reporter.prototype.start = function start () {
  const self = this;

  // Make sure the reporter isn't already running
  if (self._interval !== null) {
    return;
  }

  self._interval = setInterval(function report () {
    const stats = {
      cpu: Os.cpus(),
      memory: process.memoryUsage(),
      gc: Gc.getEvents()
    };

    Gc.clearEvents();
    self._client.report({ payload: stats }, function reportCb (err, data) {
      // TODO: Process arguments
      if (err) {
      }
    });
  }, self.period);

  // Don't hold the event loop open
  self._interval.unref();
};


Reporter.prototype.stop = function stop () {
  clearInterval(this._interval);
  this._interval = null;
};
