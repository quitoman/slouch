'use strict';

var NotAuthorizedError = function (message) {
  this.name = 'NotAuthorizedError';
  this.message = message;
  this.statusCode = 401 //fork
};

NotAuthorizedError.prototype = Object.create(Error.prototype);
NotAuthorizedError.prototype.constructor = NotAuthorizedError;

module.exports = NotAuthorizedError;
