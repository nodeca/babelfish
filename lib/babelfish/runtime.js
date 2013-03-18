// This is a "minimal" version of BabelFish used on client side ////////////////
////////////////////////////////////////////////////////////////////////////////


'use strict';


var Pluralizer = require('./pluralizer');


////////////////////////////////////////////////////////////////////////////////
// The following utility (forEach) is modified from Underscore
//
// http://underscorejs.org
//
// (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//
// Underscore may be freely distributed under the MIT license
////////////////////////////////////////////////////////////////////////////////


var nativeForEach = Array.prototype.forEach;


// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
function forEach(obj, iterator, context) {
  if (obj === null) {
    return;
  }
  if (nativeForEach && obj.forEach === nativeForEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (var i = 0, l = obj.length; i < l; i += 1) {
      iterator.call(context, obj[i], i, obj);
    }
  } else {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        iterator.call(context, obj[key], key, obj);
      }
    }
  }
}


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

  forEach(obj || {}, function (val, key) {
    if (val && 'object' === typeof val) {
      forEach(flattenParams(val), function (sub_val, sub_key) {
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
