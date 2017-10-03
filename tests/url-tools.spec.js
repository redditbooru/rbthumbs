const expect = require('expect.js');
const { encodeUrl, decodeUrl } = require('../src/url-tools');

const TEST_URLS = [
  [ 'aHR0cDovL2R4cHJvZy5jb20vZXhhbXBsZS11cmwtMQ--', 'http://dxprog.com/example-url-1' ],
  [ 'c3ViamVjdHM_X2Q9MQ--', 'subjects?_d=1' ]
];

describe('url-tools', () => {
  it('should encode a URL', () => {
    TEST_URLS.forEach(([ encodedUrl, decodedUrl ]) => {
      const width = 1280;
      const height = 720;
      const url = `${encodedUrl}_${width}_${height}`;
      expect(encodeUrl(decodedUrl, width, height)).to.equal(url);
    });
  });

  it('should decode a URL', () => {
    TEST_URLS.forEach(([ encodedUrl, decodedUrl ]) => {
      const width = 1280;
      const height = 720;
      const url = `${encodedUrl}_${width}_${height}`;
      expect(decodeUrl(url)).to.eql({
        url: decodedUrl,
        width,
        height
      });
    });
  });

  it('should throw on a malformed URL', () => {
    expect(() => decodeUrl('http://apple.com')).to.throwError(/apple/);
  });
});