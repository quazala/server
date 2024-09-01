import { EventEmitter } from 'node:events';

export class RStream extends EventEmitter {
  constructor(req) {
    super();
    this.req = req;
    this.buffer = '';
  }

  async readAll() {
    if (this.req?.readable) {
      for await (const chunk of this.req) {
        this.buffer += chunk.toString();
      }
    }
    return this.buffer;
  }

  async *[Symbol.asyncIterator]() {
    if (this.req?.readable) {
      for await (const chunk of this.req) {
        yield chunk.toString();
      }
    }
  }
}
