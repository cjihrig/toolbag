'use strict';

const Merge = require('lodash.merge');
const Wreck = require('wreck');


function HttpReporter (options) {
  this._options = Merge({}, options);
}

module.exports = HttpReporter;


HttpReporter.prototype.report = function report (message, callback) {
  const settings = Merge({
    options: { payload: message }
  }, this._options);

  Wreck.request(settings.method, settings.url, settings.options, callback);
};
