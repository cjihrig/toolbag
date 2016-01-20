'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Nes = require('nes');
const Uuid = require('node-uuid');

let registered = {};

const server = new Hapi.Server({ debug: { request: ['error', 'response', 'received'] } });
server.connection({ port: 5000 });
server.register({
  register: Nes,
  options: { auth: false }
}, function (err) {
  if (err) {
    throw err;
  }

  // auth succeeds, we just need credentials object with client Id for the filter later
  server.auth.scheme('custom', function (server, options) {
    return {
      authenticate: function (request, reply) {
        request.socket.clientId = request.socket.clientId || Uuid.v4();
        reply.continue({ credentials: { clientId: request.socket.clientId } });
      }
    };
  });
  server.auth.strategy('default', 'custom');
  server.auth.default('default');

  server.route([
    {
      method: 'POST',
      path: '/register',
      config: {
        id: 'register',
        validate: {
          payload: {
            info: Joi.object().description('information about process'),
            commands: Joi.array().description('commands the toolbox can perform')
          }
        },
        handler: function (request, reply) {
          registered[request.auth.credentials.clientId] = {
            info: request.payload.info,
            commands: request.payload.commands
          };

          reply({ clientId: request.socket.clientId });
        }
      }
    },
    {
      method: 'POST',
      path: '/report',
      config: {
        id: 'report',
        handler: function (request, reply) {
          // TODO: Process client data in request.payload
          if (request.payload.type !== 'stats') {
            console.log(request.payload);
          }

          reply();
        }
      }
    },
    {
      // Proof of concept route
      method: 'GET',
      path: '/heapdump/{name}',
      handler: function (request, reply) {
        // Take a heap dump on each client
        server.eachSocket(function each (socket) {
          server.publish(socket.app.command, {
            type: 'heapdump-create',
            payload: {
              name: request.params.name
            }
          });
        });

        reply();
      }
    },
    {
      // Proof of concept route
      method: 'GET',
      path: '/signal/{name}',
      handler: function (request, reply) {
        // Send a signal to each client
        server.eachSocket(function each (socket) {
          server.publish(socket.app.command, {
            type: 'signal-kill',
            payload: {
              signal: request.params.name
            }
          });
        });

        reply();
      }
    }
  ]);

  server.subscription('/command');
  server.start(function (err) {
    if (err) {
      console.error(`Server failed to start - ${err.message}`);
      process.exit(1);
    }

    console.log(`Server started at ${server.info.uri}`);
  });
});
