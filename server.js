'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Nes = require('nes');
const Uuid = require('node-uuid');


const registered = {};

const server = new Hapi.Server({
  debug: { request: ['error' /*, 'response', 'received'*/] }
});

server.connection({ port: 5000 });
server.register(Nes, function (err) {
  if (err) {
    throw err;
  }

  // auth succeeds, we just need credentials object with client Id for the filter later
  server.auth.scheme('custom', function (server, options) {
    return {
      authenticate: function (request, reply) {
        request.connection.clientId = request.connection.clientId || Uuid.v4();
        reply.continue({ credentials: { clientId: request.connection.clientId } });
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

          reply({ clientId: request.connection.clientId });
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
      method: 'GET',
      path: '/clients',
      config: {
        id: 'clients',
        auth: false,
        handler: function (request, reply) {
          reply(registered);
        }
      }
    },
    {
      method: 'POST',
      path: '/command',
      config: {
        id: 'command',
        auth: false,
        validate: {
          payload: {
            command: Joi.string().required().description('command to send to clients'),
            options: Joi.object().optional().description('any command arguments'),
            clientIds: Joi.array().optional().description('list of clientIds to command')
          }
        },
        handler: function (request, reply) {
          request.server.publish('/command', request.payload);
          return reply();
        }
      }
    }
  ]);

  server.subscription('/command', {
    filter: function (path, message, options, next) {
      // match all sockets if no clientIds specified
      if (!message.clientIds || !message.clientIds.length) {
        return next(true);
      }

      return next(message.clientIds.indexOf(options.credentials.clientId) !== -1);
    }
  });
  server.start(function (err) {
    if (err) {
      console.error(`Server failed to start - ${err.message}`);
      process.exit(1);
    }

    console.log(`Server started at ${server.info.uri}`);
  });
});
