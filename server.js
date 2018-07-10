const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'TTay',
    password: '',
    database: 'smart-brain'
  }
});

const app = express();

const database = {
  users: [
    {
      id: '123',
      name: 'Joen',
      email: 'joen@gmail.com',
      password: 'cookies',
      entries: 0,
      joined: new Date()
    },
    {
      id: '124',
      name: 'Kim',
      email: 'kim@gami.com',
      password: 'bananas',
      entries: 0,
      joined: new Date()
    }
  ]
};

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json(database.users);
});

app.post('/signin', (req, res) => {
  db('login')
    .select('*')
    .where({email: req.body.email})
    .then(user => {
      const isValid = bcrypt.compareSync(req.body.password, user[0].hash);
      if (isValid) {
        return db('users')
          .select('*')
          .where({email: user[0].email})
          .then(user => {
            res.json(user[0]);
          })
          .catch(err => res.status(400).json('Unable to get user'));
      } else {
        res.status(400).json('Wrong cradentail');
      }
    })
    .catch(err => res.status(400).json('Unable to get user'));
});

app.post('/register', (req, res) => {
  const {name, email, password} = req.body;
  const hash = bcrypt.hashSync(password);
  db
    .transaction(trx => {
      trx
        .insert({
          email,
          hash
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx
            .returning('*')
            .insert({
              name,
              email: loginEmail[0],
              joined: new Date()
            })
            .into('users')
            .then(user => {
              res.send(user[0]);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => res.status(400).json('Unable to register!'));
});

app.get('/profile/:id', (req, res) => {
  const {id} = req.params;
  let found = false;
  db
    .select('*')
    .where({id})
    .from('users')
    .then(user => {
      if (user[0]) {
        res.send(user[0]);
      } else {
        res.status(400).json('User cannot be found!');
      }
    })
    .catch(err => res.staus(400).json('Unable to read data from database!'));
});

app.put('/image', (req, res) => {
  const {id} = req.body;
  db('users')
    .returning('entries')
    .where({id})
    .increment('entries', 1)
    .then(user => {
      res.json(user[0]);
    })
    .catch(err => res.status(400).json('Unable to update entries'));
});

app.listen(3001, () => {
  console.log('This is runiing on port 3001');
});
