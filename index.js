const bluebird = require('bluebird');
const program = require('commander');
const readFileAsync = bluebird.promisify(require('fs').readFile);
const path = require('path');

const ThumbServer = require('./src/thumb-server');

program
  .version(require('./package').version)
  .option('-p, --port <n>', 'Port', parseInt)
  .parse(process.argv);

const port = program.port || 4000;

const server = new ThumbServer({
  port,
  imageStoragePath: path.join(__dirname, 'cache'),
  unhandledRequest: res => res.type('png').send(notFoundBuffer),
  requestFailed: res => res.type('png').send(brokenBuffer)
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
  })
  .catch(err => {
    console.error(err);
  });