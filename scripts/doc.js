'use strict';

var Promise = require('sporks/scripts/promise');

var CouchPersistentStreamIterator = require('./couch-persistent-stream-iterator'),
  sporks = require('sporks'),
  Backoff = require('backoff-promise');

var Doc = function (slouch) {
  this._slouch = slouch;
};

// Max retries during an upsert before considering the operation a failure. The upserts immediately
// retry so if they fail this many times in a row then there is most likely an issue.
Doc.prototype.maxRetries = 20;

// If true, we'll try to automatically ignore any duplicate updates, updates that would not change
// any of the docs attributes. This of course means that a new revision would not be generated.
Doc.prototype.ignoreDuplicateUpdates = true;

Doc.prototype.ignoreConflict = function (promiseFactory) {
  var self = this;
  return promiseFactory().catch(function (err) {
    if (!self.isConflictError(err)) { // not a conflict?
      // Unexpected error
      throw err;
    }
  });
};

Doc.prototype.isMissingError = function (err) {
  return err.error === 'not_found';
};

Doc.prototype.isConflictError = function (err) {
  return err.error === 'conflict';
};

Doc.prototype.ignoreMissing = function (promiseFactory) {
  var self = this;
  return promiseFactory().catch(function (err) {
    if (!self.isMissingError(err)) { // not a not_found error?
      // Unexpected error
      throw err;
    }
  });
};

Doc.prototype.create = function (doc, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName),
    method: 'POST',
    json: doc
  }).then(function (response) {
    return response.body;
  });
};

Doc.prototype.createAndIgnoreConflict = function (doc, dbName = this._dbName) {
  var self = this;
  return self.ignoreConflict(function () {
    return self.create(doc, dbName);
  });
};

Doc.prototype.update = function (doc, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/' + encodeURIComponent(doc._id),
    method: 'PUT',
    body: JSON.stringify(doc),
    parseBody: true
  }).then(function (response) {
    // Return doc with updated rev so that callers like getMergeUpdate have an automatic way to get
    // the data that was update
    var clonedDoc = sporks.clone(doc);
    clonedDoc._rev = response.rev;
    return clonedDoc;
  });
};

Doc.prototype.updateIgnoreConflict = function (doc, dbName = this._dbName) {
  var self = this;
  return self.ignoreConflict(function () {
    return self.update(doc, dbName);
  });
};

Doc.prototype.get = function (docId, params, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/' + encodeURIComponent(
      docId),
    method: 'GET',
    qs: params,
    parseBody: true
  });
};

Doc.prototype.getIgnoreMissing = function (id, dbName = this._dbName) {
  var self = this;
  return self.ignoreMissing(function () {
    return self.get(id, dbName);
  });
};

Doc.prototype.exists = function (id, dbName = this._dbName) {
  return this.get(id, dbName).then(function () {
    return true;
  }).catch(function () {
    return false;
  });
};

// Compare the values of the docs without respect to the rev.
Doc.prototype._eqls = function (doc1, doc2) {
  var clonedDoc1 = sporks.clone(doc1),
    clonedDoc2 = sporks.clone(doc2);

  delete clonedDoc1._rev;
  delete clonedDoc2._rev;

  return sporks.isEqual(clonedDoc1, clonedDoc2);
};

Doc.prototype.updateOrIgnore = function (curDoc, newDoc, dbName = this._dbName) {
  // Wrap in promise so that errors are handled properly and always returns promise, even when the
  // docs are the same
  var self = this;
  return Promise.resolve().then(function () {
    // Are the docs the same? Should we ignore these updates?
    if (self._eqls(curDoc, newDoc) && self.ignoreDuplicateUpdates) {

      // Return doc so that response is standardized
      return newDoc;

    } else {

      return self.update(newDoc, dbName);

    }
  });
};

Doc.prototype.createOrUpdate = function (doc, dbName = this._dbName) {

  var self = this,
    clonedDoc = sporks.clone(doc);

  return self.get(doc._id, dbName).then(function (_doc) {

    // Use the latest rev so that we can attempt to update the doc without a conflict
    clonedDoc._rev = _doc._rev;

    return self.updateOrIgnore(_doc, clonedDoc, dbName);

  }).catch(function (err) {

    if (self.isMissingError(err)) { // missing? This can be expected on the first update

      // The doc is missing so we attempt to create the doc w/o a rev number
      return self.create(doc, dbName);

    } else {

      // Unexpected error
      throw err;

    }

  });
};

Doc.prototype.createOrUpdateIgnoreConflict = function (doc, dbName = this._dbName) {
  var self = this;
  return self.ignoreConflict(function () {
    return self.createOrUpdate(doc, dbName);
  });
};

// Provide a construct for mocking
Doc.prototype._newBackoff = function () {
  return new Backoff();
};

