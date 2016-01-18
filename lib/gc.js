'use strict';
const Gc = require('gc-profiler');
let gcEvents = [];


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
