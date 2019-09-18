## API Reference

 * attachment
   * get(docId, attachmentName, [dbName])
   * destroy(dbName, docId, attachmentName, rev, [dbName])
 * config
   * get(path)
   * set(path)
   * setCompactionRule(rule, [dbName])
   * setCouchDBMaxDBsOpen(maxDBsOpen)
   * setCouchHttpdAuthTimeout(timeoutSecs)
   * setCouchHttpdAuthAllowPersistentCookies(allow)
   * setLogLevel(level)
   * setHttpdMaxConnections(maxConnections)
   * unset(path)
   * unsetIgnoreMissing(path)
 * db
   * all()
   * [changes(params, filter, [dbName])](https://github.com/redgeoff/slouch/blob/master/API.md#changesdbname-params-filter)
   * [changesArray(params, filter, [dbName])](https://github.com/redgeoff/slouch/blob/master/API.md#changesarraydbname-params-filter)
   * copy(fromDBName, toDBName)
   * create(dbName)
   * use(dbName)
   * destroy(dbName)
   * exists(dbName)
   * replicate(params)
   * get([dbName])
   * view(viewDocId, view, params, [dbName])
   * viewArray(viewDocId, view, params, [dbName])
 * doc
   * all(params, [dbName])
   * allArray(params, [dbName])
   * bulkCreateOrUpdate(docs, [dbName])
   * create(doc, [dbName])
   * createAndIgnoreConflict(doc, [dbName])
   * createOrUpdate(doc, [dbName])
   * createOrUpdateIgnoreConflict(doc, [dbName])
   * destroy(docId, docRev, [dbName])
   * destroyAll(keepDesignDocs, [dbName])
   * destroyAllNonDesign([dbName])
   * destroyIgnoreConflict(docId, docRev, [dbName])
   * exists(id, [dbName])
   * [find(body, params, [dbName])](https://github.com/redgeoff/slouch/blob/master/API.md#finddbname-body-params)
   * get(docId, [dbName])
   * getAndDestroy(docId, [dbName])
   * getIgnoreMissing(id, [dbName])
   * getMergeCreateOrUpdate(doc, [dbName])
   * getMergeUpdate(doc, [dbName])
   * getMergeUpdateIgnoreConflict(doc, [dbName])
   * getMergeUpsert(doc, [dbName])
   * getModifyUpsert(docId, onGetPromiseFactory, [dbName])
   * ignoreConflict(promiseFactory)
   * ignoreMissing(promiseFactory)
   * isConflictError(err)
   * isMissingError(err)
   * markAsDestroyed(docId, [dbName])
   * setDestroyed(doc)
   * update(dbName, doc)
   * updateIgnoreConflict(doc, [dbName])
   * upsert(doc, [dbName])
 * ExcludeDesignDocIterator
 * membership
   * get()
 * NotAuthenticatedError
 * NotAuthorizedError
 * security
   * get([dbName])
   * onlyAdminCanView([dbName])
   * onlyRoleCanView(role, [dbName])
   * set(security, [dbName])
 * system
   * get()
   * isCouchDB1()
   * reset(exceptDBNames)
   * updates(params)
   * updatesNoHistory(params)
   * updatesViaGlobalChanges(params)
 * user
   * addRole(username, role)
   * authenticate(username, password)
   * authenticateAndGetSession(username, password)
   * authenticated(cookie)
   * create(username, password, roles, metadata)
   * createSession(doc)
   * destroy(username)
   * destroySession([cookie])
   * downsertRole(username, role)
   * get(username)
   * getSession([cookie], [url])
   * logIn(username, password)
   * logOut()
   * removeRole(username, role)
   * resolveConflicts(username)
   * setCookie(cookie)
   * setPassword(username, password)
   * setMetadata(username, metadata)
   * toUserId(username)
   * toUsername(userId)
   * upsertRole(username, role)

### DB

#### changes(params, filter, [dbName])

Returns a list of changes in the database. See https://docs.couchdb.org/en/stable/api/database/changes.html for more details.

The function returns an iterator that indefinitely returns changes from the database.

You can use an optional second argument to pass a selector for filtering the change feed.

Example:

```js
slouch.db.changes({
  include_docs: true,
  feed: 'continuous',
  heartbeat: true
}, {
  selector: {
    thing: 'findme'
  }
}, 'myDB');
```

You can use an optional third argument to pass a selector for filtering the change feed.

Example without specifying the database name:

```js
slouch.db.use('myDB');

slouch.db.changes({
  include_docs: true,
  feed: 'continuous',
  heartbeat: true
}, {
  selector: {
    thing: 'findme'
  }
});
```

#### changesArray(params, filter, [dbName])

Returns a list of changes in the database. See https://docs.couchdb.org/en/stable/api/database/changes.html for more details.

The function returns an array of changes from the database.

You can use an optional second argument to pass a selector for filtering the change feed.

Example:

```js
slouch.db.changesArray({
  include_docs: true,
  feed: 'continuous',
  heartbeat: true
}, {
  selector: {
    thing: 'findme'
  }
}, 'myDB');
```

### Doc

#### find(body, params, [dbName])

Find documents using a declarative JSON querying syntax. See https://docs.couchdb.org/en/latest/api/database/find.html for more details.

Example:

```js
slouch.doc.find({
  selector: {
    thing: 'findme'
  }
}, 'myDB');
```
