'use strict';

const Path = require('path');


module.exports = { getConfigFile, getConfig };


function getConfigFile () {
  return process.env.TOOLBAG_PATH || Path.join(process.cwd(), '.toolbagrc.js');
}


function getConfig (defaults, callback) {
  try {
    const configPath = getConfigFile();
    const ConfigFn = require(configPath);

    ConfigFn(defaults, callback);
  } catch (err) {
    callback(err);
  }
}
