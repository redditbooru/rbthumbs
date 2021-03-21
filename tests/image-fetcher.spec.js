import bluebird from 'bluebird';
import expect from 'expect.js';
import { readFile } from 'fs';
import nock from 'nock';
import path from 'path';

import { __dirname } from './helpers.js';
import fetch from '../src/image-fetcher.js';

const readFileAsync = bluebird.promisify(readFile);

const IMAGE_HOST = 'http://cdn.awwni.me';
const IMAGE_PATH = '/taiga.jpg';
const IMAGE_URL = `${IMAGE_HOST}${IMAGE_PATH}`;
const TEST_IMAGE_PATH = path.join(__dirname, 'images', 'taiga.jpg');

describe('image-fetcher', () => {
  it('should fetch an image and return the buffer', () => {
    let nockResponse;
    let imageBuffer;
    return readFileAsync(TEST_IMAGE_PATH)
      .then(buffer => imageBuffer = buffer)
      .then(() => {
        nockResponse = nock(IMAGE_HOST)
          .get(IMAGE_PATH)
          .reply(200, imageBuffer);
      })
      .then(() => fetch(IMAGE_URL))
      .then(buffer => {
        const { headers } = nockResponse.interceptors[0].req;
        expect(buffer).to.be.a(Buffer);
        expect(buffer).to.eql(imageBuffer);
        expect(headers.referer).to.be(IMAGE_HOST);
        nockResponse.done();
      });
  });

  it('should reject when the server responds with a bad HTTP code', () => {
    const ERROR_CODE = 403;
    const nockResponse = nock(IMAGE_HOST)
      .get(IMAGE_PATH)
      .reply(ERROR_CODE);

    return fetch(IMAGE_URL)
      .catch(err => {
        expect(err.message).to.contain(ERROR_CODE);
        nockResponse.done();
      });
  });

  it('should reject when the network request fails', () => {
    const FAILURE_MSG = 'Request timed out';
    const nockResponse = nock(IMAGE_HOST)
      .get(IMAGE_PATH)
      .replyWithError(new Error(FAILURE_MSG));

    return fetch(IMAGE_URL)
      .catch(err => {
        expect(err.message).to.contain(FAILURE_MSG);
        nockResponse.done();
      });
  });
});
