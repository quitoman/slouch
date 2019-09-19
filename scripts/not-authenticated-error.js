'use strict';

var NotAuthenticatedError = function (message) {
  this.name = 'NotAuthenticatedError';
  this.message = message;
  this.statusCode = 401;
};

NotAuthenticatedError.prototype = Object.create(Error.prototype);
NotAuthenticatedError.prototype.constructor = NotAuthenticatedError;

module.exports = NotAuthenticatedError;
