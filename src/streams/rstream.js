import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

export class RStream extends EventEmitter {
  constructor(transport) {
    super();
    this.stream = Readable.from(transport.request);
    this.buffer = '';
  }

  async readAll() {
    for await (const chunk of this.stream) {
      this.buffer += chunk.toString();
    }
    return this.buffer;
  }

  async *[Symbol.asyncIterator]() {
    for await (const chunk of this.stream) {
      yield chunk.toString();
    }
  }
}
