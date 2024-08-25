import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WsTransport } from '../src/transports/ws';

describe('WsTransport', () => {
  let server;
  let req;
  let connection;
  let wsTransport;

  beforeEach(() => {
    server = {}; // Mock server object
    req = {}; // Mock request object
    connection = {
      on: vi.fn(),
      send: vi.fn(),
      terminate: vi.fn(),
    };
    wsTransport = new WsTransport(server, req, connection);
  });

  it('should initialize and set up the close event listener', () => {
    expect(wsTransport.server).toBe(server);
    expect(wsTransport.req).toBe(req);
    expect(wsTransport.connection).toBe(connection);
    expect(connection.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('should emit "close" event when the connection is closed', () => {
    const closeCallback = connection.on.mock.calls[0][1]; // Retrieve the callback passed to `connection.on`
    const emitSpy = vi.spyOn(wsTransport, 'emit');

    closeCallback(); // Simulate the connection closing

    expect(emitSpy).toHaveBeenCalledWith('close');
  });

  it('should send data using the write method', () => {
    const data = JSON.stringify({ message: 'test' });

    wsTransport.write(data);

    expect(connection.send).toHaveBeenCalledWith(data);
  });

  it('should terminate the connection when close method is called', () => {
    wsTransport.close();

    expect(connection.terminate).toHaveBeenCalled();
  });
});
