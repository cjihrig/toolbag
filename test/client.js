'use strict';

const Code = require('code');
const Lab = require('lab');
const Client = require('../lib/client');
const Manager = require('../lib/manager');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


function createManager () {
  const m = new Manager({ errors: { policy: 'throw' } });

  m.error = (err) => {
    m._err = err;
  };

  return m;
}


describe('Client', () => {
  describe('constructor', () => {
    it('creates a new Client object', (done) => {
      const m = createManager();
      const c = new Client(m);

      expect(c).to.be.an.instanceof(Client);
      expect(c._manager).to.shallow.equal(m);
      expect(c._reporters).to.equal([]);
      expect(c._commander).to.be.null();
      done();
    });

    it('returns an instance of Client without new', (done) => {
      const m = createManager();
      const c = Client(m);

      expect(c).to.be.an.instanceof(Client);
      expect(c._manager).to.shallow.equal(m);
      expect(c._reporters).to.equal([]);
      expect(c._commander).to.be.null();
      done();
    });
  });


  describe('setCommander()', () => {
    it('sets the commander object', (done) => {
      const c = new Client();
      const commander = { connect: () => {}, respond: () => {} };

      expect(c._commander).to.be.null();
      c.setCommander(commander);
      expect(c._commander).to.shallow.equal(commander);
      done();
    });

    it('errors on invalid commander', (done) => {
      const m = createManager();
      const c = new Client(m);
      const errRe = /commander must be an object|invalid (connect|respond)\(\) method/;

      function fail (commander) {
        c.setCommander(commander);
        expect(m._err).to.be.an.error(TypeError, errRe);
        m._err = null;
      }

      fail(null);
      fail(undefined);
      fail('');
      fail(0);
      fail([]);
      fail({});
      fail({ connect: 1, respond: () => {} });
      fail({ connect: () => {}, respond: 1 });
      expect(c._commander).to.equal(null);
      done();
    });
  });


  describe('addReporter()', () => {
    it('adds reporters to the reporters list', (done) => {
      const c = new Client();
      const reporter = { report: () => {} };

      expect(c._reporters).to.equal([]);
      c.addReporter(reporter);
      expect(c._reporters).to.have.length(1);
      expect(c._reporters[0]).to.shallow.equal(reporter);
      done();
    });

    it('errors on invalid reporter', (done) => {
      const m = createManager();
      const c = new Client(m);
      const errRe = /reporter must be an object|invalid report\(\) method/;

      function fail (reporter) {
        c.addReporter(reporter);
        expect(m._err).to.be.an.error(TypeError, errRe);
        m._err = null;
      }

      fail(null);
      fail(undefined);
      fail('');
      fail(0);
      fail([]);
      fail({});
      fail({ report: 1 });
      expect(c._reporters).to.equal([]);
      done();
    });
  });


  describe('connect()', () => {
    it('calls the _commanders connect method and executes the provided callback when done', (done) => {
      const m = createManager();
      const c = new Client(m);
      const commander = {
        connect (manager, callback) {
          expect(manager).to.shallow.equal(m);
          expect(callback).to.be.a.function();
          callback();
        },
        respond () {}
      };

      c.setCommander(commander);
      c.connect(done);
    });

    it('calls the _commanders connect method', (done) => {
      const m = createManager();
      const c = new Client(m);
      const commander = {
        connect (manager, callback) {
          expect(manager).to.shallow.equal(m);
          expect(callback).to.be.a.function();
          done();
        },
        respond () {}
      };

      c.setCommander(commander);
      c.connect();
    });

    it('errors if there is no commander', (done) => {
      const c = new Client();

      c.connect((err) => {
        expect(err).to.be.an.error(Error, 'command interface not configured');
        done();
      });
    });
  });


  describe('respond()', () => {
    it('results in an error if there is no commander', (done) => {
      const c = new Client();

      c.respond(null, (err) => {
        expect(err).to.be.an.error(Error, 'command interface not configured');
        done();
      });
    });

    it('results in an error if the message can not be stringify cleanly', (done) => {
      const c = new Client();
      const message = { foo: true };

      message.bar = message;
      c._commander = {};
      c.respond(message, (err) => {
        expect(err).to.be.an.error(Error, 'Converting circular structure to JSON: { foo: true, bar: [Circular] }');
        done();
      });
    });

    it('calls the respond() method of the commander object with a string message', (done) => {
      const c = new Client();
      c._commander = {
        respond (message, callback) {
          expect(message).to.equal('hello world');
          expect(callback).to.be.a.function();
          callback();
        }
      };
      c.respond('hello world', done);
    });

    it('calls the respond() method of the commander object with an object message', (done) => {
      const c = new Client();

      c._commander = {
        respond (message, callback) {
          message = JSON.parse(message);
          expect(message).to.equal({ foo: 'bar' });
          expect(callback).to.be.a.function();
          done();
        }
      };
      c.respond({ foo: 'bar' });
    });
  });


  describe('report()', () => {
    it('results in an error if the message can not be stringify cleanly', (done) => {
      const c = new Client();
      const message = { foo: true };

      message.bar = message;
      c.report(message, (err) => {
        expect(err).to.be.an.error(Error, 'Converting circular structure to JSON: { foo: true, bar: [Circular] }');
        done();
      });
    });

    it('calls the report() method of all the reporters', (done) => {
      const c = new Client();
      const one = {
        report (message, callback) {
          message = JSON.parse(message);
          expect(message).to.equal({ foo: 'bar' });
          callback();
        }
      };
      const two = {
        report (message, callback) {
          message = JSON.parse(message);
          expect(message).to.equal({ foo: 'bar' });
          setImmediate(callback);
        }
      };
      const three = {
        report (message, callback) {
          expect(message).to.equal('hello world');
          callback();
        }
      };

      c._reporters = [one, two];
      c.report({ foo: 'bar' });
      c._reporters = [three];
      c.report('hello world', done);
    });
  });
});
