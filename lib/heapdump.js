'use strict';
const Fs = require('fs');
const Profiler = require('v8-profiler');


module.exports = { register };


function register (command, options, callback) {
  command.add('heapdump-create', create);
  callback();
}


function create (options, callback) {
  const snapshot = Profiler.takeSnapshot(options.name);

  function done (err) {
    snapshot.delete();
    callback(err);
  }

  snapshot.export()
    .on('error', done)
    .pipe(Fs.createWriteStream(`${options.name}.heapsnapshot`))
    .on('finish', done);
}
