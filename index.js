const bluebird = require('bluebird');
const readFileAsync = bluebird.promisify(require('fs').readFile);
const path = require('path');

const ThumbServer = require('./src/thumb-server');

const server = new ThumbServer({
  port: 4000,
  unhandledRequest: res => res.type('png').send(notFoundBuffer),
  requestFailed: res => res.type('png').send(brokenBuffer),
  imageStoragePath: path.join(__dirname, 'cache')
});

let brokenBuffer;
let notFoundBuffer;

Promise.all([
  readFileAsync(path.join(__dirname, 'static', 'not-found.png')),
  readFileAsync(path.join(__dirname, 'static', 'broken.png'))
])
  .then(( [ notFoundPngBuffer, brokenPngBuffer ] ) => {
    brokenBuffer = brokenPngBuffer;
    notFoundBuffer = notFoundPngBuffer;
  })
  .then(() => server.start())
  .then(() => {
    console.log(`Server running on port ${server.port}`);
  });