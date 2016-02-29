'use strict';

const Module = require('module');


module.exports = { register };


function register (manager, options, callback) {
  const blacklist = Object.assign({}, options.blacklist);
  const blModules = blacklist.modules;
  const blBindings = blacklist.bindings;

  manager.add('policy-get-blacklist', function getBlacklist (options, cb) {
    cb(null, blacklist);
  });

  if (blModules !== null && typeof blModules === 'object') {
    const resolveFilename = Module._resolveFilename;

    Module._resolveFilename = function (request, parent) {
      const blEntry = blModules[request];

      if (blEntry) {
        const handler = manager.getErrorHandler(blEntry) || manager.error;

        // Intentionally do not return after calling handler
        handler(new Error(`use of blacklisted module: ${request}`));
      }

      return resolveFilename.apply(Module, arguments);
    };
  }

  if (blBindings !== null && typeof blBindings === 'object') {
    const binding = process.binding;

    process.binding = function (request) {
      const blEntry = blBindings[request];

      if (blEntry) {
        const handler = manager.getErrorHandler(blEntry) || manager.error;

        // Intentionally do not return after calling handler
        handler(new Error(`use of blacklisted binding: ${request}`));
      }

      return binding.apply(process, arguments);
    };
  }

  callback();
}
