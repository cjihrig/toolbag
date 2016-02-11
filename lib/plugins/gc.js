'use strict';

const Gc = require('gc-profiler');
let running = false;
let gcEvents;


module.exports = { start, stop, getEvents, clearEvents };


function start () {
  if (running) {
    return;
  }

  running = true;
  clearEvents();
  Gc.on('gc', gcEventHandler);
}


function stop () {
  if (!running) {
    return;
  }

  running = false;
  clearEvents();
  Gc.removeListener('gc', gcEventHandler);
}


function getEvents () {
  if (!running) {
    throw new Error('can only get gc events when gc reporter is running');
  }

  return gcEvents.slice(0);
}


function clearEvents () {
  gcEvents = [];
}


function gcEventHandler (data) {
  gcEvents.push(data);
}
