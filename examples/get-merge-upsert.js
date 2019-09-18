'use strict';

var Slouch = require('../');
var slouch = new Slouch('http://admin:admin@localhost:5984');

// Create the database
slouch.db.create('mydb').then(function () {

  // Create a doc
  return slouch.doc.create({ _id: '1', foo: 'bar' }, 'mydb');

}).then(function (doc) {

  // Add the `yar` attr to the doc and ignore any conflicts
  return slouch.doc.getMergeUpsert({ _id: '1', yar: 'nar' }, 'mydb');

}).then(function () {

  // Destroy the database
  return slouch.db.destroy('mydb');

}).then(function () {

  // Database was destroyed

});
