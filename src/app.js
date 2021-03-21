import { readFile } from 'fs/promises';
import path from 'path';

import ThumbServer from './thumb-server.js';

let brokenBuffer;
let notFoundBuffer;

function isNumeric(num) {
  return num - 0 == num;
}

export default class App {
  constructor(port) {
    // Port is required
    if (!isNumeric(port)) {
      throw new Error('Port number is required and must be a number');
    }

    this.server = new ThumbServer({
      port,
      imageStoragePath: path.join(process.cwd(), 'cache'),
      unhandledRequest: this._unhandledRequest.bind(this),
      requestFailed: this._requestFailed.bind(this)
    });
  }

  async start() {
    try {
      const [ notFoundPngBuffer, brokenPngBuffer ] = await Promise.all([
        readFile(path.join(process.cwd(), 'static', 'not-found.png')),
        readFile(path.join(process.cwd(), 'static', 'broken.png'))
      ]);

      notFoundBuffer = notFoundPngBuffer;
      brokenBuffer = brokenPngBuffer;

      await this.server.start();
      console.log(`Server running on port ${this.server.port}`);
    } catch (err) {
      console.error(err.toString());
      throw err;
    }
  }

  _unhandledRequest(req, res) {
    res.type('png').send(notFoundBuffer);
  }

  _requestFailed(req, res) {
    res.type('png').send(brokenBuffer);
  }

  stop() {
    this.server.stop();
  }
};
