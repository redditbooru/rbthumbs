import { readFile } from 'fs/promises';
import cluster from 'cluster';
import program from 'commander';
import os from 'os';

import App from './src/app.js';

const pjson = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));
const DEFAULT_PORT = 4000;

program
  .version(pjson.version)
  .option('-p, --port <n>', 'Port', parseInt)
  .parse(process.argv);

if (cluster.isMaster) {
  // Spin up two processes per CPU
  const processCount = os.cpus().length * 2;

  console.log(`Master process spinning up ${processCount} children`);

  for (let i = 0; i < processCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Process ${worker.pid} died`);
  });
} else {
  const app = new App(program.port || DEFAULT_PORT);
  app.start().then(() => {
    console.log(`Process ${process.pid} is running`);
  });
}
