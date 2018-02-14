const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256').setEncoding('hex');

module.exports = function hashFile(filename) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(filename);
    input
      .pipe(hash)
      .on('finish', function() {
        resolve(this.read());
      });
  });
};
