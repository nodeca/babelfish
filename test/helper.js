var assert = require('assert'),
    vows = require('vows'), // we need it to make sure `assert` got patched
    helper = module.exports = {};


helper.hasFunction = function (func) {
  return function (i18n) {
    assert.isFunction(i18n[func], 'has ' + func + ' function');
  };
};


helper.hasAlias = function (alias, original) {
  return function (i18n) {
    assert.ok(i18n[original] === i18n[alias],
              alias + ' is alias of ' + original);
  };
};


helper.hasProperty = function (prop) {
  return function (i18n) {
    assert.include(i18n, prop, 'has ' + prop + ' property');
    assert.isFalse('function' === typeof i18n[prop],
                   prop + ' is a scalar or getter');
  };
};
