const bluebird = require('bluebird');
const express = require('express');
const http = require('http');
const path = require('path');
const writeFileAsync = bluebird.promisify(require('fs').writeFile);

const fetch = require('./image-fetcher');
const crop = require('./image-cropper');
const { decodeUrl, encodeUrl } = require('./url-tools');

module.exports = class ThumbServer {
  get isRunning() {
    return this._started;
  }

  constructor(options = {}) {
    this.app = express();
    this.server = http.createServer(this.app);

    if (typeof options.port !== 'number') {
      throw new Error('Port number is required and must be a number');
    }
    this.port = options.port;

    if (typeof options.unhandledRequest !== 'function') {
      throw new Error('An unhandledRequest callback function is required');
    }
    this.unhandledRequest = options.unhandledRequest;

    if (typeof options.requestFailed !== 'function') {
      throw new Error('A requestFailed callback function is required');
    }
    this.requestFailed = options.requestFailed;

    if (typeof options.imageStoragePath !== 'string') {
      throw new Error('An image storage path is required');
    }
    this.imageStoragePath = options.imageStoragePath;

    this._started = false;
    this._handleThumbnailRequest = this._handleThumbnailRequest.bind(this);
  }

  /**
   * Starts the HTTP server
   *
   * @return {Promise} Resolve once the server has started
   */
  start() {
    return new Promise((resolve, reject) => {
      if (!this._started) {
        this._setupRoutes();
        this.server.listen(this.port, err => {
          if (!err) {
            this._started = true;
            resolve();
          } else {
            reject(err);
          }
        });
      } else {
        // Since the server is already started, just exit happily
        resolve();
      }
    });
  }

  /**
   * Stops the HTTP server
   */
  stop() {
    if (this._started) {
      this.server.stop();
      this._started = false;
    }
  }

  /**
   * Sets up the express server routes
   *
   * @private
   */
  _setupRoutes() {
    if (!this._started) {
      const { app } = this;

      app.get(/([\w\-\\_\+]+)_([\d]+)_([\d]+)\.jpg/, this._handleThumbnailRequest);
      app.all('*', this.unhandledRequest);
    }
  }

  /**
   * Handles a request for a thumbnail
   *
   * @private
   * @param {express.Request} req
   * @param {express.Response} res
   */
  _handleThumbnailRequest(req, res) {
    let decodedUrl;
    try {
      decodedUrl = decodeUrl(req.originalUrl);

    // If the URL fails to parse for any reason, send a failure response
    } catch (err) {
      this.requestFailed(req, res);
      return;
    }

    // Generate the thumbnail then save and send it
    const { url, width, height } = decodedUrl;
    fetch(url)
      .then(buffer => crop(buffer, width, height))
      .then(buffer => Promise.all([
        res.type('jpeg').send(buffer),
        writeFileAsync(path.join(this.imageStoragePath, `${encodeUrl(url, width, height)}.jpg`), buffer)
      ]))
      .catch(this.requestFailed);
  }
}