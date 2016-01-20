'use strict';
const Merge = require('lodash.merge');
const Client = require('./client');
const Command = require('./command');
const defaults = {
  server: {
    url: 'http://localhost:5000',
    register: {
      method: 'POST',
      path: '/client/register'
    }
  },
  reporting: {
    enabled: true,
    period: 1000,
    features: {
      cpu: true,
      memory: true,
      gc: true
    }
  }
};
const settings = Merge({}, defaults);
const client = new Client(settings.server);
const command = new Command({ client });

command.register([
  { plugin: require('./heapdump') },
  { plugin: require('./signal') },
  {
    plugin: require('./reporter'),
    options: Object.assign({ client }, settings.reporting)
  }
], function registerCb (err) {
  if (err) {
    console.error(`toolbag: unable to register plugins - ${err.message}`);
    return;
  }

  client.connect(function messageHandler (message) {
    command.execute(message);
  }, function connectCb (err) {
    if (err) {
      console.error(`toolbag: unable to connect to server - ${err.message}`);
      return;
    }
  });
});
