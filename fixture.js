// This is not part of the project, just a simple program that keeps the
// event loop open. Run as `node -r ./lib/index.js fixture.js`
'use strict';
const fs = require('fs');
const http = require('http');

process.binding('natives');

console.log('\n\nAPP STARTED');
setInterval(function () {
  fs.readFile(__filename, () => {

  });

  fs.readFile(__filename, () => {

  });

  fs.readFile(__filename, () => {

  });

  fs.readFile(__filename, () => {

  });
}, 1);

setInterval(function () {
  http.get('http://www.google.com');
}, 1000);
