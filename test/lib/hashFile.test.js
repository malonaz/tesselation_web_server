const hashFile = require('../../src/lib/hashFile');
const chai = require('chai');
const expect = chai.expect;

describe('hashFile', () => {
  it('should read a file and provide a hash', (done) => {
    let file = 'test/test.jpg';
    hashFile(file)
      .then((hash) => {
        expect(hash).to.be.a('string');
        expect(hash).to.have.lengthOf(64);
        done();
      });
  });
});
