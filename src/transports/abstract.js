import { EventEmitter } from 'node:events';
import http from 'node:http';
import { getIpFromReq } from '../utils/getIpFromReq';

export class Transport extends EventEmitter {
  constructor(server, req) {
    super();
    this.server = server;
    this.logger = server.logger || console.log;
    this.req = req;
    this.ip = getIpFromReq(req);
  }

  send(data, statusCode = 200) {
    const preparedData = JSON.stringify(data);
    this.write(preparedData, statusCode, 'json');
  }

  error(code, { id, name = 'Error', error = null }) {
    const preparedCode = code || 520;
    const { server, req, ip } = this;
    const { url, method } = req;
    const status = http.STATUS_CODES[preparedCode];
    const message = error ? error.message : status || 'Unknown error';
    const reason = `${status}\t${preparedCode}\t${error ? error.stack : 'Unknown stack'}`;
    this.logger(`IP: ${ip} - Method: ${method} - URL: ${url} - Reason: ${reason}`);
    const packet = {
      type: 'callback',
      id,
      error: {
        name,
        message,
        code: preparedCode,
        status: status || undefined, // Ensure status is always included
      },
    };
    this.send(packet, preparedCode);
  }
}
