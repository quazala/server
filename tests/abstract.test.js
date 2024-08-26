import http from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Transport } from '../src/transports/abstract';

vi.mock('../src/utils/getIpFromReq', () => ({
  getIpFromReq: vi.fn(() => '127.0.0.1'),
}));

class MockTransport extends Transport {
  write(data, statusCode, contentType) {
    this.sentData = { data, statusCode, contentType };
  }
}

describe('Transport', () => {
  let server;
  let req;
  let transport;

  beforeEach(() => {
    server = {
      logger: vi.fn(),
    };
    req = { url: '/test', method: 'GET' };
    transport = new MockTransport(server, req);
  });

  it('should initialize properties correctly', () => {
    expect(transport.server).toBe(server);
    expect(transport.req).toBe(req);
    expect(transport.ip).toBe('127.0.0.1');
    expect(transport.logger).toBe(server.logger);
  });

  it('should send data correctly using the send method', () => {
    const data = { success: true };
    const statusCode = 200;

    transport.send(data, statusCode);

    expect(transport.sentData).toEqual({
      data: JSON.stringify(data),
      statusCode,
      contentType: 'json',
    });
  });

  it('should log error and send the error packet correctly using the error method', () => {
    const error = new Error('Test error');
    const code = 500;
    const packetId = '1234';

    http.STATUS_CODES[500] = 'Internal Server Error';

    transport.error(code, { id: packetId, name: 'CustomError', error });

    expect(server.logger).toHaveBeenCalledWith(
      expect.stringContaining('IP: 127.0.0.1 - Method: GET - URL: /test - Reason: Internal Server Error\t500\t'),
    );

    const sentData = JSON.parse(transport.sentData.data);
    expect(sentData).toEqual({
      type: 'callback',
      id: packetId,
      error: {
        name: 'CustomError',
        message: 'Test error',
        code: 500,
        status: 'Internal Server Error',
      },
    });
    expect(transport.sentData.statusCode).toBe(500);
    expect(transport.sentData.contentType).toBe('json');
  });
});
