'use strict';


module.exports = { register };


function register (command, options, callback) {
  command.add('signal-kill', kill);
  callback();
}


function kill (options, callback) {
  const pid = options.pid || process.pid;
  let err = null;

  try {
    process.kill(pid, options.signal);
  } catch (e) {
    err = e;
  }

  callback(err);
}
