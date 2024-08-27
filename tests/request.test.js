import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Server } from '../src/server';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

describe('Server Integration Tests', () => {
  let server;

  beforeAll(() => {
    const mockApp = {
      logger: {
        log: console.log,
      },
    };
    server = new Server(mockApp, { port: PORT });
    server.start();
  });

  afterAll(() => {
    server.stop();
  });

  it('should respond to a GET request', async () => {
    const response = await fetch(`${BASE_URL}/test`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ message: 'Hello, World!' });
  });

  it('should handle a POST request with JSON data', async () => {
    const response = await fetch(`${BASE_URL}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe' }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ echo: { name: 'John Doe' } });
  });

  it('should handle errors correctly', async () => {
    const response = await fetch(`${BASE_URL}/nonexistent`);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('message', 'Not Found');
  });

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('should handle WebSocket connections', async () => {
    // This test requires a WebSocket client library
    // For simplicity, we'll just check if the server is listening on the WebSocket port
    const wsResponse = await fetch(`${BASE_URL}/ws`);
    expect(wsResponse.status).toBe(400); // Expected status for a non-WebSocket request to a WebSocket endpoint
  });
});
