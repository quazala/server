// server.spec.js
import * as http from 'node:http';
import * as https from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { Server } from '../src/server'; // Adjust the import path as necessary

// Mock only the necessary dependencies
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
    const server = new Server(mockApp, { port: 3000 });
    expect(server.port).toBe(3000);
    expect(server.host).toBe('localhost');
    expect(server.proto).toBe('http');
    expect(server.transportType).toEqual(['http']);
    expect(server.authStrategy).toBe('none');
  });

  it('should create an HTTP server by default', () => {
    new Server(mockApp, { port: 3000 });
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
  });

  it('should create an HTTPS server when proto is set to https', () => {
    new Server(mockApp, { port: 3000, proto: 'https' });
    expect(https.createServer).toHaveBeenCalled();
    expect(http.createServer).not.toHaveBeenCalled();
  });

  it('should create a WebSocket server when transport includes ws', () => {
    new Server(mockApp, { port: 3000, transport: ['http', 'ws'] });
    expect(WebSocketServer).toHaveBeenCalled();
  });

  it('should not create a WebSocket server when transport only includes http', () => {
    new Server(mockApp, { port: 3000, transport: ['http'] });
    expect(WebSocketServer).not.toHaveBeenCalled();
  });

  it('should start the server and log the listening port', () => {
    const server = new Server(mockApp, { port: 3000 });
    const mockListen = vi.fn();
    const mockOn = vi.fn();
    server.server = { listen: mockListen, on: mockOn };

    server.start();

    expect(mockOn).toHaveBeenCalledWith('listening', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith(3000, 'localhost');
  });

  it('should stop the server and log the closing message', () => {
    const server = new Server(mockApp, { port: 3000 });
    const mockClose = vi.fn((callback) => callback());
    server.server = { close: mockClose };

    server.stop();

    expect(mockClose).toHaveBeenCalled();
    expect(mockApp.logger.log).toHaveBeenCalledWith('Gracefully closing server');
  });

  it('should handle EADDRINUSE error', () => {
    const server = new Server(mockApp, { port: 3000 });
    const mockOn = vi.fn();
    server.server = { on: mockOn, listen: vi.fn() };

    server.start();

    const errorHandler = mockOn.mock.calls.find((call) => call[0] === 'error')[1];
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    errorHandler({ code: 'EADDRINUSE' });

    expect(consoleSpy).toHaveBeenCalledWith('Address in use: localhost:3000');
    consoleSpy.mockRestore();
  });
});
