const bluebird = require('bluebird');
const expect = require('expect.js');
const fs = bluebird.promisifyAll(require('fs'));
const imagick = bluebird.promisifyAll(require('imagemagick'));
const nock = require('nock');
const os = require('os');
const path = require('path');
const request = require('supertest');
const sinon = require('sinon');

const App = require('../src/app');

const IMAGE_BASE64 = 'aHR0cDovL2R4cHJvZy5jb20vY29vbC1waWN0dXJlLmpwZw--';
const IMAGE_HOST = 'http://dxprog.com';
const IMAGE_NAME = '/cool-picture.jpg';
const THUMBNAIL_WIDTH = 150;
const THUMBNAIL_HEIGHT = 150;
const THUMBNAIL_URL = `/${IMAGE_BASE64}_${THUMBNAIL_WIDTH}_${THUMBNAIL_HEIGHT}.jpg`;
const DEFAULT_PORT = 4000;

describe('thumb-server', () => {

  let notFoundImg;
  let brokenImg;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    return Promise.all([
      fs.readFileAsync(path.join(__dirname, '..', 'static', 'broken.png')),
      fs.readFileAsync(path.join(__dirname, '..', 'static', 'not-found.png'))
    ]).then(([ brokenPng, notFoundPng ]) => {
      brokenImg = brokenPng;
      notFoundImg = notFoundPng;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should throw an error for an invalid port', () => {
    expect(() => {
      new App('Hey there!');
    }).to.throwException(/Port/);
  });

  it('should start/stop the HTTP server', () => {
    const app = new App(DEFAULT_PORT);
    return app.start().then(() => {
      expect(app.server.isRunning).to.be.ok();
      app.stop();
      expect(app.server.isRunning).to.not.be.ok();
    });
  });

  it('should send the not found response for a non-thumbnail request', () => {
    const app = new App(DEFAULT_PORT);

    return request(app.server.app)
      .get('/')
      .expect('Content-Type', 'image/png')
      .expect(200)
      .then(res => {
        expect(res.body).to.eql(notFoundImg);
      });
  });

  it('should call requestFailed on a bad thumbnail URL', () => {
    const app = new App(DEFAULT_PORT);

    return request(app.server.app)
      .get('/blahdbldhjfid_150_150.jpg')
      .expect('Content-Type', 'image/png')
      .expect(200)
      .then(res => {
        expect(res.body).to.eql(brokenImg);
      });
  });

  it('should call requestFailed on a failed image request', () => {
    const nockResponse = nock(IMAGE_HOST).get(IMAGE_NAME).reply(200, Buffer.from('No image for you'));
    const app = new App(DEFAULT_PORT);

    return request(app.server.app)
      .get(THUMBNAIL_URL)
      .expect('Content-Type', 'image/png')
      .expect(200)
      .then(res => {
        expect(res.body).to.eql(brokenImg);
      });
  });

  it('should log out any startup errors and rethrow them', () => {
    const app = new App(DEFAULT_PORT);
    const startStub = sandbox.stub(app.server, 'start').throws();
    const consoleSpy = sandbox.spy(console, 'error');

    return app.start().catch(err => {
      expect(consoleSpy.calledOnce).to.be.ok();
      expect(consoleSpy.firstCall.args[0]).to.equal(err.toString());
    });
  });

});