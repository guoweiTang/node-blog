let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/myblogs');

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});
module.exports = router;
