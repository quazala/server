import { EventEmitter } from 'node:events';

export class WStream extends EventEmitter {
  constructor(id, transport) {
    super();
    this.transport = transport;
    this.id = id;
    this.transport.send({ type: 'stream', id });
  }
}
