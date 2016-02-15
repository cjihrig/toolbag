'use strict';

const Os = require('os');
const Path = require('path');
const Fse = require('fs-extra');
const Merge = require('lodash.merge');
const Manager = require('./manager');

const defaults = {
  data: {
    path: Path.join(Os.tmpdir(), 'toolbag')
  },
  plugins: []
};


getConfig(defaults, function getConfigCb (err, config) {  // eslint-disable-line handle-callback-err
  const settings = Merge({}, defaults, config);
  const manager = new Manager(settings);

  Fse.ensureDirSync(settings.data.path);

  manager.register(settings.plugins, function registerCb (err) {
    if (err) {
      return manager.error(err);
    }

    const client = manager.client;

    // Only connect to command interface if the user has configured it
    if (client._commander !== null) {
      client.connect(manager, function connectCb (err) {
        if (err) {
          return manager.error(err);
        }
      });
    }
  });
});


function getConfig (defaults, callback) {
  try {
    const configPath = process.env.TOOLBAG_PATH || Path.join(process.cwd(), '.toolbagrc.js');
    const ConfigFn = require(configPath);

    ConfigFn(defaults, callback);
  } catch (err) {
    callback(err);
  }
}
