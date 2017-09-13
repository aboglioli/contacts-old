// express
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// lowdb
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync('db.json');
let db;

// date
const moment = require('moment');

// utils
const {renderTemplate} = require('./template-renderer');
const {formatContact} = require('./utils');

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
    .then((data) => {
      renderTemplate(data.name, data.email, contact, (err, message) => {
        if(err) {
          return res.send(message);
        }

        return res.send(message);
      });
    })
    .catch((err) => res.send(err));
});

// create database instance and start server
low(adapter)
  .then(lowdb => {
    db = lowdb;
    return db.defaults({root: []}).write();
  })
  .then(() => {
    app.listen(process.env.APP_PORT, () => console.log(`Listening on port ${process.env.APP_PORT} (${process.env.NODE_ENV})`));
  });

module.exports = app;
