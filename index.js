require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns = require('dns');
const { log } = require('console');
const mongoose = require('mongoose');

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

const options = {
  all: true
};

const urlSchema = mongoose.Schema({
  'original_url': {
    type: String,
    unique: true
  },
  'short_url': {
    type: Number,

  }
});

let URLModel = mongoose.model('URLModel', urlSchema);
let shortEntry = 0;

app.post('/api/shorturl', (req, res) => {
  console.log(req.body.url);

  let url = JSON.stringify(req.body.url).substring(1, JSON.stringify(req.body.url).length - 1);
  console.log(url);
  if (!url.startsWith('http', 0)) {
    res.json({ 'error': 'Invalid URL' });
  } else {
    const surl = new URL(url);
    dns.lookup(surl.hostname, options, (err, address) => {
      if (err) {
        console.log('error', err);
      } else {
        URLModel.findOne({ 'original_url': req.body.url }).then(value => {
          if (!value) {
            let urlToShort = URLModel({ 'original_url': req.body.url, 'short_url': shortEntry++ });
            urlToShort.save().then(v=> {
              res.json({
                'original_url': v.original_url,
                'short_url': v.short_url
              });
            });


          } else {
            res.json({
            'original_url': value.original_url,
            'short_url': value.short_url
          });}
        });
      }
    });
  }

});

app.get('/api/shorturl/:url_id', (req, res) => {
  const id = req.params.url_id;

  URLModel.findOne({ 'short_url': id }).then(value => {
    if (!value) {
      res.send({
        'error': 'No short URL found for the given input'
      });
    } else {

      const originalUrl = value['original_url'];
      console.log('original', originalUrl);

      res.redirect(originalUrl);

    }
  })
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
