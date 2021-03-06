const chai = require('chai');
const fs = require('fs');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const server = require('../server');

const TEST_DATA_DIR = './test';
const TEST_HASH_PROCESSING = '8bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_PROCESSED = 'bb542fcff403f04507d4f4881e9a92c27ac21970dc54ea16b28aeda35971c65b';
const TEST_HASH_NOT_EXISTS = '0bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_UPLOAD = '67affb51d7ea5c6a9a6bd0d86e3008b3377f70c15a8ebc7d6bf6cc70053becb4';

chai.use(chaiHttp);

describe('POST /puzzle/check', () => {
  describe('not hash', () => {
    // not a hash
    it('should check the hash and return {msg: error! puzzle not found}', (done) => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({ hash: 'i am a normal string' })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('Puzzle not found');
          done();
        });
    });
  });

  describe('file does not exist', () => {
    // file does not exists
    it('should check the hash and return {msg: error! puzzle not found}', (done) => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({ hash: TEST_HASH_NOT_EXISTS })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('Puzzle not found');
          done();
        });
    });
  });
  describe('processing file exist', () => {
    before((done) => {
      // good hash - solving exists
      let file = process.env.UPLOAD_DIR + '/' + TEST_HASH_PROCESSING + '/processing';
      if (!fs.existsSync(file)) {
        fs.writeFile(file, '', (err) => {
          if (err) throw err;
          done();
        });
        return;
      }
      done();
    });

    it('should check the hash and return {processing: true}', (done) => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({ hash: TEST_HASH_PROCESSING })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('processing');
          expect(res.body.processing).to.be.true;
          done();
        });
    });
  });

  describe('processing file does not exist', () => {
    before((done) => {
      // good hash - solving does not exists
      let file = process.env.UPLOAD_DIR + '/' + TEST_HASH_PROCESSED + '/processing';
      let pieces_file = process.env.UPLOAD_DIR + '/' + TEST_HASH_PROCESSED + '/pieces';
      if (fs.existsSync(file)) {
        fs.unlink(file, (err) => {
          if (err) throw err;
          done();
        });
        return;
      }
      if (!fs.existsSync(pieces_file)) {
        fs.writeFile(pieces_file, '1 2 3 4', (err) => {
          if (err) throw err;
          done();
        });
        return;
      }
      done();
    });

    it('should check the hash and return {processing: false}', (done) => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({ hash: TEST_HASH_PROCESSED })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('processing');
          expect(res.body.processing).to.be.false;
          expect(res.body).to.have.property('pieces');
          expect(res.body.pieces).to.be.a('string');
          done();
        });
    });
  });
});

describe('POST /puzzle/solution', () => {
  describe('not a valid hash input', () => {
    it('should check the hash and return error', (done) => {
      chai.request(server)
        .post('/puzzle/solution')
        .set('content-type', 'application/json')
        .send({ hash: "i am a normal string" , state: "1 2 3 4" })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('Puzzle not found');
          done();
        });
    });
  });

  describe('not a valid state input', () => {
    it('should check the state and return error', (done) => {
      chai.request(server)
        .post('/puzzle/solution')
        .set('content-type', 'application/json')
        .send({ hash: TEST_HASH_PROCESSED , state: "a b c" })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(500);
          expect(res).to.be.json;
          expect(res.body).to.have.property('msg');
          expect(res.body.msg).to.be.equals('Input Error');
          done();
        });
    });
  });

  describe('valid inputs', () => {
    it('should check the hash and state and return 1 2 3 4', (done) => {
      chai.request(server)
        .post('/puzzle/solution')
        .set('content-type', 'application/json')
        .send({ hash: TEST_HASH_PROCESSED , state: "1 1 2" })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.equals(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('solution');
          expect(res.body.solution).to.be.a('string');
          done();
        });
    });
  });
});
