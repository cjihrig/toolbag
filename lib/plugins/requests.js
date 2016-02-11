'use strict';

const Merge = require('lodash.merge');


module.exports = { getActiveRequests };


function getActiveRequests () {
  const activeRequests = process._getActiveRequests();
  const result = new Array(activeRequests.length);

  for (let i = 0; i < activeRequests.length; i++) {
    const req = activeRequests[i];
    const type = req.constructor.name;
    result[i] = Merge({}, req, { type });
  }

  return result;
}
