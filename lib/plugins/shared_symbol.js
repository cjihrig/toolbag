'use strict';


module.exports = { register };


function register (manager, options, callback) {
  const key = options.key || 'toolbag';
  const symbol = Symbol.for(key);

  global[symbol] = manager;
  callback();
}
