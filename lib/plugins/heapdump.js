'use strict';

const Fs = require('fs');
const Path = require('path');
const Profiler = require('v8-profiler');
let settings;


module.exports = { register };


function register (manager, options, callback) {
  settings = Object.assign({}, options);
  manager.add('heapdump-create', create);
  callback();
}


function create (options, callback) {
  const name = options.name || process.pid;
  const outputFile = Path.join(settings.path, `${name}.heapsnapshot`);
  const snapshot = Profiler.takeSnapshot(name);

  function done (err) {
    snapshot.delete();
    callback(err);
  }

  snapshot.export()
    .on('error', done)
    .pipe(Fs.createWriteStream(outputFile))
    .on('finish', done);
}
