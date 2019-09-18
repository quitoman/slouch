'use strict';

var Slouch = require('../');
var slouch = new Slouch('http://admin:admin@localhost:5984');

var Throttler = require('squadron').Throttler;
var throttler = new Throttler(5);

// Create the database
slouch.db.create('mydb').then(function () {

  // Create a doc
  return slouch.doc.create({ foo: 'bar' }, 'mydb');

}).then(function () {

  // Create another doc
  return slouch.doc.create({ foo: 'nar' }, 'mydb');

}).then(function () {

  return slouch.doc.all({ include_docs: true }, 'mydb').each(function (item) {

    return Promise.resolve('foo => ' + item.foo);

  }, throttler).then(function () {

    // Done iterating through all docs

  });

});
