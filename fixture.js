// This is not part of the project, just a simple program that keeps the
// event loop open. Run as `node -r ./lib/index.js fixture.js`
'use strict';
const http = require('http');
console.log('\n\nAPP STARTED');
setInterval(function () {
  http.get('http://www.google.com');
}, 5000);
