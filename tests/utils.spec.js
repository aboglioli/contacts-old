require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.APP_PORT = 3001;
process.env.APP_PASSWORD = '123456';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../src/server');

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

const {formatContact} = require('../src/utils');
const {renderTemplate} = require('../src/template-renderer');

describe('Server' ,function() {
  // this.timeout(10000);

  before((done) => {
    chai.request(server)
      .post('/configure/123456')
      .send({
        id: 'test',
        name: 'Test',
        url: "www.test.com",
        email: 'test@test.com'
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.id.should.equal('test');
        res.body.email.should.equal('test@test.com');

        done();
      });
  });

  it('formatContact', () => {
    const contact = {
      name: "Nombre",
      email: "email@email.com",
      phone: "2615415263",
      items: {
        item1: 256,
        item2: 125,
        item3: {
          subtotal: 333
        }
      }
    };

    const formattedContact = formatContact(contact);

    expect(formattedContact).to.deep.equal({
      Name: "Nombre",
      Email: "email@email.com",
      Phone: "2615415263",
      Items: {
        Item1: 256,
        Item2: 125,
        Item3: {
          Subtotal: 333
        }
      }
    });
  });

  it('renderTemplate', (done) => {
    const contact = {
      name: "Nombre Contacto",
      email: "email@email.com",
      phone: "2615415263",
      items: {
        item1: 256,
        item2: 125,
        item3: {
          subtotal: 333
        }
      }
    };

    const formattedContact = formatContact(contact);

    renderTemplate('MyName', 'my.email@email.com', formattedContact, (err, result) => {
      expect(result.html.includes('MyName')).to.be.true;
      expect(result.html.includes('Nombre Contacto')).to.be.true;
      expect(result.html.includes('email@email.com')).to.be.true;
      expect(result.html.includes('Item1')).to.be.true;
      expect(result.html.includes('Subtotal')).to.be.true;

      done();
    });
  });
});
