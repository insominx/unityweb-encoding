//(C) 2019 Alfish. All rights reserved. https://spdx.org/licenses/BSD-3-Clause

const
  fs = require('fs'),
  path = require('path');

/** Returns false if `subpath` is actually outside of the `root` path.
 * A path is considered to be inside itself.
 * @param {string} root The reference path.
 * @param {string} subpath The path to test.
 */
function isInsidePath(root, subpath) {
  const rel = path.relative(root, subpath);
  return rel.split(/[/\\]/, 1)[0] != '..' && !path.isAbsolute(rel);
}
function bytesStartWith(
  /**@type {Buffer}*/ buf,
  /**@type {Buffer}*/ prefix
) {
  const n = prefix.byteLength;
  return buf.byteLength >= n && prefix.compare(buf, 0, n) == 0;
}
function readStaticFileBytesSync(
  /**@type {string}*/ pathRoot,
  /**@type {import('http').IncomingMessage}*/ req,
  /**@type {number}*/ nbytes
) {
  const pathFile = path.resolve(pathRoot, '.' + req.url);
  // ensure URL can't have ../ relative paths to outside the root
  if (!isInsidePath(pathRoot, pathFile))
    return null;
  try {
    const buf = Buffer.alloc(nbytes);
    const fd = fs.openSync(pathFile, 'r');
    fs.readSync(fd, buf, 0, nbytes, 0);
    fs.closeSync(fd);
    return buf;
  } catch {
    return null;
  }
}

const headerUnityWebBrotli = Buffer.from('\x6B\x8D\x00UnityWeb Compressed Content (brotli)', 'latin1');
const commentUnityWebGzip = Buffer.from('\x00UnityWeb Compressed Content (gzip)\x00', 'latin1');

/** Detects the encoding of a .unityweb file from its header.
 * @returns {string?} `'br'` or `'gzip'` if that encoding is detected, `null` otherwise.
 * @param {Buffer?} input The beginning of the file.
 * @param {boolean} br Should it try to detect brotli? If true, input should have the first 39 bytes of the file.
 * @param {boolean} gzip Should it try to detect gzip? If true, input should have the first 301 bytes of the file.
 */
function detect(input, br, gzip) {
  if (input) {
    if (br && bytesStartWith(input, headerUnityWebBrotli))
      return 'br';
    if (gzip && input.readInt32LE(0) == 403213087) { // starts with 1F 8B 08 18
      const commentIndex = input.indexOf(0, 10); // 10-byte header, filename, '\0', comment, '\0'
      if (commentIndex >= 0 && input.compare(commentUnityWebGzip, 0, 36, commentIndex, commentIndex + 36) == 0)
        return 'gzip';
    }
  }
  return null;
}

/** Creates a Connect/Express middleware that applies proper Content-Encoding to .unityweb (Unity WebGL) files.
 * It reads the first bytes of the file to detect if it's brotli, gzip or uncompressed.
 * @returns The Connect/Express middleware function, which always calls `next()`.
 * @param {string} pathRoot The root directory for serving files in the route in which this middleware will be used.
 */
function serveHeader(pathRoot) {
  return (
    /**@type {import('http').IncomingMessage}*/ req,
    /**@type {import('http').ServerResponse}*/ res,
    /**@type {(err?: any) => void}*/ next
  ) => {
    if (/\.unityweb$/i.test(/**@type {string}*/(req.url))) {
      const aencs = (req.headers['accept-encoding'] || '').toString().split(/\s*,\s*/g);
      const br = aencs.includes('br'), gzip = aencs.includes('gzip');
      if (br || gzip) {
        const file = readStaticFileBytesSync(pathRoot, req, gzip ? 301 : 39); // 10 + 255 + 36
        const enc = detect(file, br, gzip);
        if (enc)
          res.setHeader('Content-Encoding', enc);
      }
    }
    next();
  };
}

module.exports = { serveHeader, detect };
