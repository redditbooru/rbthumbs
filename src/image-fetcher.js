const bluebird = require('bluebird');
const hostImageResolver = require('host-image-resolver');
const fs = require('fs');
const request = require('request');
const nodeUrl = require('url');

/**
 * Async wrapper for request
 *
 * @param {*} options
 * @return {Promise} A promise that resolves to a buffer of the request body
 */
function requestAsync(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        reject(err);
      } else if (res.statusCode !== 200 || !body) {
        reject(new Error(`Server failed with HTTP code ${res.statusCode}`));
      } else {
        resolve(Buffer.from(body));
      }
    });
  });
}

/**
 * Downloads an image, doing host resolultion and "hot-link evasion"
 *
 * @param {string} url The image URL to fetch.
 * @return {Promise} A promise that resolves to a buffer of the image data
 */
module.exports = function fetch(url) {
  return hostImageResolver(url)
    .then(urls => requestAsync({
      url: urls[0],
      encoding: null,
      // A scummy way to get around hotlinking images/responses
      headers: {
        Referer: `http://${nodeUrl.parse(urls[0]).hostname}`
      }
    }));
};