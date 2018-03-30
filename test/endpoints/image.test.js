const chai = require('chai');
const fs = require('fs');
const fse = require('fs-extra');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const server = require('../server');

const TEST_HASH_SOLVING = '8bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_SOLVED = 'bb542fcff403f04507d4f4881e9a92c27ac21970dc54ea16b28aeda35971c65b';
const TEST_HASH_NOT_EXISTS = '0bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_UPLOAD = '67affb51d7ea5c6a9a6bd0d86e3008b3377f70c15a8ebc7d6bf6cc70053becb4';

chai.use(chaiHttp);

describe('POST /image/upload', () => {
  describe('no upload file', () => {
    // no upload file
    it('should check and return {msg: error! puzzle not found}', (done) => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/test.txt';
      chai.request(server)
        .post('/image/upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_text.txt')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('File Upload Error');
          done();
        });
    });
  });

  describe('upload is empty', () => {
    // null upload
    it('should check and return {msg: File Upload Error}', (done) => {
      chai.request(server)
        .post('/image/upload')
        .send('puzzle', '')
        .set('content-type', 'image/jpeg')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('File Upload Error');
          done();
        });
    });
  });

  describe('upload is a new picture', () => {
    // new picture
    // delete folder before test
    before((done) => {
      let folder = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + TEST_HASH_UPLOAD;
      if (fse.exists(folder)) {
        console.log('path exists');
        fse.remove(folder, (err) =>{
          if (err) throw err;
          console.log(folder + ' deleted before testing....');
          done();
        });
      }
    });

    it('should check the hash and return {hash: 67aff....}', (done) => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/upload_test.jpeg';
      chai.request(server)
        .post('/image/upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_image.jpg')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('hash');
          expect(res.body.hash).to.be.equals(TEST_HASH_UPLOAD);
          done();
        });
    });
  });

  describe('upload pre-existing picture', () => {
    // picture already exists
    it('should check the hash and return {hash: hash}', (done) => {
      let file = process.env.PRJ_DIR + process.env.WEB_TEST_DIR + '/test2.jpg';
      chai.request(server)
        .post('/image/upload')
        .attach('puzzle', fs.readFileSync(file), 'test_upload_image_exist.jpg')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('hash');
          expect(res.body.hash).to.be.equals(TEST_HASH_SOLVED);
          done();
        });
    });
  });
});
