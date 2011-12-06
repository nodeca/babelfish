var common = module.exports = {};


common.merge = function merge(receiver) {
  receiver = receiver || {};
  
  Array.prototype.slice.call(arguments, 1).forEach(function (transmitter) {
    if (!!transmitter) {
      Object.getOwnPropertyNames(transmitter).forEach(function (k) {
        receiver[k] = transmitter[k];
      });
    }
  });

  return receiver;
};


common.clone = function clone(obj) {
  return (Array.isArray(obj)) ? obj.slice() : common.merge({}, obj);
};


common.each = function each(obj, iterator) {
  Object.getOwnPropertyNames(obj).forEach(function (key) {
    iterator(obj[key], key);
  });
};


common.filter = function filter(obj, test) {
  var result = {};

  common.each(obj, function (val, key) {
    if (test(val, key)) {
      result[key] = val;
    }
  });

  return result;
};
