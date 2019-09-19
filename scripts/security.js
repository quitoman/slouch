'use strict';

var Security = function (slouch) {
  this._slouch = slouch;
};

// For example:
// {
//   "admins" : {
//      "names" : ["joe", "phil"],
//      "roles" : ["boss"]
//    },
//    "members" : {
//      "names" : ["dave"],
//      "roles" : ["producer", "consumer"]
//    }
// }
Security.prototype.set = function (security, dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_security',
    method: 'PUT',
    body: JSON.stringify(security)
  });
};

Security.prototype.get = function (dbName = this._dbName) {
  return this._slouch._req({
    uri: this._slouch._url + '/' + encodeURIComponent(dbName) + '/_security',
    method: 'GET',
    parseBody: true
  });
};

Security.prototype.onlyRoleCanView = function (role, dbName = this._dbName) {
  return this.set({
    admins: {
      names: ['_admin'],
      roles: []
    },
    members: {
      names: [],
      roles: [role]
    }
  }, dbName);
};

Security.prototype.onlyUserCanView = function (user, dbName = this._dbName) {
  return this.set({
    admins: {
      names: ['_admin'],
      roles: []
    },
    members: {
      names: [user],
      roles: []
    }
  }, dbName);
};

Security.prototype.onlyAdminCanView = function (dbName = this._dbName) {
  return this.onlyRoleCanView('_admin', dbName);
};

module.exports = Security;
