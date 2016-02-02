# toolbag

[![Current Version](https://img.shields.io/npm/v/toolbag.svg)](https://www.npmjs.org/package/toolbag)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/toolbag.svg?branch=master)](https://travis-ci.org/continuationlabs/toolbag)
![Dependencies](http://img.shields.io/david/continuationlabs/toolbag.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

**THIS IS EARLY STAGE WORK IN PROGRESS**

`toolbag` is a collection of tooling intended to be preloaded in a Node application. The tooling (heapdumps, CPU profiling, runtime metrics reporting, etc.) runs within a Node process, and communicates with an external server. The web server provides insight into a running application.

## Running the Server

Before starting your application, the `toolbag` server should already be running. Currently, this means running `node server.js` in the [borland](https://github.com/continuationlabs/borland) root directory.

## Running the Client

By utilizing preloading, `toolbag` does not require any modifications to existing application code. For example, if you normally start your Node application using the command `node app.js`, then your command would become `node -r toolbag app.js`.

### Configuration

**The following isn't 100% true yet**

`toolbag` can be configured by adding a `toolbag` section to your `package.json`. It is important that the client (the code that runs with your application) knows how to connect to the server. By default, the client attempts to connect to `http://localhost:5000`. Once connected, the server tells the client how to communicate.

**MORE DOCUMENTATION TO COME AS THE PROJECT EVOLVES**
