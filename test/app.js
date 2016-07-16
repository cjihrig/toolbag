'use strict';

const Path = require('path');
const Code = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const App = require('../lib/app');
const Client = require('../lib/client');
const Manager = require('../lib/manager');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


const fixturesDirectory = Path.join(__dirname, 'fixtures');


describe('App', () => {
  describe('run()', () => {
    it('runs with a command interface', (done) => {
      const connect = Client.prototype.connect;
      const error = console.error;
      const originalEnvVar = process.env.TOOLBAG_PATH;

      function restore () {
        Client.prototype.connect = connect;
        console.error = error;
        process.env.TOOLBAG_PATH = originalEnvVar;
      }

      function fail () {
        restore();
        Code.fail();
      }

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'command_interface.js');
      console.error = fail;
      Client.prototype.connect = (callback) => {
        restore();
        setImmediate(done);
        callback();
      };

      App.run();
    });

    it('handles errors from connect()', (done) => {
      const connect = Client.prototype.connect;
      const originalEnvVar = process.env.TOOLBAG_PATH;

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'command_interface.js');

      Client.prototype.connect = (callback) => {
        callback(new Error('foo'));
      };

      StandIn.replace(console, 'error', (s, message) => {
        Client.prototype.connect = connect;
        process.env.TOOLBAG_PATH = originalEnvVar;
        s.restore();
        expect(message).to.equal('toolbag: foo');
        done();
      });

      App.run();
    });

    it('does not error or connect with no command interface', (done) => {
      const register = Manager.prototype.register;
      const connect = Client.prototype.connect;
      const error = console.error;
      const originalEnvVar = process.env.TOOLBAG_PATH;

      function restore () {
        Manager.prototype.register = register;
        Client.prototype.connect = connect;
        console.error = error;
        process.env.TOOLBAG_PATH = originalEnvVar;
      }

      function fail () {
        restore();
        Code.fail();
      }

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'standard_config.js');
      Client.prototype.connect = fail;
      console.error = fail;
      Manager.prototype.register = (plugins, callback) => {
        setImmediate(() => {
          restore();
          done();
        });
        callback();
      };

      App.run();
    });

    it('handles plugin registration errors', (done) => {
      const register = Manager.prototype.register;
      const originalEnvVar = process.env.TOOLBAG_PATH;

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'standard_config.js');

      Manager.prototype.register = (plugins, callback) => {
        callback(new Error('foo'));
      };

      StandIn.replace(console, 'error', (s, message) => {
        process.env.TOOLBAG_PATH = originalEnvVar;
        Manager.prototype.register = register;
        s.restore();
        expect(message).to.equal('toolbag: foo');
        done();
      });

      App.run();
    });
  });

  it('handles errors in the config file', (done) => {
    const originalEnvVar = process.env.TOOLBAG_PATH;

    process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                         'error_config.js');

    StandIn.replace(console, 'error', (s, message) => {
      process.env.TOOLBAG_PATH = originalEnvVar;
      expect(message).to.equal('toolbag: foo');
      done();
    }, { stopAfter: 1 });

    App.run();
  });
});
