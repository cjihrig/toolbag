'use strict';


module.exports = function config (defaults, callback) {
  const plugin = {
    register (manager, options, callback) {
      manager.client.setCommander({
        connect (manager, callback) {
          callback();
        },
        respond (message, callback) {
          callback();
        }
      });
      callback();
    }
  };

  callback(null, { plugins: [{ plugin }] });
};
