const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../server');

chai.use(chaiHttp);

describe('Cart', () => {
  describe('GET /welcome', () => {
    it('should return hello message', () => {
      chai.request(server)
        .get('/welcome')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('object');
          res.body.should.have.property('msg');
          res.body.msg.should.be.an('string');
          res.body.msg.should.be.equals('the start of an amazing app.');
          done();
        });
    });
  });
});
