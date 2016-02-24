'use strict';

const Os = require('os');
const Path = require('path');
const Fse = require('fs-extra');
const Merge = require('lodash.merge');
const Manager = require('./manager');
const Util = require('./util');

const defaults = {
  errors: {
    policy: 'log'
  },
  data: {
    path: Path.join(Os.tmpdir(), 'toolbag')
  },
  plugins: []
};


Util.getConfig(defaults, function getConfigCb (err, config) {  // eslint-disable-line handle-callback-err
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
      client.connect(function connectCb (err) {
        if (err) {
          return manager.error(err);
        }
      });
    }
  });
});
