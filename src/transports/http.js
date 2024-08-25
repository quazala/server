import { Readable } from 'node:stream';
import mime from 'mime';
import { Transport } from './abstract';

export class HttpTransport extends Transport {
  constructor(server, req, res) {
    super(server, req);
    this.res = res;
    req.on('close', () => {
      this.emit('close');
    });
  }

  write(data, httpCode = 200, ext = 'json', options = {}) {
    const { res, corsOptions } = this;
    if (res.writableEnded) {
      return;
    }
    const streaming = data instanceof Readable;
    let mimeType = mime.getType('html');
    if (httpCode === 200) {
      const fileType = mime.getType(ext);
      if (fileType) mimeType = fileType;
    }
    const headers = { ...corsOptions, 'Content-Type': mimeType };
    if (httpCode === 206) {
      const { start, end, size = '*' } = options;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = end - start + 1;
    }
    if (streaming) {
      res.writeHead(httpCode, headers);
      return void data.pipe(res);
    }
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    headers['Content-Length'] = buf.length;
    res.writeHead(httpCode, headers);
    res.end(data);
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
    res.writeHead(302, { Location: location, ...DEFAULT_HEADERS });
    res.end();
  }
}
