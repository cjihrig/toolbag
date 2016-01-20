'use strict';
const Hapi = require('hapi');
const Nes = require('nes');
const Uuid = require('node-uuid');

const server = new Hapi.Server({
  debug: { request: ['error' /*, 'response', 'received'*/] }
});

server.connection({ port: 5000 });
server.register({
  register: Nes,
  options: { auth: false }
}, function (err) {
  if (err) {
    throw err;
  }

  server.route([
    {
      method: 'POST',
      path: '/client/register',
      config: {
        id: 'register',
        handler: function (request, reply) {
          const id = Uuid.v4();
          const data = {
            id,
            report: 'report',
            command: `/client/${id}/command`
          };

          request.socket.app = data;
          reply(data);
        }
      }
    },
    {
      method: 'POST',
      path: '/client/{clientId}/report',
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
    },
    {
      // Proof of concept route
      method: 'GET',
      path: '/report',
      handler: function (request, reply) {
        function onMessage (msg) {
          const obj = JSON.parse(msg);

          reply(obj.payload);
        }

        server.eachSocket(function each (socket) {
          socket._ws.once('message', onMessage);
          server.publish(socket.app.command, {
            type: 'reporter-get-report'
          });
        });
      }
    }
  ]);

  server.subscription('/client/{clientId}/command');
  server.start(function (err) {
    if (err) {
      console.error(`Server failed to start - ${err.message}`);
      process.exit(1);
    }

    console.log(`Server started at ${server.info.uri}`);
  });
});
