# unityweb-encoding
Connect/Express middleware to apply proper Content-Encoding to .unityweb (Unity WebGL) files.

## Usage
```js
const
  connect = require('connect'),
  serveStatic = require('serve-static'),
  unitywebEncoding = require('unityweb-encoding');
// pathRoot: the root dir of server files
connect()
  .use(unitywebEncoding.serveHeader(pathRoot))
  .use(serveStatic(pathRoot))
  .listen(8000);
```

## API

### serveHeader(pathRoot)
Creates a Connect/Express middleware that applies proper Content-Encoding to .unityweb (Unity WebGL) files.
It reads the first bytes of the file to detect if it's brotli, gzip or uncompressed.

*Returns:* `(req: http.IncomingMessage, res: http.ServerResponse, next: (err?: any) => void) => void`  
The Connect/Express middleware function, which always calls `next()`.

*Params:*

- `pathRoot: string`  
  The root directory for serving files in the route in which this middleware will be used.

### detect(input, br, gzip)
Detects the encoding of a .unityweb file from its header.

*Returns:* `string?`  
`'br'` or `'gzip'` if that encoding is detected, `null` otherwise.

*Params:*

- `input: Buffer?`  
  The beginning of the file.
- `br: boolean`  
  Should it try to detect brotli? If true, input should have the first 39 bytes of the file.
- `gzip: boolean`  
  Should it try to detect gzip? If true, input should have the first 301 bytes of the file.

## License
[BSD-3-Clause]( https://spdx.org/licenses/BSD-3-Clause )  
© 2019 Alfish. All rights reserved.
