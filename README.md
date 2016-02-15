# toolbag

[![Current Version](https://img.shields.io/npm/v/toolbag.svg)](https://www.npmjs.org/package/toolbag)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/toolbag.svg?branch=master)](https://travis-ci.org/continuationlabs/toolbag)
![Dependencies](http://img.shields.io/david/continuationlabs/toolbag.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

**THIS IS EARLY STAGE WORK IN PROGRESS**

`toolbag` is a collection of tooling intended to be preloaded in a Node application. The tooling (heapdumps, CPU profiling, runtime metrics reporting, etc.) runs within a Node process. `toolbag` exposes two interfaces, described below, as well as a plugin system for extending its functionality.

The first interface is the reporting interface. This interface is used to send runtime data to one or more destinations. Each reporter is implemented as a plugin.

The second interface is the command interface. This interface, which is also implemented as a plugin, allows commands to be sent to the running application. Example commands include taking a heapdump or starting/stopping the CPU profiler.

## Running the Command Server

The command server is not mandatory, and is only required if you plan to use the command interface. If you choose to use it, you should start the server before starting your application. See the section on client configuration for information on having the client connect to the server.

## Running the Client

By utilizing preloading, `toolbag` does not require any modifications to existing application code. For example, if you normally start your Node application using the command `node app.js`, then your command would become `node -r toolbag app.js`.

### Configuration

`toolbag` is configured by adding a `.toolbagrc.js` file to your project's working directory. This file should export a single function whose signature is `configure (defaults, callback)`. `defaults` contain the default configuration values set by `toolbag`. `callback` is a function with the signature `callback (err, config)`. `err` represents an error that might have occurred. `config` is an object that will be applied to `defaults`. The `config` object should adhere to the following schema.

  - `errors` (object) - Defines how `toolbag` errors are handled. Because `toolbag` is preloaded, normal applications are unable to handle any errors that may occur. These settings allow `toolbag` users to define an error handling policy. The `errors` object has the following schema.
    - `policy` (string) - Defines the error handling policy. Can be one of the following strings.
      - `swallow` - Errors are discarded.
      - `log` - Prints the error message to `stderr`. This is the default.
      - `log-verbose` - Prints the error message and stack trace to `stderr`.
      - `throw` - Throws the error.
      - `terminate` - Prints the error message and stack trace to `stderr` then calls `process.exit(1)`.
  - `data` (object) - Information regarding any persistent storage required by `toolbag`.
    - `path` (string) - The directory where files (such as heapdumps) are stored. Defaults to a `toolbag` directory in the system's temp directory.
  - `plugins` (array of objects) - An array of `toolbag` plugins to register. Each plugin object follows the following schema.
    - `plugin` (object) - The plugin being registered. This should be the result of `require()`.
    - `options` (object) - An optional object that is used to pass any plugin specific configuration options.

### Example `.toolbagrc.js` File

Note that a number of plugins are currently provided with `toolbag`, as shown in the following example. The long term plan is to remove them from core and publish them as separate modules on npm.

```javascript
'use strict';

const BorlandCommander = require('toolbag/lib/plugins/borland_commander');
const Getfile = require('toolbag/lib/plugins/getfile');
const Heapdump = require('toolbag/lib/plugins/heapdump');
const HttpReporter = require('toolbag/lib/plugins/http_reporter');
const IpcCommander = require('toolbag/lib/plugins/ipc_commander');
const ProcessReporter = require('toolbag/lib/plugins/process_reporter');
const Profiler = require('toolbag/lib/plugins/profiler');
const SharedSymbol = require('toolbag/lib/plugins/shared_symbol');
const StatsCollector = require('toolbag/lib/plugins/stats_collector');
const Signal = require('toolbag/lib/plugins/signal');
const UdpReporter = require('toolbag/lib/plugins/udp_reporter');


module.exports = function config (defaults, callback) {
  callback(null, {
    errors: {
      policy: 'log'
    },
    plugins: [
      {
        plugin: BorlandCommander,
        options: {
          host: 'http://localhost:5000'
        }
      },
      {
        plugin: HttpReporter,
        options: {
          id: 'http reporter',
          method: 'POST',
          url: 'http://localhost:5000/report',
          options: {}
        }
      },
      {
        plugin: UdpReporter,
        options: {
          id: 'udp reporter',
          socketType: 'udp4',
          port: 5001,
          host: 'localhost'
        }
      },
      {
        plugin: ProcessReporter
      },
      {
        plugin: Getfile,
        options: defaults.data
      },
      {
        plugin: Heapdump,
        options: defaults.data
      },
      {
        plugin: Profiler,
        options: defaults.data
      },
      { plugin: SharedSymbol },
      { plugin: Signal },
      {
        plugin: StatsCollector,
        options: {
          enabled: true,
          period: 1000,
          eventLoopLimit: 30,
          features: {
            process: true,
            system: true,
            cpu: true,
            memory: true,
            gc: true,
            handles: true,
            requests: true,
            eventLoop: true,
            meta: {
              tags: ['api']
            }
          }
        }
      }
    ]
  });
};
```
