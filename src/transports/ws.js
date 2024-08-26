import { Transport } from './abstract';

export class WsTransport extends Transport {
  constructor(server, req, connection) {
    super(server, req);
    this.connection = connection;
    connection.on('close', () => {
      this.emit('close');
    });
  }

  write(data) {
    this.connection.send(data);
  }

  close() {
    this.connection.terminate();
  }
}
