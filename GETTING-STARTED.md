# Getting Started

Install Slouch:

```
$ npm install https://github.com/quitoman/slouch
```

Create an instance:

```js
var Slouch = require('couch-slouch');
var slouch = new Slouch('http://localhost:5984');
```

Create a database:

```js
slouch.db.create('mammals').then(function () {
  // Database was created
});
```

Create another database:

```js
slouch.db.create('reptiles').then(function () {
  // Database was created
});
```

Choose a database:

```js
slouch.doc.use('mammals');
```

Create a doc:

```js
slouch.doc.create({ name: 'beaver' }).then(function (doc) {
  // Doc was created in 'mammals' database
});
```

Create a doc in another database:

```js
slouch.doc.create({ name: 'chameleon' }, 'reptiles').then(function (doc) {
  // Doc was created in 'reptiles' database
});
```

Update the doc:

Note: `doc.id` and `doc.rev` are the values returned by `slouch.doc.create()` or `slouch.doc.get()`. You always need the `id` and latest `rev` when updating a doc.

```js
slouch.doc.update({ _id: doc.id, _rev: doc.rev, genus: 'castor' }).then(function (doc) {
  // Doc was updated, in 'mammals' database, and doc.id and doc.rev are populated
});
```

Get the doc:

```js
slouch.doc.get(doc._id).then(function (doc) {
  // doc is retrieved
});
```

Destroy (delete) the doc:

Note: `doc.id` and `doc.rev` are the values returned by `slouch.doc.create()` or `slouch.doc.get()`. You always need the `id` and latest `rev` when destroying a doc.

```js
slouch.doc.destroy(doc._id, doc._rev).then(function () {
  // Doc was destroyed
});
```

Destroy (delete) the database:

```js
slouch.db.destroy('reptiles').then(function () {
  // DB was destroyed
});
```




