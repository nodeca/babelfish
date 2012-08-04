// This is a "minimal" version of BabelFish used on client side ////////////////
////////////////////////////////////////////////////////////////////////////////


'use strict';


/*global window*/


// TODO: Provide shim for Underscore
var Underscore = (window || global)._;
var Pluralizer = require('./pluralizer');


// helpers
////////////////////////////////////////////////////////////////////////////////


function trim(str) {
  // cross-browser trim() function
  return String(str || '').replace(/^\s*|\s*$/mg, '');
}


// similar to Underscore.filter, but preserves keys of object
function filterObject(obj, iterator) {
  var data = {};

  Underscore.each(obj, function (val, key) {
    if (iterator(val, key)) {
      data[key] = val;
    }
  });

  return data;
}


function parseScope(scope) {
  var chunks, parts = {key: null, chunks: []};

  chunks = scope.split('.');

  // get key and make sure we are not dealing with empty key, e.g. `foo.`
  while (!parts.key && !!chunks.length) {
    parts.key = trim(chunks.pop());
  }

  // empty scope given `` or `.`, or `..` etc.
  if (!parts.key) {
    throw new TypeError('Invalid scope');
  }

  // filter chunks that left
  chunks.forEach(function (chunk) {
    chunk = trim(chunk);
    if (!!chunk) {
      parts.chunks.push(chunk);
    }
  });

  return parts;
}


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
    if ('object' === typeof val) {
      Underscore.each(flattenParams(val), function (sub_val, sub_key) {
        params[key + '.' + sub_key] = sub_val;
      });
      return;
    }

    params[key] = val.toString();
  });

  return params;
}


// Iterator for Underscore.filter to leave non-scopes only
function flatStorageFilter(val) {
  return 'object' !== val.type;
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


/**
 *  new BabelFish(storage)
 **/
function BabelFish(storage) {
  // storage of compiled translations
  this._storage = storage;
}


// public api (instance)
////////////////////////////////////////////////////////////////////////////////


/**
 *  BabelFish#translate(locale, scope[, params]) -> String
 *  - locale (String): Locale of translation
 *  - scope (String): Full phrase path, e.g. `app.forums.replies_count`
 *  - params (Object): Params for translation
 *
 *  ##### Example
 *
 *      i18n.addPhrase('ru-RU',
 *        'apps.forums.replies_count',
 *        '#{count} %{ответ|ответа|ответов}:count в теме');
 *
 *      // ...
 *
 *      i18n.translate('ru-RU', 'app.forums.replies_count', {count: 1});
 *      // -> '1 ответ'
 *
 *      i18n.translate('ru-RU', 'app.forums.replies_count', {count: 2});
 *      // -> '2 ответa'
 **/
BabelFish.prototype.translate = function translate(locale, scope, params) {
  var translator = this.getCompiledData(locale, scope);

  if (!translator) {
    return locale + ': No translation for <' + scope + '>';
  }

  switch (translator.type) {
  case 'string': return translator.value;
  case 'function':
    return translator.value.call({
      flattenParams: flattenParams,
      pluralize: Pluralizer
    }, params);
  default: return 'Invalid scope usage: ' + scope;
  }
};


/** alias of: BabelFish#translate
 *  BabelFish#t(locale, scope[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


//  internal
//  BabelFish#getCompiledData(locale, scope[, options]) -> Object
//  BabelFish#getCompiledData(locale) -> Object
//  - locale (String): Locale of translation
//  - scope (String): Full phrase path, e.g. `app.forums.replies_count`
//  - options (Object): Params for translation
//
//  Returns compiled "translator" (if `scope` points phrase) or nested scope
//  of translators. Each value of hash is an object with fields:
//
//  - **type** _(String)_
//    - _string_:     Simple translation (contains no substitutions)
//    - _function_:   Translation with macroses
//    - _object_:     Nested scope of translations
//
//  - **locale** _(String|Null)_
//    Locale of translation. It can differ from requested locale in case when
//    translation was taken from fallback locale.
//    `Null`, when `type` is `object`.
//
//  - **value** _(String|Function|Object)_
//
//
//  ##### Options
//
//  - **deep** _(Boolean, Default: true)_
//    Whenever return nested translations.
BabelFish.prototype.getCompiledData = function getCompiledData(locale, scope, options) {
  var storage, parts;

  options = options || {};
  storage = getLocaleStorage(this, locale);

  // requested FULL storage
  if (!scope) {
    return storage;
  }

  parts = parseScope(scope);

  parts.chunks.forEach(function (scope_key) {
    if (storage && storage[scope_key] && 'object' === storage[scope_key].type) {
      storage = storage[scope_key].value;
      return;
    }

    // skip any further searchings
    storage = null;
  });

  // unknown translation
  if (!storage || !storage[parts.key]) {
    return null;
  }

  // if we got translation, or scope and deep copy requested,
  // return copy of the object from storage
  if ('object' !== storage[parts.key].type || false !== options.deep) {
    return Underscore.extend({}, storage[parts.key]);
  }

  // we got scope and return flat copy of storage is requested
  return {
    type: 'object',
    locale: null,
    value: filterObject(storage[parts.key].value, flatStorageFilter)
  };
};


// export module
module.exports = BabelFish;
