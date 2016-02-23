'use strict';

const Os = require('os');
const ActiveHandles = require('active-handles');
const ActiveRequests = require('./requests');
const EventLoop = require('./event_loop');
const Gc = require('./gc');
let collector = null;


module.exports = { register };


const processData = {
  argv: process.argv,
  execArgv: process.execArgv,
  execPath: process.execPath,
  mainModule: process.mainModule,
  pid: process.pid,
  title: process.title,
  uptime: process.uptime(),
  versions: process.versions
};

const systemData = {
  arch: process.arch,
  freemem: Os.freemem(),
  hostname: Os.hostname(),
  loadavg: Os.loadavg(),
  platform: process.platform,
  totalmem: Os.totalmem(),
  uptime: Os.uptime()
};


function register (manager, options, callback) {
  collector = new StatsCollector(Object.assign(options, { manager }));

  manager.add('reporter-start', function start (opts, cb) {
    collector.start();
    cb();
  });
  manager.add('reporter-stop', function stop (opts, cb) {
    collector.stop();
    cb();
  });
  manager.add('reporter-get-report', function getStats (opts, cb) {
    cb(null, collector.getStats());
  });
  manager.add('reporter-set-period', function setPeriod (opts, cb) {
    collector.stop();
    collector._period = opts.period;

    if (collector._features.eventLoop === true) {
      EventLoop.stop();
      EventLoop.start({
        sampleInterval: collector._period,
        limit: collector._eventLoopLimit
      });
    }

    collector.start();
    cb();
  });
  manager.add('reporter-set-features', function setFeatures (opts, cb) {
    collector._features = opts.features;

    if (collector._features.gc === true) {
      Gc.start();
    } else if (collector._features.gc === false) {
      Gc.stop();
    }

    if (collector._features.eventLoop === true) {
      EventLoop.start({
        sampleInterval: collector._period,
        limit: collector._eventLoopLimit
      });
    } else if (collector._features.eventLoop === false) {
      EventLoop.stop();
    }

    cb();
  });

  if (options.enabled) {
    collector.start();
  }

  callback();
}


function StatsCollector (options) {
  this._period = options.period;
  this._features = options.features;
  this._manager = options.manager;
  this._client = this._manager.client;
  this._eventLoopLimit = options.eventLoopLimit;
  this._interval = null;

  if (this._features.gc === true) {
    Gc.start();
  }

  if (this._features.eventLoop === true) {
    EventLoop.start({
      sampleInterval: this._period,
      limit: this._eventLoopLimit
    });
  }
}


StatsCollector.prototype.start = function start () {
  const self = this;

  // Make sure the collector isn't already running
  if (self._interval !== null) {
    return;
  }

  self._interval = setInterval(function collectorInterval () {
    const stats = self.getStats();

    self._client.report({
      type: 'stats',
      payload: stats
    }, function reportCb (err) {
      if (err) {
        return self._manager.error(err);
      }
    });
  }, self._period);

  // Don't hold the event loop open
  self._interval.unref();
};


StatsCollector.prototype.stop = function stop () {
  clearInterval(this._interval);
  this._interval = null;
};


StatsCollector.prototype.getStats = function getStats () {
  const features = this._features;
  const stats = {
    source: 'toolbag',
    timestamp: new Date(),
    meta: features.meta ? features.meta : undefined,
    process: features.process ? getProcessInfo() : undefined,
    system: features.process ? getSystemInfo() : undefined,
    cpu: features.cpu ? Os.cpus() : undefined,
    memory: features.memory ? process.memoryUsage() : undefined,
    gc: features.gc ? Gc.getEvents() : undefined,
    eventLoop: features.eventLoop ? EventLoop.getState() : undefined,
    handles: features.handles ? getHandles() : undefined,
    requests: features.requests ? ActiveRequests.getActiveRequests() : undefined
  };

  Gc.clearEvents();

  return stats;
};


function getProcessInfo () {
  processData.uptime = process.uptime();

  return processData;
}


function getSystemInfo () {
  systemData.uptime = Os.uptime();
  systemData.freemem = Os.freemem();
  systemData.loadavg = Os.loadavg();

  return systemData;
}


function getHandles () {
  const handles = ActiveHandles({
    source: false,
    highlight: false
  });

  return handles;
}
