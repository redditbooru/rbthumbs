import express from 'express';
import http from 'http';
import path from 'path';
import url from 'url';
import { writeFile } from 'fs/promises';

import fetch from './image-fetcher.js';
import crop from './image-cropper.js';
import { decodeUrl, encodeUrl } from './url-tools.js';

export default class ThumbServer {
  /**
   * Returns whether the HTTP server is running
   *
   * @return {boolean}
   */
  get isRunning() {
    return this._started;
  }

  /**
   * Constructor
   *
   * @param {number} options.port The port to bind the HTTP server to
   * @param {function} options.unhandledRequest A callback to handle non-thumbnail requests
   * @param {function} options.requestFailed A callback to handle any request failure
   * @param {string} options.imageStoragePath The path to save generated thumbnails
   */
  constructor(options = {}) {
    // I should rewrite all this in TypeScript...
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

    this.app = express();
    this.server = http.createServer(this.app);
    this._setupRoutes();
  }

  /**
   * Starts the HTTP server
   *
   * @return {Promise} Resolve once the server has started
   */
  async start() {
    return new Promise((resolve, reject) => {
      if (!this._started) {
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
      this.server.close();
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
  async _handleThumbnailRequest(req, res) {
    let decodedUrl;

    try {
      decodedUrl = decodeUrl(req.originalUrl);

    // If the URL fails to parse for any reason, send a failure response
    } catch (err) {
      this.requestFailed(req, res);
      return;
    }

    // Generate the thumbnail then save and send it
    const { url: imageUrl, width, height } = decodedUrl;

    // Verify the image URL is indeed a URL
    if (!url.parse(imageUrl).hostname) {
      this.requestFailed(req, res);
      return;
    }

    try {
      const fetchBuffer = await fetch(imageUrl);
      const cropBuffer = await crop(fetchBuffer, width, height);
      await Promise.all([
        res.type('jpeg').send(cropBuffer),
        writeFile(path.join(this.imageStoragePath, `${encodeUrl(imageUrl, width, height)}.jpg`), cropBuffer)
      ]);
    } catch (err) {
      this.requestFailed(req, res)
    }
  }
}
