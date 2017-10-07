const bluebird = require('bluebird');
const hostImageResolver = require('host-image-resolver');
const fs = require('fs');
const request = require('request-promise-native');
const nodeUrl = require('url');

/**
 * Downloads an image, doing host resolultion and "hot-link evasion"
 *
 * @param {string} url The image URL to fetch.
 * @return {Promise} A promise that resolves to a buffer of the image data
 */
module.exports = function fetch(url) {
  return hostImageResolver(url)
    .then(urls => request({
      url: urls[0],
      encoding: null,
      // A scummy way to get around hotlinking images/responses
      headers: {
        Referer: `http://${nodeUrl.parse(urls[0]).hostname}`
      }
    }));
};