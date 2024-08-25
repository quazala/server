import { Transport } from './abstract';

const HEADERS = {};

export class HttpTransport extends Transport {
  /* TESTS - TBD */
  constructor(server, req, res) {
    super(server, req);
    this.res = res;
    req.on('close', () => {
      this.emit('close');
    });
  }

  write(data, httpCode = 200, ext = 'json', options = {}) {
    // ...
  }

  getSession() {
    /* TBD */
  }

  setSession() {
    /* TBD */
  }

  close() {
    this.error(503);
    this.req.connection.destroy();
  }

  redirect() {
    const { res } = this;
    if (res.headersSent) return;
    res.writeHead(302, { Location: location, ...HEADERS });
    res.end();
  }
}
