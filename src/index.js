// environment
require('dotenv').config();

// native
const path = require('path');

// express
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// lowdb
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('db.json');
let db;

// mailgun
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// email templates
const templateDir = path.join(__dirname, 'templates', 'contact');

const EmailTemplate = require('email-templates').EmailTemplate;
const contactTemplate = new EmailTemplate(templateDir);

// date
const moment = require('moment');

// set routes
app.get('/:passwd', (req, res) => {
  if(req.params.passwd !== process.env.APP_PASSWORD) {
    return res.send('Invalid password');
  }

  return res.send(db.get('root').value());

});

app.post('/configure/:passwd', (req, res) => {
  if(req.params.passwd !== process.env.APP_PASSWORD) {
    return res.send('Invalid password');
  }

  const data = req.body;
  if(!data.id || !data.name || !data.url || !data.email) {
    return res.send('Missing data');
  }

  const dbData = db.get('root')
        .find({id: data.id})
        .value();

  if(dbData) {
    // existing
    db.get('root')
      .find({id: data.id})
      .assign(data)
      .write()
      .then(saved => res.send(saved));
  } else {
    // new
    data.contacts = data.contacts || [];

    db.get('root')
      .push(data)
      .write()
      .then(saved => res.send(saved));
  }
});

app.post('/:id', (req, res) => {
  const id = req.params.id;
  let contact = req.body;
  contact.fecha = contact.fecha || moment().format('DD/MM/YYYY HH:mm:ss');

  contact = formatContact(contact);

  const dbData = db.get('root').find({id}).value();

  if(!dbData) {
    return res.send('ID does not exist');
  }

  db.get('root')
    .find({id})
    .assign({contacts: [...dbData.contacts, contact]})
    .write()
    .then(data => {
      console.log('NUEVO CONTACTO:', contact);

      contactTemplate.render({name: data.name, contact}, (err, result) => {
        if(err) {
          return res.send('ERROR');
        }

        const mailData = {
          from: 'Contacto <contacto@ideenegocios.com.ar>',
          to: data.email,
          subject: `Nuevo contacto en ${data.name}`,
          html: result.html
        };

        mailgun.messages().send(mailData, (err, body) => {
          if(err) {
            return res.send('ERROR');
          }

          res.send('OK');
        });
      });
    });
});

// create database instance and start server
low(adapter)
  .then(lowdb => {
    db = lowdb;
    return db.defaults({root: []}).write();
  })
  .then(() => {
    app.listen(process.env.APP_PORT, () => console.log(`Listening on port ${process.env.APP_PORT}`));
  });


// utils
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatContact(contact) {
  return Object.keys(contact).reduce((obj, key) => {
    obj[capitalizeFirstLetter(key)] = contact[key];
    return obj;
  }, {});
}
