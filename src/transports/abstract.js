import { EventEmitter } from 'node:events';
import http from 'node:http';
import { getIpFromReq } from '../utils/getIpFromReq';

export class Transport extends EventEmitter {
  constructor(server, req) {
    super();
    this.server = server;
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
    const { console } = server;
    const { url, method } = req;
    const status = http.STATUS_CODES[preparedCode];
    const message = error ? error.message : status || 'Unknown error';
    const reason = `${status}\t${preparedCode}\t${error ? error.stack : 'Unknown stack'}`;
    console.error(`IP: ${ip} - Method: ${method} - URL: ${url} - Reason: ${reason}`);
    const packet = { type: 'callback', id, error: { name, message, code: preparedCode, status } };
    this.send(packet, preparedCode);
  }
}
