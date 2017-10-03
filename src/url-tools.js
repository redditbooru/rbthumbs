const ENCODING_MAP = [
  [ '=', '-' ],
  [ '/', '_' ]
];

const URL_REGEX = /([\w\-\\_\+]+)_([\d]+)_([\d]+)/g;

module.exports = {
  /**
   * Encodes a URL in the thumbnail encoding scheme
   *
   * @param {string} url The image URL to encode
   * @param {number} width The width of the thumbnail
   * @param {number} height The height of the thumbnail
   * @return {string} The encoded thumbnail name
   */
  encodeUrl(url, width, height) {
    let encodedUrl = (new Buffer(url, 'utf-8')).toString('base64');
    ENCODING_MAP.forEach(([ base64Char, urlChar ]) => {
      encodedUrl = encodedUrl.replace(new RegExp(base64Char, 'g'), urlChar);
    });
    return `${encodedUrl}_${width}_${height}`
  },

  /**
   * Decodes a URL into its various parts
   * @param {*} url The URL to decode
   * @return {Object} An object containing the image URL, width, and height of the thumbnail
   */
  decodeUrl(url) {
    URL_REGEX.lastIndex = 0;
    const urlParts = URL_REGEX.exec(url);
    if (urlParts) {
      let imageUrl = urlParts[1];
      ENCODING_MAP.forEach(([ base64Char, urlChar ]) => {
        imageUrl = imageUrl.replace(new RegExp(urlChar, 'g'), base64Char);
      });
      imageUrl = (new Buffer(imageUrl, 'base64')).toString('utf-8');

      return {
        url: imageUrl,
        width: parseInt(urlParts[2]),
        height: parseInt(urlParts[3])
      };
    } else {
      throw new Error(`URL is not a thumbnail URL: ${url}`);
    }
  }
};