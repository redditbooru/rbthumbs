import imagick from 'imagemagick';

/**
 * Crops an image
 *
 * @param {Buffer} buffer A buffer of the image to be cropped
 * @param {number} width The width of the cropped image
 * @param {number} height The height of the cropped image
 * @return {Promise} A promise that resolves to a buffer of the cropped image
 */
export default async function crop(buffer, width, height) {
  return new Promise((resolve, reject) => {
    try {
      imagick.crop({
        srcData: buffer,
        width,
        height,
        quality: 0.8,
        gravity: 'North'
      }, (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          resolve(Buffer.from(stdout, 'binary'));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
