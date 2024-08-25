import * as http from 'node:http';
import * as https from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { Server } from '../src/server'; // Adjust the import path as necessary

// Mock dependencies
vi.mock('node:http');
vi.mock('node:https');
vi.mock('ws');

describe('Server', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      logger: {
        log: vi.fn(),
      },
    };
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create an instance with default values', () => {
    const server = new Server(mockApp, { transport: { type: 'http' } });
    expect(server.port).toBe(8888);
    expect(server.host).toBe('localhost');
    expect(server.transport).toEqual({ type: 'http' });
    expect(server.auth).toBeUndefined();
  });

  it('should create an HTTP server by default', () => {
    new Server(mockApp, { transport: { type: 'http' } });
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
  });

  it('should create an HTTPS server when transport type is https', () => {
    new Server(mockApp, { transport: { type: 'https', cert: 'cert.pem', key: 'key.pem' } });
    expect(https.createServer).toHaveBeenCalledWith({ cert: 'cert.pem', key: 'key.pem' }, expect.any(Function));
    expect(http.createServer).not.toHaveBeenCalled();
  });

  it('should create a WebSocket server when transport.ws is true', () => {
    new Server(mockApp, { transport: { type: 'http', ws: true } });
    expect(WebSocketServer).toHaveBeenCalled();
  });

  it('should not create a WebSocket server when transport.ws is false', () => {
    new Server(mockApp, { transport: { type: 'http', ws: false } });
    expect(WebSocketServer).not.toHaveBeenCalled();
  });

  it('should start the server and log the listening port', () => {
    const server = new Server(mockApp, { transport: { type: 'http' } });
    const mockListen = vi.fn();
    const mockOn = vi.fn();
    server.server = { listen: mockListen, on: mockOn };

    server.start();

    expect(mockOn).toHaveBeenCalledWith('listening', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith(8888, 'localhost');
  });

  it('should stop the server and log the closing message', () => {
    const server = new Server(mockApp, { transport: { type: 'http' } });
    const mockClose = vi.fn((callback) => callback());
    server.server = { close: mockClose };

    server.stop();

    expect(mockClose).toHaveBeenCalled();
    expect(mockApp.logger.log).toHaveBeenCalledWith('Gracefully closing server');
  });

  it('should handle EADDRINUSE error', () => {
    const server = new Server(mockApp, { transport: { type: 'http' } });
    const mockOn = vi.fn();
    server.server = { on: mockOn, listen: vi.fn() };

    server.start();

    const errorHandler = mockOn.mock.calls.find((call) => call[0] === 'error')[1];
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    errorHandler({ code: 'EADDRINUSE' });

    expect(consoleSpy).toHaveBeenCalledWith('Address in use: localhost:8888');
    consoleSpy.mockRestore();
  });
});
