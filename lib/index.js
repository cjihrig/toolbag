'use strict';
const Merge = require('lodash.merge');
const Client = require('./client');
const Command = require('./command');
const Reporter = require('./reporter');
const defaults = {
  server: {
    url: 'http://localhost:5000',
    register: {
      method: 'POST',
      path: '/client/register'
    }
  },
  reporting: {
    period: 1000
  }
};
const settings = Merge({}, defaults);
const client = new Client(settings.server);
const command = new Command({ client });
const reporter = new Reporter(Object.assign({ client }, settings.reporting));

command.register([
  require('./heapdump'),
  require('./signal')
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

    reporter.start();
  });
});
