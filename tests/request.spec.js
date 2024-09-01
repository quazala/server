import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { Server } from '../src/server';

describe('Server Integration Tests', () => {
  let httpServer;
  let wsServer;
  let HTTP_PORT;
  let WS_PORT;
  let HTTP_BASE_URL;
  let WS_BASE_URL;

  const mockHandlers = {
    'GET /test': vi.fn((client) => {
      client.send({ message: 'GET request received' });
    }),
    'POST /test': vi.fn((client, data) => {
      client.send({ message: 'POST request received', data });
    }),
    'test-event': vi.fn((client, data) => {
      client.send({ message: 'Event received', data });
    }),
  };

  beforeAll(async () => {
    HTTP_PORT = 3000;
    WS_PORT = 3001;
    HTTP_BASE_URL = `http://localhost:${HTTP_PORT}`;
    WS_BASE_URL = `ws://localhost:${WS_PORT}`;

    const mockApp = {
      logger: vi.fn(),
      handlers: mockHandlers,
    };

    httpServer = new Server(mockApp, {
      port: HTTP_PORT,
      apiType: 'rest',
      corsOptions: [
        {
          AllowOrigin: ['*'],
          AllowMethods: ['GET', 'POST', 'OPTIONS'],
          AllowHeaders: ['Content-Type'],
          ExposeHeaders: [],
          AllowCredentials: false,
          MaxAge: 3600,
        },
      ],
    });

    wsServer = new Server(mockApp, {
      port: WS_PORT,
      apiType: 'events',
      transport: ['ws'],
    });

    await httpServer.start();
    await wsServer.start();
  }, 10000);

  afterAll(async () => {
    if (httpServer) {
      await httpServer.stop();
    }
    if (wsServer) {
      await wsServer.stop();
    }
  }, 10000);

  it('should respond to a GET request', async () => {
    const response = await fetch(`${HTTP_BASE_URL}/test`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ message: 'GET request received' });
  }, 5000);

  it('should handle a POST request with JSON data', async () => {
    const response = await fetch(`${HTTP_BASE_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ message: 'POST request received', data: { test: 'data' } });
  }, 5000);

  it('should handle WebSocket connections', () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_BASE_URL);
      ws.on('open', () => {
        ws.send(JSON.stringify({ event: 'test-event', data: { test: 'data' } }));
      });
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          expect(message).toEqual({
            message: 'Event received',
            data: {
              event: 'test-event',
              data: { test: 'data' },
            },
          });
          ws.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      ws.on('error', reject);
    });
  }, 5000);

  it('should start the server and log the listening port', async () => {
    const mockLogger = vi.fn();
    const mockApp = { logger: mockLogger };
    const testPort = 3002;
    const server = new Server(mockApp, { port: testPort });

    await server.start();

    expect(mockLogger).toHaveBeenCalledWith(`Listen port ${testPort}`);
    await server.stop();
  });

  it('should handle EADDRINUSE error', async () => {
    const mockLogger = vi.fn();
    const mockApp = { logger: mockLogger };
    const testPort = 3000;
    const server = new Server(mockApp, { port: testPort });

    // Simulate the EADDRINUSE error
    server.server.listen = vi.fn((port, host, callback) => {
      const error = new Error('EADDRINUSE');
      error.code = 'EADDRINUSE';
      server.server.emit('error', error);
    });

    await expect(server.start()).rejects.toThrow('EADDRINUSE');
    expect(mockLogger).toHaveBeenCalledWith(`Address in use: localhost:${testPort}`);
  });
});
