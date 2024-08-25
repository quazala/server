import http from 'node:http';
import https from 'node:https';
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
    const server = new Server(mockApp, { port: 3000 });
    expect(server.port).toBe(3000);
    expect(server.host).toBe('localhost');
    expect(server.proto).toBe('http');
    expect(server.transportType).toEqual(['http']);
  });

  it('should throw an error if port is not provided', () => {
    expect(() => new Server(mockApp, {})).toThrow('Port has to be provided.');
  });

  it('should create an HTTP server by default', () => {
    const server = new Server(mockApp, { port: 3000 });
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).not.toHaveBeenCalled();
  });

  it('should create an HTTPS server when proto is set to https', () => {
    const server = new Server(mockApp, { port: 3000, proto: 'https' });
    expect(https.createServer).toHaveBeenCalled();
    expect(http.createServer).not.toHaveBeenCalled();
  });

  it('should create a WebSocket server when transport includes ws', () => {
    const server = new Server(mockApp, { port: 3000, transport: ['http', 'ws'] });
    expect(WebSocketServer).toHaveBeenCalled();
  });

  it('should not create a WebSocket server when transport only includes http', () => {
    const server = new Server(mockApp, { port: 3000, transport: ['http'] });
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
});
