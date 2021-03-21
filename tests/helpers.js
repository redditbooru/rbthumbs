import { identify } from 'imagemagick';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const __dirname = dirname(fileURLToPath(import.meta.url));

export function identifyAsync(path) {
  return new Promise((resolve, reject) => {
    identify(path, (err, features) => {
      if (err) {
        reject(err);
      } else {
        resolve(features);
      }
    })
  });
}
