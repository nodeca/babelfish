// This is a "minimal" version of BabelFish used on client side ////////////////
////////////////////////////////////////////////////////////////////////////////


'use strict';


/*global window*/


// TODO: Provide shim for Underscore
var Underscore = (window || global)._;
var Pluralizer = require('./pluralizer');


// helpers
////////////////////////////////////////////////////////////////////////////////


//  flattenParams(obj) -> Object
//
//  Flattens object into one-level distionary.
//
//  ##### Example
//
//      var obj = {
//        abc: { def: 'foo' },
//        hij: 'bar'
//      };
//
//      flattenParams(obj);
//      // -> { 'abc.def': 'foo', 'hij': 'bar' };
function flattenParams(obj) {
  var params = {};

  Underscore.each(obj || {}, function (val, key) {
    if (val && 'object' === typeof val) {
      Underscore.each(flattenParams(val), function (sub_val, sub_key) {
        params[key + '.' + sub_key] = sub_val;
      });
      return;
    }

    params[key] = val;
  });

  return params;
}


// Returns locale storage. Creates one if needed
function getLocaleStorage(self, locale) {
  if (undefined === self._storage[locale]) {
    self._storage[locale] = {};
  }

  return self._storage[locale];
}


// public api (module)
////////////////////////////////////////////////////////////////////////////////


function BabelFish(storage) {
  // storage of compiled translations
  this._storage = storage;
}


// public api (instance)
////////////////////////////////////////////////////////////////////////////////


BabelFish.prototype.translate = function translate(locale, phrase, params) {
  var translator  = this.getCompiledData(locale, phrase);

  if ('string' === translator.type) {
    return String(translator.translation);
  }

  if ('function' === translator.type) {
    return translator.translation.call({
      flattenParams: flattenParams,
      pluralize: Pluralizer
    }, params);
  }

  return locale + ': No translation for [' + phrase + ']';
};


BabelFish.prototype.hasPhrase = function hasPhrase(locale, phrase) {
  var translator  = this.getCompiledData(locale, phrase);
  return 'string' === translator.type || 'function' === translator.type;
};


BabelFish.prototype.t = BabelFish.prototype.translate;


BabelFish.prototype.getCompiledData = function getCompiledData(locale, phrase) {
  var storage = getLocaleStorage(this, locale);

  // requested FULL storage
  if (!phrase) {
    return storage;
  }

  return storage[phrase] || {};
};


// export module
module.exports = BabelFish;
