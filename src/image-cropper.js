const bluebird = require('bluebird');
const imagick = bluebird.promisifyAll(require('imagemagick'));

/**
 * Crops an image
 *
 * @param {Buffer} buffer A buffer of the image to be cropped
 * @param {number} width The width of the cropped image
 * @param {number} height The height of the cropped image
 * @return {Promise} A promise that resolves to a buffer of the cropped image
 */
module.exports = function crop(buffer, width, height) {
  return imagick.cropAsync({
    srcData: buffer,
    width,
    height,
    quality: 0.8,
    gravity: 'North'
  }).then(stdout => Buffer.from(stdout, 'binary'));
};