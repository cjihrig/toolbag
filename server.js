'use strict';
const Hapi = require('hapi');
const Nes = require('nes');
const Uuid = require('node-uuid');
const server = new Hapi.Server();

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
      handler: function (request, reply) {
        const id = Uuid.v4();
        const commandSubscription = `/client/${id}/command`;
        const reportRoute = {
          method: 'POST',
          path: `/client/${id}/report`
        };
        const data = {
          id,
          subscribe: commandSubscription,
          reporting: reportRoute
        };

        request.socket.app = {
          id,
          commands: commandSubscription
        };

        reply(data);
      }
    },
    {
      method: 'POST',
      path: '/client/{clientId}/report',
      handler: function (request, reply) {
        // TODO: Process client data in request.payload
        reply();
      }
    },
    {
      // Proof of concept route
      method: 'GET',
      path: '/heapdump/{name}',
      handler: function (request, reply) {
        // Take a heap dump on each client
        server.eachSocket(function each (socket) {
          server.publish(socket.app.commands, {
            command: 'take-heapdump',
            data: {
              name: request.params.name
            }
          });
        });

        reply();
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
