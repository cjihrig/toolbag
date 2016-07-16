'use strict';

const Path = require('path');
const Code = require('code');
const Lab = require('lab');
const Util = require('../lib/util');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


const fixturesDirectory = Path.join(__dirname, 'fixtures');


describe('Util', () => {
  describe('getConfigFile()', () => {
    it('uses TOOLBAG_PATH first and fallsback to config file', (done) => {
      const originalEnvVar = process.env.TOOLBAG_PATH;
      process.env.TOOLBAG_PATH = '/foo/bar/baz';
      const first = Util.getConfigFile();
      delete process.env.TOOLBAG_PATH;
      const second = Util.getConfigFile();
      process.env.TOOLBAG_PATH = originalEnvVar;

      expect(first).to.equal('/foo/bar/baz');
      expect(second).to.equal(Path.join(process.cwd(), '.toolbagrc.js'));
      done();
    });
  });

  describe('getConfig()', () => {
    it('gets the config from getConfigFile()', (done) => {
      const originalEnvVar = process.env.TOOLBAG_PATH;
      const defaults = { foo: 'bar' };

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'standard_config.js');

      Util.getConfig(defaults, (err, config) => {
        process.env.TOOLBAG_PATH = originalEnvVar;
        expect(err).to.not.exist();
        expect(config).to.equal(defaults);
        done();
      });
    });

    it('handles errors while getting config', (done) => {
      const originalEnvVar = process.env.TOOLBAG_PATH;

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'error_config.js');

      Util.getConfig({}, (err, config) => {
        process.env.TOOLBAG_PATH = originalEnvVar;
        expect(err).to.be.an.error();
        expect(err.message).to.equal('foo');
        expect(config).to.not.exist();
        done();
      });
    });

    it('ignores errors when the config file is not found', (done) => {
      const originalEnvVar = process.env.TOOLBAG_PATH;

      process.env.TOOLBAG_PATH = Path.join(fixturesDirectory,
                                           'not_a_real_config.js');

      Util.getConfig({}, (err, config) => {
        process.env.TOOLBAG_PATH = originalEnvVar;
        expect(err).to.not.exist();
        expect(config).to.not.exist();
        done();
      });
    });
  });
});
