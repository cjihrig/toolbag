'use strict';
const Fs = require('fs');
const Path = require('path');
let settings;


module.exports = { register };


function register (manager, options, callback) {
  settings = Object.assign({}, options);
  manager.add('getfile-as-buffer', sendFileAsBuffer);
  callback();
}


function sendFileAsBuffer (options, callback) {
  const fileName = Path.join(settings.path, options.name);

  Fs.readFile(fileName, function readFileCb (err, data) {
    if (err) {
      return callback(err);
    }

    callback(null, data.toJSON());
  });
}
