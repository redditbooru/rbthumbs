[![Build Status](https://travis-ci.org/dxprog/rbthumbs.svg)](https://travis-ci.org/dxprog/rbthumbs)
[![](https://coveralls.io/repos/github/dxprog/rbthumbs/badge.svg)](https://coveralls.io/github/dxprog/rbthumbs)

# RedditBooru Thumbnail Generator / Server

## nginx config

rbthumbs relies on the web server to serve cached images when they exist and only pass non-existing thumbnails to the generator. Here's an example nginx config:

```
server {
  listen 80;
  server_name beta.thumb.awwni.me;
  recursive_error_pages off;

  root    /var/www/rbthumbs/cache;

  location / {
    error_page 404 = /generate-thumb/$uri;
    # Try to find the file on disk, otherwise send to the generator
    try_files $uri /generate-thumb/$uri;
  }

  # The thumbnail generator is invoked under the virtual path "/generate-thumb"
  location /generate-thumb {
    internal;
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
```