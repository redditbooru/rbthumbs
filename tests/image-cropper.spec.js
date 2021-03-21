import expect from 'expect.js';
import { readFile } from 'fs/promises';
import path from 'path';

import { __dirname, identifyAsync } from './helpers.js';
import crop from '../src/image-cropper.js';

describe('image-cropper', () => {
  it('should crop the provided image buffer', () => {
    const WIDTH = 300;
    const HEIGHT = 300;
    return readFile(path.join(__dirname, 'images', 'taiga.jpg'))
      .then(buffer => crop(buffer, WIDTH, HEIGHT))
      .then(thumbBuffer => identifyAsync({ data: thumbBuffer }))
      .then(results => {
        expect(results.format).to.be('JPEG');
        expect(results.width).to.be(WIDTH);
        expect(results.height).to.be(HEIGHT);
      });
  });

  it('should reject when the image data is bad', () => {
    const FAKE_ERROR = 'this is not the error you are looking for';
    const WIDTH = 300;
    const HEIGHT = 300;
    return crop(Buffer.from('not an image'), WIDTH, HEIGHT)
      .then(thumbBuffer => {
        throw new Error(FAKE_ERROR);
      })
      .catch(err => {
        expect(err.message).to.not.be(FAKE_ERROR);
      });
  });
});
