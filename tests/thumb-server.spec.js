const bluebird = require('bluebird');
const expect = require('expect.js');
const fs = bluebird.promisifyAll(require('fs'));
const imagick = bluebird.promisifyAll(require('imagemagick'));
const nock = require('nock');
const path = require('path');
const request = require('supertest');
const sinon = require('sinon');

const ThumbServer = require('../src/thumb-server');

const IMAGE_BASE64 = 'aHR0cDovL2R4cHJvZy5jb20vY29vbC1waWN0dXJlLmpwZw--';
const IMAGE_HOST = 'http://dxprog.com';
const IMAGE_NAME = '/cool-picture.jpg';
const THUMBNAIL_WIDTH = 150;
const THUMBNAIL_HEIGHT = 150;
const THUMBNAIL_URL = `/${IMAGE_BASE64}_${THUMBNAIL_WIDTH}_${THUMBNAIL_HEIGHT}.jpg`;
const NOOP = () => {};
const TEST_CONFIG = {
  port: 4000,
  unhandledRequest: NOOP,
  requestFailed: NOOP,
  imageStoragePath: '/dev/null'
};

describe('thumb-server', () => {

  let sandbox;
  let server;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
    if (server) {
      server.stop();
      server = undefined;
    }
  });

  [
    [ 'port', 'theport' ],
    [ 'unhandledRequest', 'a real function!' ],
    [ 'requestFailed', 42 ],
    [ 'imageStoragePath', 123456789 ]
  ].forEach(([ optionName, badValue ]) => {
    it(`should throw an error for an invalid or missing ${optionName} option`, () => {
      // Clone the default config since we're gonna mutate it
      const CONFIG = Object.assign({}, TEST_CONFIG);

      // Test with a blank value
      CONFIG[optionName] = undefined;
      expect(() => new ThumbServer(CONFIG)).to.throwException();

      // Test with the bad value
      CONFIG[optionName] = badValue;
      expect(() => new ThumbServer(CONFIG)).to.throwException();
    });
  });

  it('should start/stop the HTTP server with valid config', () => {
    server = new ThumbServer(TEST_CONFIG);
    return server.start().then(() => {
      expect(server.isRunning).to.be.ok();
      server.stop();
      expect(server.isRunning).to.not.be.ok();
    });
  });

  it('should resolve if the server is already running', () => {
    server = new ThumbServer(TEST_CONFIG);
    return server.start()
      .then(() => server.start())
      .then(() => {
        expect(server.isRunning).to.be.ok();
      });
  });

  it('should reject with the error if the server failed to start', () => {
    // Override the port to an invalid one
    server = new ThumbServer(Object.assign({}, TEST_CONFIG, { port: 19860608 }));
    return server.start()
      .catch(err => {
        expect(err).to.be.an(Error);
        expect(server.isRunning).to.not.be.ok();
      });
  });

  it('should call unhandledRequest for a non-thumbnail request', done => {
    const RESPONSE = 'Hi';
    const unhandledRequestSpy = sandbox.spy((req, res) => res.send(RESPONSE));
    server = new ThumbServer(Object.assign({}, TEST_CONFIG, {
      unhandledRequest: unhandledRequestSpy
    }));

    request(server.app)
      .get('/')
      .expect(200, RESPONSE)
      .end((err, res) => {
        expect(unhandledRequestSpy.calledOnce).to.be.ok();

        if (err) {
          throw err;
        }
        done();
      });
  });

  it('should return a cropped thumbnail for a valid URL and save the file to disk', () => {
    const server = new ThumbServer(Object.assign({}, TEST_CONFIG, {
      imageStoragePath: __dirname
    }));

    let responseBuffer;
    return fs.readFileAsync(path.join(__dirname, 'images', 'taiga.jpg'))
      .then(buffer => nockResponse = nock(IMAGE_HOST).get(IMAGE_NAME).reply(200, buffer))
      .then(() => {
        return request(server.app)
          .get(THUMBNAIL_URL)
          .expect('Content-Type', 'image/jpeg')
      })
      .then(res => {
        responseBuffer = res.body;
        return imagick.identifyAsync({ data: res.body });
      })
      .then(results => {
        nockResponse.done();
        expect(results.format).to.be('JPEG');
        expect(results.width).to.be(THUMBNAIL_WIDTH);
        expect(results.height).to.be(THUMBNAIL_HEIGHT);
      })
      .then(() => fs.readFileAsync(path.join(__dirname, THUMBNAIL_URL)))
      .then(buffer => {
        expect(buffer).to.eql(responseBuffer);
      });
  });

  it('should call requestFailed on a bad thumbnail URL', done => {
    const RESPONSE = 'Hi';
    const requestFailedSpy = sandbox.spy((req, res) => res.send(RESPONSE));
    server = new ThumbServer(Object.assign({}, TEST_CONFIG, {
      requestFailed: requestFailedSpy
    }));

    request(server.app)
      .get('/blahdbldhjfid_150_150.jpg')
      .expect(200, RESPONSE)
      .end((err, res) => {
        expect(requestFailedSpy.calledOnce).to.be.ok();

        if (err) {
          throw err;
        }
        done();
      });
  });

  it('should call requestFailed on a failed image request', () => {
    const RESPONSE = 'Hi';
    const requestFailedSpy = sandbox.spy((req, res) => res.send(RESPONSE));
    server = new ThumbServer(Object.assign({}, TEST_CONFIG, {
      requestFailed: requestFailedSpy
    }));
    const nockResponse = nock(IMAGE_HOST).get(IMAGE_NAME).reply(200, Buffer.from('No image for you'));

    return request(server.app).get(THUMBNAIL_URL)
      .expect(200, RESPONSE)
      .then(() => {
        expect(requestFailedSpy.calledOnce).to.be.ok();
      });
  });

});