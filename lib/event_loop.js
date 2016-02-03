'use strict';

const Loopbench = require('loopbench');
let sampler = null;


module.exports = { start, stop, getState };


function start (options) {
  if (sampler) {
    return;
  }

  sampler = Loopbench(options);
}


function stop () {
  if (!sampler) {
    return;
  }

  sampler.stop();
  sampler = null;
}


function getState () {
  if (!sampler) {
    throw new Error('can only get event loop state when event loop reporter is running');
  }

  return {
    delay: sampler.delay,
    limit: sampler.limit,
    overLimit: sampler.overLimit
  };
}
