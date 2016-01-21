'use strict';
const Merge = require('lodash.merge');
const Client = require('./client');
const Command = require('./command');
const Heapdump = require('./heapdump');
const Reporter = require('./reporter');
const Signal = require('./signal');
const defaults = {
  server: {
    url: 'http://localhost:5000'
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
const client = new Client(settings.server);
const command = new Command({ client });

command.register([
  { plugin: Heapdump },
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
