var Assert = require('assert'),
    Vows = require('vows'), // we need it to make sure `assert` got patched
    Helper = module.exports = {};


Helper.hasFunction = function (func) {
  return function (i18n) {
    Assert.isFunction(i18n[func], 'has ' + func + ' function');
  };
};


Helper.hasAlias = function (alias, original) {
  return function (i18n) {
    Assert.ok(i18n[original] === i18n[alias],
              alias + ' is alias of ' + original);
  };
};


Helper.hasProperty = function (prop) {
  return function (i18n) {
    Assert.include(i18n, prop, 'has ' + prop + ' property');
    Assert.isFalse('function' === typeof i18n[prop],
                   prop + ' is a scalar or getter');
  };
};
