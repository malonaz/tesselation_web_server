const chai = require('chai');
const fs = require('fs');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const server = require('../server');

const TEST_HASH_SOLVING = '8bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_SOLVED = 'bb542fcff403f04507d4f4881e9a92c27ac21970dc54ea16b28aeda35971c65b';
const TEST_HASH_NOT_EXISTS = '0bfae8c3c31548d76f137ce698aa9a02bdc478411e2b69d8502aaf63b984d8a4';
const TEST_HASH_UPLOAD = '67affb51d7ea5c6a9a6bd0d86e3008b3377f70c15a8ebc7d6bf6cc70053becb4';

chai.use(chaiHttp);

describe('puzzle', () => {
  describe('POST /puzzle/check : not hash', (done) => {
    // not a hash
    it('should check the hash and return {msg: error! puzzle not found}', () => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({hash: 'i am a normal string'})
        .end((err, res) => {
          res.should.hav.status(200);
          res.body.should.be.json;
          res.body.should.have.property('msg');
          res.body.msg.should.be.equals('error! puzzle not found')
          done();
        });
    });
  });
  describe('POST /puzzle/check : file does not exist', (done) => {
    // file does not exists
    it('should check the hash and return {msg: error! puzzle not found}', () => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({hash: TEST_HASH_NOT_EXISTS})
        .end((err, res) => {
          res.should.have.status(300);
          res.body.should.be.json;
          res.body.should.have.property('msg');
          res.body.msg.should.be.equals('error! puzzle not found')
          done();
        });
    });
  });
  describe('POST /puzzle/check : solving file exist', (done) => {
    // good hash - solving exists
    let file = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + TEST_HASH_SOLVING + '/solving';
    if (!fs.existsSync(file)) {
      fs.writeFile(file);
    }
    it('should check the hash and return {solving: true}', () => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({hash: TEST_HASH_SOLVING})
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.json;
          res.body.should.have.property('solving');
          res.body.solving.should.be.true;
          done();
        });
    });
  });

  describe('POST /puzzle/check : solving file does not exist', (done) => {
    // good hash - solving does not exists
    let file = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + process.env.TEST_HASH_SOLVED + '/solving';
    if (fs.existsSync(file)) {
      fs.unlink(file, (err) =>{
        if (err) throw err;
      });
    }
    it('should check the hash and return {solving: false}', () => {
      chai.request(server)
        .post('/puzzle/check')
        .set('content-type', 'application/json')
        .send({hash: process.env.TEST_HASH_SOLVED})
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.json;
          res.body.should.have.property('solving');
          res.body.solving.should.be.false;
          res.body.should.have.property('pieces_array');
          res.body.pieces_array.should.be.an('array');
          res.body.should.have.property('solutions_array');
          res.body.solutions_array.should.be.an('array');
          done();
        });
    });
  });
});
