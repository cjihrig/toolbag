'use strict';

const Code = require('code');
const Insync = require('insync');
const Lab = require('lab');
const Own2Json = require('own2json');
const StandIn = require('stand-in');
const Client = require('../lib/client');
const Manager = require('../lib/manager');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;


describe('Manager', () => {
  describe('constructor', () => {
    it('creates a new Manager object', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      expect(m).to.be.an.instanceof(Manager);
      expect(m._cmds).to.be.an.instanceof(Map);
      expect(m.client).to.be.an.instanceof(Client);
      expect(m.error).to.be.a.function();
      done();
    });

    it('returns an instance of Manager without new', (done) => {
      const m = Manager({ errors: { policy: 'throw' } });

      expect(m).to.be.an.instanceof(Manager);
      expect(m._cmds).to.be.an.instanceof(Map);
      expect(m.client).to.be.an.instanceof(Client);
      expect(m.error).to.be.a.function();
      done();
    });

    it('throws if invalid options are provided', (done) => {
      function fail (options) {
        return () => {
          return new Manager(options);
        };
      }

      expect(fail()).to.throw(TypeError);
      expect(fail(null)).to.throw(TypeError);
      expect(fail({ errors: null })).to.throw(TypeError);
      expect(fail({ errors: 'foo' })).to.throw(TypeError);
      done();
    });
  });


  describe('add()', () => {
    it('can add new commands', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      expect(m._cmds.size).to.equal(0);
      m.add('test', () => {});
      m.add('test', () => {});  // handle duplicates
      expect(m._cmds.size).to.equal(1);
      done();
    });

    it('errors on invalid arguments', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      function fail (name, fn) {
        expect(() => {
          m.add(name, fn);
        }).to.throw(TypeError);
      }

      fail();
      fail(null);
      fail(1);
      fail(true);
      fail('foo');
      fail('foo', null);
      fail('foo', 1);
      fail('foo', true);
      done();
    });
  });


  describe('list()', () => {
    it('returns all of the available command names', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      expect(m._cmds.size).to.equal(0);
      m.add('test1', () => {});
      m.add('test2', () => {});
      m.add('test3', () => {});
      expect(m._cmds.size).to.equal(3);

      const result = m.list();
      expect(result).to.deep.equal(['test1', 'test2', 'test3']);
      done();
    });
  });


  describe('register()', () => {
    it('calls the register() method of every plugin supplied', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });
      const plug1 = {
        plugin: {
          register (manager, options, callback) {
            setImmediate(() => {
              expect(manager).to.equal(m);
              expect(options).to.deep.equal({ foo: 'bar', bing: 'baz' });
              expect(callback).to.be.a.function();
              callback(null);
            });
          }
        },
        options: { foo: 'bar', bing: 'baz' }
      };
      const plug2 = {
        plugin: {
          register (manager, options, callback) {
            expect(manager).to.equal(m);
            expect(options).to.deep.equal({});
            expect(callback).to.be.a.function();
            callback(null);
          }
        }};

      m.register([plug1, plug2], done);
    });

    it('works with no callback function', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });
      const plugin = {
        plugin: {
          register (manager, options, callback) {
            callback();
            setImmediate(done);
          }
        }
      };

      m.register(plugin);
    });

    it('bubbles up any errors during registration', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });
      const plug1 = {
        plugin: {
          register (manager, options, callback) {
            setImmediate(() => {
              expect(manager).to.equal(m);
              expect(options).to.deep.equal({ foo: 'bar', bing: 'baz' });
              expect(callback).to.be.a.function();
              callback(new Error('test error'));
            });
          }
        },
        options: { foo: 'bar', bing: 'baz' }
      };

      m.register(plug1, (err) => {
        expect(err.message).to.equal('test error');
        done();
      });
    });

    it('errors on schema violations', (done) => {
      const m = new Manager({ errors: { policy: 'throw' }});
      const plugins = [
        undefined,
        null,
        '',
        1,
        false,
        {},
        { plugin: null },
        { plugin: 'foo' },
        { plugin: {} },
        { plugin: { register: 1 } }
      ];

      Insync.each(plugins, (plugin, cb) => {
        m.register(plugin, (err) => {
          expect(err).to.be.an.instanceof(TypeError);
          cb();
        });
      }, done);
    });
  });


  describe('execute()', () => {
    it('will respond with an error payload if the command is not available', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      m.client.respond = (message) => {
        expect(message.command).to.equal('command-error');
        expect(message.payload.type).to.equal('kill-9');
        expect(message.payload.data).to.be.an.instanceof(Error);
        expect(message.payload.data.stack.length).to.be.above(1);
        expect(message.payload.data.message).to.equal('unknown command kill-9');
        expect(message.payload.data.toJSON).to.equal(Own2Json);
        done();
      };
      m.execute({ command: 'kill-9', options: { now: true }});
    });

    it('will execute the command from the command map if found and pass any errors to through the callback', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      m.client.respond = (message) => {
        expect(message.command).to.equal('command-error');
        expect(message.payload.type).to.equal('test');
        expect(message.payload.data).to.be.an.instanceof(Error);
        expect(message.payload.data.stack.length).to.be.above(1);
        expect(message.payload.data.message).to.equal('test error');
        expect(message.payload.data.toJSON).to.equal(Own2Json);
        done();
      };

      m.add('test', (options, callback) => {
        expect(options).to.deep.equal({ foo: true });
        setImmediate(() => {
          callback(new Error('test error'));
        });
      });

      m.execute({ command: 'test', options: { foo: true } });
    });

    it('will execute the command from the command map if found', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      m.add('test', (options, callback) => {
        expect(options).to.deep.equal({});
        setImmediate(() => {
          callback(null);
        });
      });

      m.execute({ command: 'test' });
      done();
    });

    it('will execute the command from the command map if found and pass results through the callback', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      m.client.respond = (message) => {
        expect(message.command).to.equal('command-result');
        expect(message.payload.type).to.equal('test');
        expect(message.payload.data).to.equal('OK');
        done();
      };

      m.add('test', (options, callback) => {
        setImmediate(() => {
          callback(null, 'OK');
        });
      });

      m.execute({ command: 'test' });
    });
  });


  describe('error()', () => {
    it('"swallow" option discards errors', (done) => {
      const m = new Manager({ errors: { policy: 'swallow' } });

      expect(m.error.name).to.equal('noop');
      m.error(new Error());
      done();
    });

    it('"log" option logs error messages to the stderr', (done) => {
      const m = new Manager({ errors: { policy: 'log' } });

      StandIn.replace(console, 'error', (s, message) => {
        s.restore();
        expect(message).to.equal('toolbag: test error');
        done();
      });
      m.error(new Error('test error'));
    });

    it('"log-verbose" option logs error stacks to the stderr', (done) => {
      const m = new Manager({ errors: { policy: 'log-verbose' } });

      StandIn.replace(console, 'error', (s, message) => {
        s.restore();

        const stack = message.split('\n');

        expect(stack[0]).to.equal('toolbag: Error: test error');
        expect(stack.length).to.be.greaterThan(2);
        done();
      });
      m.error(new Error('test error'));
    });

    it('"throw" option throws the error', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      expect(() => {
        m.error(new Error('test error'));
      }).to.throw(Error, 'test error');
      done();
    });

    it('"terminate" option exits the running process and logs verbose', (done) => {
      const m = new Manager({ errors: { policy: 'terminate' } });
      StandIn.replace(console, 'error', (s, message) => {
        s.restore();

        const stack = message.split('\n');

        expect(stack[0]).to.equal('toolbag: Error: test error');
        expect(stack.length).to.be.greaterThan(2);
      });
      StandIn.replace(process, 'exit', (s, code) => {
        s.restore();
        expect(code).to.equal(1);
        done();
      });
      m.error(new Error('test error'));
    });
  });


  describe('setErrorHandler()', () => {
    it('allows the error handler to be changed', (done) => {
      const m = new Manager({ errors: { policy: 'swallow' } });

      expect(m.error.name).to.equal('noop');
      m.error(new Error());
      m.setErrorHandler('throw');
      expect(() => {
        m.error(new Error('test error'));
      }).to.throw(Error, 'test error');
      done();
    });
  });


  describe('defineErrorHandler()', () => {
    it('allows new error policies to be defined', (done) => {
      const m = new Manager({ errors: { policy: 'throw' } });

      expect(() => {
        m.error(new Error('test error'));
      }).to.throw(Error, 'test error');
      m.defineErrorHandler('foo', (err) => { return err.message; });
      m.setErrorHandler('foo');
      expect(m.error(new Error('bar'))).to.equal('bar');
      done();
    });
  });

  it('throws if the arguments are of the wrong type', (done) => {
    function fail (policy, handler, errorMsg) {
      expect(() => {
        const m = new Manager({ errors: { policy: 'throw' } });

        m.defineErrorHandler(policy, handler);
      }).to.throw(TypeError, errorMsg);
    }

    const noop = () => {};

    fail(undefined, noop, 'policy must be a string');
    fail(null, noop, 'policy must be a string');
    fail(0, noop, 'policy must be a string');
    fail([], noop, 'policy must be a string');
    fail({}, noop, 'policy must be a string');
    fail(true, noop, 'policy must be a string');
    fail('foo', undefined, 'handler must be a function');
    fail('foo', null, 'handler must be a function');
    fail('foo', 0, 'handler must be a function');
    fail('foo', 'bar', 'handler must be a function');
    fail('foo', {}, 'handler must be a function');
    fail('foo', true, 'handler must be a function');
    done();
  });
});
