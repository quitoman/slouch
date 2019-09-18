'use strict';

var Slouch = require('../');
var slouch = new Slouch('http://admin:admin@localhost:5984');

// Create the database
slouch.db.create('mydb').then(function () {

  // Create a doc
  return slouch.doc.create({ foo: 'bar' }, 'mydb');

}).then(function (doc) {

  // Update the doc
  return slouch.doc.update({ _id: doc.id, _rev: doc.rev, foo: 'yar' }, 'mydb');

}).then(function (doc) {

  // Get the doc
  return slouch.doc.get(doc._id, 'mydb');

}).then(function (doc) {

  // Destroy the doc
  return slouch.doc.destroy(doc._id, doc._rev, 'mydb');

}).then(function () {

  // Destroy the database
  return slouch.db.destroy('mydb');

}).then(function () {

  // Database was destroyed

});
