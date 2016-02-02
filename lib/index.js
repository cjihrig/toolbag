'use strict';
const Os = require('os');
const Path = require('path');
const Fse = require('fs-extra');
const Merge = require('lodash.merge');
const Client = require('./client');
const Command = require('./command');
const Getfile = require('./getfile');
const Heapdump = require('./heapdump');
const Profiler = require('./profiler');
const Reporter = require('./reporter');
const Signal = require('./signal');
const defaults = {
  network: {
    server: {
      host: 'http://localhost:5000'
    },
    reporters: [
      {
        // TODO: The reporters can be separate npm modules, required by name
        id: './reporters/http_reporter',
        method: 'POST',
        url: 'http://localhost:5000/report',
        options: {}
      }
    ]
  },
  data: {
    path: Path.join(Os.tmpdir(), 'toolbag')
  },
  reporting: {
    enabled: true,
    period: 1000,
    features: {
      cpu: true,
      memory: true,
      gc: true,
      handles: true,
      requests: true
    }
  }
};
const settings = Merge({}, defaults);
const client = new Client(settings.network);
const command = new Command({ client });

Fse.ensureDirSync(settings.data.path);

command.register([
  {
    plugin: Getfile,
    options: settings.data
  },
  {
    plugin: Heapdump,
    options: settings.data
  },
  {
    plugin: Profiler,
    options: settings.data
  },
  { plugin: Signal },
  {
    plugin: Reporter,
    options: Object.assign({ client }, settings.reporting)
  }
], function registerCb (err) {
  if (err) {
    console.error(`toolbag: unable to register plugins - ${err.message}`);
    return;
  }

  client.connect(command.list(), function messageHandler (message) {
    command.execute(message);
  }, function connectCb (err) {
    if (err) {
      console.error(`toolbag: unable to connect to server - ${err.message}`);
      return;
    }
  });
});
