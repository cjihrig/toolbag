'use strict';
const Gc = require('gc-profiler');
let gcEvents = [];

// TODO: add start/stop features
module.exports = { getEvents, clearEvents };


function getEvents () {
  return gcEvents.slice(0);
}


function clearEvents () {
  gcEvents = [];
}


Gc.on('gc', function gcEventHandler (data) {
  gcEvents.push(data);
});
