import hostImageResolver from 'host-image-resolver';
import request from 'request-promise-native';
import { parse } from 'url';

/**
 * Downloads an image, doing host resolultion and "hot-link evasion"
 *
 * @param {string} url The image URL to fetch.
 * @return {Promise} A promise that resolves to a buffer of the image data
 */
export default async function fetch(url) {
  const urls = await hostImageResolver(url);
  return request({
    url: urls[0],
    encoding: null,
    // A scummy way to get around hotlinking images/responses
    headers: {
      Referer: `http://${parse(urls[0]).hostname}`
    }
  });
};
