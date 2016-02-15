'use strict';

const Merge = require('lodash.merge');
const Wreck = require('wreck');


module.exports = { register };


function register (manager, options, callback) {
  const reporter = new HttpReporter(options);

  manager.client.addReporter(reporter);
  callback();
}


function HttpReporter (options) {
  this._options = Merge({}, options);
}


HttpReporter.prototype.report = function report (message, callback) {
  const settings = Merge({
    options: { payload: message }
  }, this._options);

  Wreck.request(settings.method, settings.url, settings.options, callback);
};
