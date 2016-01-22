'use strict';
const Fs = require('fs');
const Profiler = require('v8-profiler');


module.exports = { register };


function register (command, options, callback) {
  command.add('profiler-start', start);
  callback();
}


function start (options, callback) {
  const name = options.name;
  const duration = options.duration >>> 0;

  Profiler.startProfiling(name);

  if (+options.duration === duration) {
    const timer = setTimeout(function durationCb () {
      stop({ name }, function stopCb (err) {
        callback(err, { name, done: true });
      });
    }, duration);

    // Don't hold the event loop open
    timer.unref();
  }

  callback(null, { name, done: false });
}


function stop (options, callback) {
  const name = options.name;
  const profile = Profiler.stopProfiling(name);

  function done (err) {
    profile.delete();
    callback(err);
  }

  profile.export()
    .on('error', done)
    .pipe(Fs.createWriteStream(`${options.name}.cpuprofile`))
    .on('finish', done);
}
