import http from 'node:http';
import https from 'node:https';
import { WebSocketServer as WsServer } from 'ws';
import { validateConfig } from './config/config.js';
import { ServerClient } from './server-client.js';
import { RStream } from './streams/rstream';
import { HttpTransport } from './transports/http';
import { WsTransport } from './transports/ws';
import { headifyCorsOptions } from './utils/headifyCorsOptions.js';

export class Server {
  constructor(app, opts) {
    const config = validateConfig(opts);
    const { host, port, authStrategy, proto, transport, corsOptions } = config;

    this.app = app;
    this.logger = app.logger;
    this.host = host;
    this.proto = proto;
    this.transportType = transport;
    this.authStrategy = authStrategy;
    this.port = port;
    this.corsOptions = headifyCorsOptions(corsOptions);
    this.wsServer = null;
    this.server = null;

    this.#prepare();
  }

  #createServer() {
    const serverConstructor = this.proto === 'http' ? http.createServer : https.createServer;

    this.server = serverConstructor(async (req, res) => {
      const transport = new HttpTransport(this, req, res);
      const client = new ServerClient(transport);
      const data = new RStream(req);
      this.process(client, await data.readAll());
    });
  }

  #createWsServer() {
    if (this.transportType.includes('ws')) {
      this.wsServer = new WsServer({ server: this.httpServer });
      this.wsServer.on('connection', (connection, req) => {
        const transport = new WsTransport(this, req, connection);
        const client = new ServerClient(transport);

        connection.on('message', (data, isBinary) => this.process(client, data));
      });
    }
  }

  process(client, data) {}

  #prepare() {
    this.#createServer();
    this.#createWsServer();
  }

  start() {
    this.server.on('listening', () => {
      console.info(`Listen port ${this.port}`);
    });
    const server = this.wsServer || this.server;
    server.on('error', (err) => {
      if (err.code !== 'EADDRINUSE') return;
      console.warn(`Address in use: ${this.host}:${this.port}`);
    });

    this.server.listen(this.port, this.host);
  }

  stop() {
    this.server.close(() => {
      this.logger.log('Gracefully closing server');
    });
  }
}
