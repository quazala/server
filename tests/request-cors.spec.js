import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Server } from '../src/server';

describe('CORS Integration Tests', () => {
  let server;
  let PORT;
  let BASE_URL;

  const mockHandlers = {
    'GET /test': vi.fn((client) => {
      client.send({ message: 'GET request received' });
    }),
    'POST /test': vi.fn((client, data) => {
      client.send({ message: 'POST request received', data });
    }),
  };

  const corsOptions = [
    {
      AllowOrigin: ['http://example.com'],
      AllowMethods: ['GET', 'POST', 'OPTIONS'],
      AllowHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
      ExposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      AllowCredentials: true,
      MaxAge: 86400,
    },
  ];

  beforeAll(async () => {
    PORT = 3000;
    BASE_URL = `http://localhost:${PORT}`;

    const mockApp = {
      logger: vi.fn(),
      handlers: mockHandlers,
    };
    server = new Server(mockApp, {
      port: PORT,
      apiType: 'rest',
      corsOptions: corsOptions,
    });
    await server.start();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 20000);

  afterAll(async () => {
    await server.stop();
  }, 15000);

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://example.com');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  }, 10000);

  it('should include CORS headers in actual requests', async () => {
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'GET',
      headers: {
        Origin: 'http://example.com',
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://example.com');
  }, 10000);

  it('should reject requests from non-allowed origins', async () => {
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'GET',
      headers: {
        Origin: 'http://malicious-site.com',
      },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
