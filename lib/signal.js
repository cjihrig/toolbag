'use strict';
module.exports = { kill };


function kill (options) {
  const pid = options.pid || process.pid;

  process.kill(pid, options.signal);
}