Doc.prototype._persistThroughConflicts = function (promiseFactory) {

  var self = this,
    i = 0;

  // Use an exponential backoff to prevent multiple ticks from competing with each other and
  // resulting in none of the ticks persisting through the conflict within the allotted number of
  // retries.
  var backoff = self._newBackoff();

  var run = function () {

    return backoff.attempt(function () {
      return promiseFactory();
    }).catch(function (err) {
      // Conflict and haven't reached max retries?
      if (self.isConflictError(err) && i++ < self.maxRetries) {
        // Attempt again
        return run();
      } else {
        throw err;
      }
    });

  };

  return run();
};

Doc.prototype.upsert = function (doc, dbName = this._dbName) {
  var self = this;
  return self._persistThroughConflicts(function () {
    return self.createOrUpdate(dbName, doc);
  });
};

Doc.prototype.getMergeUpdate = function (doc, dbName = this._dbName) {

  var self = this;

  return self.get(dbName, doc._id).then(function (_doc) {

    var clonedDoc = sporks.clone(_doc);

    clonedDoc = sporks.merge(clonedDoc, doc);

    return self.updateOrIgnore(dbName, _doc, clonedDoc);

  });
};

Doc.prototype.getMergeCreateOrUpdate = function (doc, dbName = this._dbName) {

  var self = this;

  return self.getIgnoreMissing(dbName, doc._id).then(function (_doc) {

    var clonedDoc = null;

    if (_doc) {
      clonedDoc = sporks.clone(_doc);
      clonedDoc = sporks.merge(clonedDoc, doc);
    } else {
      clonedDoc = sporks.clone(doc);
    }

    return self.createOrUpdate(dbName, clonedDoc);

  });
};

Doc.prototype.getMergeUpdateIgnoreConflict = function (doc, dbName = this._dbName) {
  var self = this;
  return self.ignoreConflict(function () {
    return self.getMergeUpdate(dbName, doc);
  });
};

Doc.prototype.getMergeUpsert = function (doc, dbName = this._dbName) {
  var self = this;
  return self._persistThroughConflicts(function () {
    return self.getMergeCreateOrUpdate(dbName, doc);
  });
};

Doc.prototype.getModifyUpsert = function (docId, onGetPromiseFactory, dbName = this._dbName) {
  var self = this;
  return self._persistThroughConflicts(function () {
    return self.get(dbName, docId).then(function (doc) {
      return onGetPromiseFactory(doc);
    }).then(function (modifiedDoc) {
      // TODO: we should probably build in a construct that allows modifiedDoc to be undefined and
      // in this case no update is made. This could then be used to ignore duplicate updates like
      // getMergeUpdate ignores duplicate updates.
      return self.update(dbName, modifiedDoc);
    });
  });
};

Doc.prototype.allArray = function (params, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_all_docs',
    method: 'GET',
    qs: params,
    parseBody: true
  });
};

// Use a JSONStream so that we don't have to load a large JSON structure into memory
Doc.prototype.all = function (params, dbName = this._dbName) {
  return new CouchPersistentStreamIterator({
    url: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_all_docs',
    method: 'GET',
    qs: params
  }, 'rows.*', null, this._slouch._request);
};

Doc.prototype.find = function (body, params, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_find',
    method: 'POST',
    json: body,
    qs: params,
    parseBody: true
  });
};

Doc.prototype.destroyAllNonDesign = function (dbName = this._dbName) {
  return this.destroyAll(dbName, true);
};

Doc.prototype.destroyAll = function (keepDesignDocs, dbName = this._dbName) {
  var self = this;

  return self.all(dbName).each(function (doc) {
    if (!keepDesignDocs || doc.id.indexOf('_design') === -1) {
      return self.destroy(dbName, doc.id, doc.value.rev);
    }
  });
};

Doc.prototype.destroy = function (docId, docRev, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/' + encodeURIComponent(
      docId),
    method: 'DELETE',
    qs: {
      rev: docRev
    },
    parseBody: true
  });
};

Doc.prototype.destroyIgnoreConflict = function (docId, docRev, dbName = this._dbName) {
  var self = this;
  return self.ignoreConflict(function () {
    return self.destroy(dbName, docId, docRev);
  });
};

Doc.prototype.getAndDestroy = function (docId, dbName = this._dbName) {
  var self = this;
  return self.get(dbName, docId).then(function (doc) {
    return self.destroy(dbName, docId, doc._rev);
  });
};

Doc.prototype.markAsDestroyed = function (docId, dbName = this._dbName) {
  return this.getMergeUpdate(dbName, {
    _id: docId,
    _deleted: true
  });
};

// Just for formalizing the setting of the _deleted flag
Doc.prototype.setDestroyed = function (doc) {
  doc._deleted = true;
};

Doc.prototype.bulkCreateOrUpdate = function (docs, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_bulk_docs',
    method: 'POST',
    json: {
      docs: docs
    },
    parseBody: true
  });
};

module.exports = Doc;
