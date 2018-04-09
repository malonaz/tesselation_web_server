const crypto = require('crypto');
const fs = require('fs');

/* function that generates a hash based on contents of a file */
module.exports = function hashFile(filename) {
  return new Promise((resolve) => {
    // async process, need promise to ensure that the file read and hash are
    // completed before returning the hash
    const hash = crypto.createHash('sha256').setEncoding('hex');
    const input = fs.createReadStream(filename);
    input
      .pipe(hash)
      .on('finish', function onFinish() {
        resolve(this.read());
      });
  });
};
