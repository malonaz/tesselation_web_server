const app = require('../../src/endpoints/image_upload')
const chai = require('chai');
const fs = require('fs')
const fse = require('fs-extra')
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const server = require('../server');

const TEST_HASH_SOLVING = '8bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_SOLVED = 'bb542fcff403f04507d4f4881e9a92c27ac21970dc54ea16b28aeda35971c65b';
const TEST_HASH_NOT_EXISTS = '0bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_UPLOAD = '67affb51d7ea5c6a9a6bd0d86e3008b3377f70c15a8ebc7d6bf6cc70053becb4';

chai.use(chaiHttp);

describe('image_upload', () => {

  describe('POST / : no upload file', (done) => {
    // no upload file
    it('should check and return {msg: error! puzzle not found}', () => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/test.txt';
      chai.request(server)
        .post('/image_upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_text.txt')
        .end((err, res) => {
          res.should.hav.status(500);
          res.body.should.be.json;
          res.body.should.have.property('error');
          res.body.error.should.be.equals('error! puzzle not found');
          done();
        });
    });
  });

  describe('POST / : upload is empty', (done) => {
    // null upload
    it('should check and return {msg: File Upload Error}', () => {
      chai.request(server)
        .post('/image_upload')
        .send('puzzle', '')
        .set('content-type', 'image/jpeg')
        .end((err, res) => {
          res.should.hav.status(200);
          res.body.should.be.json;
          res.body.should.have.property('msg');
          res.body.msg.should.be.equals('File Upload Error');
          done();
        });
    });
  });

  describe('POST / : upload is a new picture', (done) => {
    // new picture
    // delete folder before test
    let folder = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + TEST_HASH_UPLOAD;
    if (fse.exists(folder)) {
      console.log('path exists');
      fse.remove(folder, (err) =>{
        if (err) throw err;
        console.log(folder + ' deleted before testing....');
      });
    }
    it('should check the hash and return {hash: 67aff....}', () => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/upload_test.jpeg';
      chai.request(server)
        .post('/image_upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_image.jpg')
        .end((err, res) => {
          res.body.should.be.json;
          res.body.should.have.property('hash');
          res.body.hash.should.be.equals(TEST_HASH_UPLOAD);
          done();
        });
    });
  });

  describe('POST / : upload pre-existing picture', (done) => {
    // picture already exists
    it('should check the hash and return {hash: hash}', () => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/test2.jpg';
      chai.request(server)
        .post('/image_upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_image_exist.jpg')
        .end((err, res) => {
          res.body.should.be.json;
          res.body.should.have.property('hash');
          res.body.hash.should.be.equals(TEST_HASH_SOLVED);
        });
      });
    });
});
