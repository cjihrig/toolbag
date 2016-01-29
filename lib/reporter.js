'use strict';
const Os = require('os');
const ActiveHandles = require('active-handles');
const ActiveRequests = require('./requests');
const Gc = require('./gc');
let reporter;


module.exports = { register };


function register (command, options, callback) {
  reporter = new Reporter(options);

  command.add('reporter-start', function start (opts, cb) {
    reporter.start();
    cb();
  });
  command.add('reporter-stop', function stop (opts, cb) {
    reporter.stop();
    cb();
  });
  command.add('reporter-get-report', function getReport (opts, cb) {
    cb(null, reporter.getReport());
  });
  command.add('reporter-set-period', function setPeriod (opts, cb) {
    reporter.stop();
    reporter._period = opts.period;
    reporter.start();
    cb();
  });
  command.add('reporter-set-features', function setFeatures (opts, cb) {
    reporter._features = opts.features;

    if (reporter._features.gc === true) {
      Gc.start();
    } else if (reporter._features.gc === false) {
      Gc.stop();
    }

    cb();
  });

  if (options.enabled) {
    reporter.start();
  }

  callback();
}


function Reporter (options) {
  this._period = options.period;
  this._features = options.features;
  this._client = options.client;
  this._interval = null;

  if (this._features.gc === true) {
    Gc.start();
  }
}


Reporter.prototype.start = function start () {
  const self = this;

  // Make sure the reporter isn't already running
  if (self._interval !== null) {
    return;
  }

  self._interval = setInterval(function reportInterval () {
    const stats = self.getReport();

    self._client.report({
      type: 'stats',
      payload: stats
    });
  }, self._period);

  // Don't hold the event loop open
  self._interval.unref();
};


Reporter.prototype.stop = function stop () {
  clearInterval(this._interval);
  this._interval = null;
};


Reporter.prototype.getReport = function getReport () {
  const features = this._features;
  const stats = {
    cpu: features.cpu ? Os.cpus() : undefined,
    memory: features.memory ? process.memoryUsage() : undefined,
    gc: features.gc ? Gc.getEvents() : undefined,
    handles: features.handles ? getHandles() : undefined,
    requests: features.requests ? ActiveRequests.getActiveRequests() : undefined
  };

  Gc.clearEvents();

  return stats;
};


function getHandles () {
  const handles = ActiveHandles({
    source: false,
    highlight: false
  });

  return handles;
}
