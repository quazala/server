import http from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Transport } from '../src/transports/abstract';
import { getIpFromReq } from '../src/utils/getIpFromReq';

class MockTransport extends Transport {
  write(data, statusCode, contentType) {
    // Mock implementation for testing purposes
    this.sentData = { data, statusCode, contentType };
  }
}

describe('Transport', () => {
  let server;
  let req;
  let transport;

  beforeEach(() => {
    server = { console: { error: vi.fn() } };
    req = { url: '/test', method: 'GET' };
    transport = new MockTransport(server, req);
  });

  it('should initialize properties correctly', () => {
    expect(transport.server).toBe(server);
    expect(transport.req).toBe(req);
    expect(transport.ip).toBe(getIpFromReq(req)); // Ensures getIpFromReq is used correctly
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

    expect(server.console.error).toHaveBeenCalledWith(
      `IP: ${transport.ip} - Method: GET - URL: /test - Reason: Internal Server Error\t500\t${error.stack}`,
    );

    expect(transport.sentData).toEqual({
      data: JSON.stringify({
        type: 'callback',
        id: packetId,
        error: {
          name: 'CustomError',
          message: 'Test error',
          code: 500,
          status: 'Internal Server Error',
        },
      }),
      statusCode: 500,
      contentType: 'json',
    });
  });

  it('should handle undefined error in error method gracefully', () => {
    transport.error(undefined, { id: '1234', name: 'UnknownError' });

    expect(server.console.error).toHaveBeenCalled();
    expect(transport.sentData).toEqual({
      data: JSON.stringify({
        type: 'callback',
        id: '1234',
        error: {
          name: 'UnknownError',
          message: 'Unknown error',
          code: 520,
          status: undefined,
        },
      }),
      statusCode: 520,
      contentType: 'json',
    });
  });
});
