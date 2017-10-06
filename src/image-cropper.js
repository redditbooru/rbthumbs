const bluebird = require('bluebird');
const imagick = bluebird.promisifyAll(require('imagemagick'));

module.exports = function crop(buffer, width, height) {
  return imagick.cropAsync({
    srcData: buffer,
    width,
    height,
    quality: 0.8,
    gravity: 'North'
  }).then(stdout => Buffer.from(stdout, 'binary'));
};