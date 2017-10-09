const bluebird = require('bluebird');
const readFileAsync = bluebird.promisify(require('fs').readFile);
const path = require('path');

const ThumbServer = require('./thumb-server');

module.exports = class App {
  constructor(port) {
    this.server = new ThumbServer({
      port,
      imageStoragePath: path.join(__dirname, 'cache'),
      unhandledRequest: res => res.type('png').send(this.notFoundBuffer),
      requestFailed: res => res.type('png').send(this.brokenBuffer)
    });
  }

  start() {
    return Promise.all([
      readFileAsync(path.join(__dirname, '..', 'static', 'not-found.png')),
      readFileAsync(path.join(__dirname, '..', 'static', 'broken.png'))
    ])
      .then(( [ notFoundPngBuffer, brokenPngBuffer ] ) => {
        this.brokenBuffer = brokenPngBuffer;
        this.notFoundBuffer = notFoundPngBuffer;
      })
      .then(() => this.server.start())
      .then(() => {
        console.log(`Server running on port ${this.server.port}`);
      })
      .catch(err => {
        console.error(err);
      });
  }

  stop() {
    this.server.stop();
  }

};