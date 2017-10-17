const bluebird = require('bluebird');
const readFileAsync = bluebird.promisify(require('fs').readFile);
const path = require('path');

const ThumbServer = require('./thumb-server');

let brokenBuffer;
let notFoundBuffer;

function isNumeric(num) {
  return num - 0 == num;
}

module.exports = class App {
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

  start() {
    return Promise.all([
      readFileAsync(path.join(process.cwd(), 'static', 'not-found.png')),
      readFileAsync(path.join(process.cwd(), 'static', 'broken.png'))
    ])
      .then(( [ notFoundPngBuffer, brokenPngBuffer ] ) => {
        brokenBuffer = brokenPngBuffer;
        notFoundBuffer = notFoundPngBuffer;
      })
      .then(() => this.server.start())
      .then(() => {
        console.log(`Server running on port ${this.server.port}`);
      })
      .catch(err => {
        console.error(err.toString());
        throw err;
      });
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