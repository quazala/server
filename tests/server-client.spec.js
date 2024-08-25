// server-client.spec.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerClient } from '../src/server-client';

describe('ServerClient', () => {
  let mockTransport;
  let serverClient;

  beforeEach(() => {
    mockTransport = {
      error: vi.fn(),
      send: vi.fn(),
    };
    serverClient = new ServerClient(mockTransport);
  });

  it('should call transport.error when error method is called', () => {
    const code = 400;
    const options = { message: 'Bad Request' };
    serverClient.error(code, options);
    expect(mockTransport.error).toHaveBeenCalledWith(code, options);
  });

  it('should call transport.send when send method is called', () => {
    const data = { foo: 'bar' };
    const code = 200;
    serverClient.send(data, code);
    expect(mockTransport.send).toHaveBeenCalledWith(data, code);
  });

  it('should have a disconnect method', () => {
    expect(typeof serverClient.disconnect).toBe('function');
  });
});
