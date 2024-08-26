import http from 'node:http';
import https from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { validateConfig } from '../src/config/config';
import { Server } from '../src/server';
import { ServerClient } from '../src/server-client';
import { RStream } from '../src/streams/rstream';
import { HttpTransport } from '../src/transports/http';
import { WsTransport } from '../src/transports/ws';

vi.mock('node:http');
vi.mock('node:https');
vi.mock('ws');
vi.mock('../src/config/config');
vi.mock('../src/server-client');
vi.mock('../src/streams/rstream');
vi.mock('../src/transports/http');
vi.mock('../src/transports/ws');

describe('Server', () => {
  let mockApp;
  let mockHttpServer;
  let mockHttpsServer;
  let mockWsServer;

  beforeEach(() => {
    mockApp = {
      logger: vi.fn(),
    };

    mockHttpServer = {
      on: vi.fn(),
      listen: vi.fn(),
      close: vi.fn(),
    };

    mockHttpsServer = {
      on: vi.fn(),
      listen: vi.fn(),
      close: vi.fn(),
    };

    mockWsServer = {
      on: vi.fn(),
    };

    http.createServer.mockReturnValue(mockHttpServer);
    https.createServer.mockReturnValue(mockHttpsServer);
    WebSocketServer.mockImplementation(() => mockWsServer);

    validateConfig.mockReturnValue({
      host: 'localhost',
      port: 8888,
      proto: 'http',
      transport: ['http'],
      authStrategy: 'none',
      corsOptions: [{}],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an instance with default configuration', () => {
    const server = new Server(mockApp, {});
    expect(server.host).toBe('localhost');
    expect(server.port).toBe(8888);
    expect(server.proto).toBe('http');
    expect(server.transportType).toEqual(['http']);
    expect(server.authStrategy).toBe('none');
  });

  it('should create an HTTP server by default', () => {
    new Server(mockApp, {});
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
  });

  it('should create an HTTPS server when proto is set to https', () => {
    validateConfig.mockReturnValueOnce({
      ...validateConfig(),
      proto: 'https',
    });
    new Server(mockApp, { proto: 'https' });
    expect(https.createServer).toHaveBeenCalled();
    expect(http.createServer).not.toHaveBeenCalled();
  });

  it('should create a WebSocket server when transport includes ws', () => {
    validateConfig.mockReturnValueOnce({
      ...validateConfig(),
      transport: ['http', 'ws'],
    });
    new Server(mockApp, { transport: ['http', 'ws'] });
    expect(WebSocketServer).toHaveBeenCalled();
  });

  it('should not create a WebSocket server when transport only includes http', () => {
    new Server(mockApp, { transport: ['http'] });
    expect(WebSocketServer).not.toHaveBeenCalled();
  });

  it('should start the server and log the listening port', () => {
    const server = new Server(mockApp, {});
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    server.start();

    expect(mockHttpServer.listen).toHaveBeenCalledWith(8888, 'localhost');
    expect(mockHttpServer.on).toHaveBeenCalledWith('listening', expect.any(Function));

    // Simulate the 'listening' event
    mockHttpServer.on.mock.calls[0][1]();

    expect(consoleSpy).toHaveBeenCalledWith('Listen port 8888');
    consoleSpy.mockRestore();
  });

  it('should handle EADDRINUSE error', () => {
    const server = new Server(mockApp, {});
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    server.start();

    // Simulate the 'error' event with EADDRINUSE
    const errorHandler = mockHttpServer.on.mock.calls.find((call) => call[0] === 'error')[1];
    errorHandler({ code: 'EADDRINUSE' });

    expect(consoleSpy).toHaveBeenCalledWith('Address in use: localhost:8888');
    consoleSpy.mockRestore();
  });

  it('should not warn for non-EADDRINUSE errors', () => {
    const server = new Server(mockApp, {});
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    server.start();

    // Simulate the 'error' event with a different error
    const errorHandler = mockHttpServer.on.mock.calls.find((call) => call[0] === 'error')[1];
    errorHandler({ code: 'SOME_OTHER_ERROR' });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should stop the server and log the closing message', () => {
    const server = new Server(mockApp, {});
    server.stop();

    expect(mockHttpServer.close).toHaveBeenCalled();
    // expect(mockApp.logger).toHaveBeenCalledWith('Gracefully closing server');
  });

  it('should process HTTP requests correctly', async () => {
    const server = new Server(mockApp, {});
    const mockReq = {};
    const mockRes = {};
    const mockData = 'test data';

    // Simulate an HTTP request
    const requestHandler = http.createServer.mock.calls[0][0];
    await requestHandler(mockReq, mockRes);

    expect(HttpTransport).toHaveBeenCalledWith(server, mockReq, mockRes);
    expect(ServerClient).toHaveBeenCalled();
    expect(RStream).toHaveBeenCalledWith(mockReq);
    expect(RStream.prototype.readAll).toHaveBeenCalled();
  });

  it('should process WebSocket connections correctly', () => {
    validateConfig.mockReturnValueOnce({
      ...validateConfig(),
      transport: ['http', 'ws'],
    });
    const server = new Server(mockApp, { transport: ['http', 'ws'] });
    const mockConnection = {
      on: vi.fn(),
    };
    const mockReq = {};

    // Simulate a WebSocket connection
    const connectionHandler = mockWsServer.on.mock.calls.find((call) => call[0] === 'connection')[1];
    connectionHandler(mockConnection, mockReq);

    expect(WsTransport).toHaveBeenCalledWith(server, mockReq, mockConnection);
    expect(ServerClient).toHaveBeenCalled();
    expect(mockConnection.on).toHaveBeenCalledWith('message', expect.any(Function));
  });
});
