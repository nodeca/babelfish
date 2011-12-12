'use strict';


var Common = module.exports = {};


Common.merge = function merge(receiver) {
  receiver = receiver || {};

  Array.prototype.slice.call(arguments, 1).forEach(function (transmitter) {
    if (!!transmitter && 'object' === typeof transmitter) {
      Object.getOwnPropertyNames(transmitter).forEach(function (k) {
        receiver[k] = transmitter[k];
      });
    }
  });

  return receiver;
};


Common.clone = function clone(obj) {
  return (Array.isArray(obj)) ? obj.slice() : Common.merge({}, obj);
};


Common.each = function each(obj, iterator) {
  Object.getOwnPropertyNames(obj).forEach(function (key) {
    iterator(obj[key], key);
  });
};


// returns copy of `obj` with pairs that pass given test
Common.filter = function filter(obj, test) {
  var result = {};

  Common.each(obj, function (val, key) {
    if (test(val, key)) {
      result[key] = val;
    }
  });

  return result;
};
