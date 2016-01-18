'use strict';
const Client = require('./client');
const Heapdump = require('./heapdump');
const Reporter = require('./reporter');
const defaults = {
  server: 'http://localhost:5000',
  registerRoute: {
    method: 'POST',
    path: '/client/register'
  },
  reporting: {
    period: 1000
  }
};
const settings = Object.assign({}, defaults);
const client = new Client({ server: settings.server });
const reporter = new Reporter(Object.assign(settings.reporting, { client }));

client.connect({
  route: settings.registerRoute,
  handler: handleCommand
}, function connectCb (err) {
  if (err) {
    console.error(`toolbag: unable to connect to server - ${err.message}`);
    return;
  }

  reporter.start();
});


function handleCommand (command) {
  switch (command.command) {
    case 'take-heapdump':
      Heapdump.create(command.data, handleCommandCb);
      break;
  }
}


function handleCommandCb (err) {
  // TODO: Process arguments
  if (err) {
  }
}
