import http from 'node:http';
import https from 'node:https';
import { WebSocketServer as WsServer } from 'ws';
import { validateConfig } from './config/config';
import { ServerClient } from './server-client';
import { RStream } from './streams/rstream';
import { HttpTransport } from './transports/http';
import { WsTransport } from './transports/ws';

export class Server {
  constructor(app, opts) {
    this.app = app;
    this.logger = app.logger;

    const config = validateConfig(opts);

    const { host, port, auth, transport } = config;
    this.host = host;
    this.port = port;
    this.auth = auth;
    this.transport = transport;

    this.wsServer = null;
    this.server = null;
    this.#prepare();
  }

  #createServer() {
    const serverConstructor = this.transport.type === 'http' ? http.createServer : https.createServer;
    const serverOptions = this.transport.type === 'https' ? { cert: this.transport.cert, key: this.transport.key } : undefined;

    this.server = serverConstructor(serverOptions, async (req, res) => {
      const transport = new HttpTransport(this, req, res);
      const client = new ServerClient(transport);
      const data = new RStream(req);
      this.process(client, await data.readAll());
    });
  }

  #createWsServer() {
    if (this.transport.ws) {
      this.wsServer = new WsServer({ server: this.server });
      this.wsServer.on('connection', (connection, req) => {
        const transport = new WsTransport(this, req, connection);
        const client = new ServerClient(transport);

        connection.on('message', (data, isBinary) => this.process(client, data));
      });
    }
  }

  process(client, data) {
    // Implementation remains the same
  }

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
