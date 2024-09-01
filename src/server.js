import http from 'node:http';
import https from 'node:https';
import { WebSocketServer as WsServer } from 'ws';
import { validateConfig } from './config/config.js';
import { ServerClient } from './server-client.js';
import { RStream } from './streams/rstream';
import { HttpTransport } from './transports/http';
import { WsTransport } from './transports/ws';

export class Server {
  constructor(app, opts) {
    const config = validateConfig(opts);
    const { host, port, authStrategy, proto, transport, corsOptions } = config;
    this.apiType = config.apiType;
    this.app = app;
    this.logger = typeof app.logger === 'function' ? app.logger : console.log;
    this.host = host;
    this.proto = proto;
    this.transportType = transport;
    this.authStrategy = authStrategy;
    this.port = port;
    this.corsOptions = corsOptions; // Store the raw CORS options
    this.wsServer = null;
    this.server = null;

    this.handlers = app.handlers;

    this.#prepare();
  }

  #createServer() {
    const serverConstructor = this.proto === 'http' ? http.createServer : https.createServer;

    this.server = serverConstructor(async (req, res) => {
      const transport = new HttpTransport(this, req, res);
      const client = new ServerClient(transport);

      if (transport.handleCors()) {
        return;
      }

      const data = new RStream(req);
      await this.process(client, await data.readAll(), req);
    });
  }
  #createWsServer() {
    if (this.transportType.includes('ws')) {
      this.wsServer = new WsServer({ server: this.server });
      this.wsServer.on('connection', (connection, req) => {
        const transport = new WsTransport(this, req, connection);
        const client = new ServerClient(transport);

        connection.on('message', (data) => this.process(client, data.toString(), req));
      });
    }
  }

  #event(client, packet) {
    const { event } = packet;
    const handler = this.handlers[event];
    if (handler) {
      handler(client, packet);
    } else {
      client.error(404, { message: 'Event not found' });
    }
  }

  #rest(client, packet, req) {
    const route = `${req.method} ${req.url}`;
    const handler = this.handlers[route];
    if (handler) {
      handler(client, packet);
    } else {
      client.error(404, { message: 'Route not found' });
    }
  }

  #rpc(client, packet) {
    const { method } = packet;
    const handler = this.handlers[method];
    if (handler) {
      handler(client, packet);
    } else {
      client.error(404, { message: 'Method not found' });
    }
  }

  async process(client, data, req) {
    let packet;
    try {
      packet = JSON.parse(data);
    } catch (error) {
      // For GET requests, we don't expect JSON data
      if (req.method === 'GET') {
        packet = {};
      } else {
        return client.error(400, { message: 'Invalid JSON' });
      }
    }

    if (this.apiType === 'events') {
      return this.#event(client, packet);
    }
    if (this.apiType === 'rest') {
      return this.#rest(client, packet, req);
    }
    if (this.apiType === 'rpc') {
      return this.#rpc(client, packet);
    }

    client.error(400, { message: 'Invalid API type' });
  }

  #prepare() {
    this.#createServer();
    this.#createWsServer();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.on('listening', () => {
        this.logger(`Listen port ${this.port}`);
        resolve();
      });
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          this.logger(`Address in use: ${this.host}:${this.port}`);
        } else {
          this.logger(`Server error: ${err.message}`);
        }
        // Reject the promise if there's an error
        reject(err);
      });

      this.server.listen(this.port, this.host);
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close();
      }
      if (this.server) {
        this.server.close(() => {
          this.logger('Gracefully closing server');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
