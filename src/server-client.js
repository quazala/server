export class ServerClient {
  #transport;

  constructor(transport) {
    this.#transport = transport;
  }

  error(code, options) {
    this.#transport.error(code, options);
  }

  send(data, code) {
    this.#transport.send(data, code);
  }

  disconnect() {}
}
