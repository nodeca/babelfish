/**
 *  class BabelFish
 *
 *  Internalization and localization library that makes i18n and l10n fun again.
 *
 *  ##### Example
 *
 *  ```javascript
 *  var BabelFish = require('babelfish'),
 *      i18n = new BabelFish();
 *  ```
 *
 *  or
 *
 *  ```javascript
 *  var babelfish = require('babelfish'),
 *      i18n = babelfish();
 *  ```
 **/


'use strict';


var parser = require('./parser');
var plural = require('plurals-cldr');

function _class(obj) { return Object.prototype.toString.call(obj); }

function isString(obj)   { return _class(obj) === '[object String]'; }
function isNumber(obj)   { return !isNaN(obj) && isFinite(obj); }
function isBoolean(obj)  { return obj === true || obj === false; }
function isFunction(obj) { return _class(obj) === '[object Function]'; }
function isObject(obj)   { return _class(obj) === '[object Object]'; }

var isArray = Array.isArray || function _isArray(obj) {
  return _class(obj) === '[object Array]';
};


////////////////////////////////////////////////////////////////////////////////
// The following two utilities (forEach and extend) are modified from Underscore
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


var formatRegExp = /%[sdj%]/g;

function format(f) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') { return '%'; }
    if (i >= len) { return x; }
    switch (x) {
      case '%s':
        return String(args[i++]);
      case '%d':
        return Number(args[i++]);
      case '%j':
        return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  return str;
}


// helpers
////////////////////////////////////////////////////////////////////////////////


// Last resort locale, that exists for sure
var GENERIC_LOCALE = 'en';


// flatten(obj) -> Object
//
// Flattens object into one-level dictionary.
//
// ##### Example
//
//     var obj = {
//       abc: { def: 'foo' },
//       hij: 'bar'
//     };
//
//     flatten(obj);
//     // -> { 'abc.def': 'foo', 'hij': 'bar' };
//
function flatten(obj) {
  var params = {};

  forEach(obj || {}, function (val, key) {
    if (val && typeof val === 'object') {
      forEach(flatten(val), function (sub_val, sub_key) {
        params[key + '.' + sub_key] = sub_val;
      });
      return;
    }

    params[key] = val;
  });

  return params;
}


var keySeparator = '#@$';

function makePhraseKey(locale, phrase) {
  return locale + keySeparator + phrase;
}


function searchPhraseKey(self, locale, phrase) {
  var key = makePhraseKey(locale, phrase);
  var storage = self._storage;

  // direct search first
  if (storage.hasOwnProperty(key)) { return key; }

  // don't try follbacks for default locale
  if (locale === self._defaultLocale) { return null; }

  // search via fallback map cache
  var fb_cache = self._fallbacks_cache;
  if (fb_cache.hasOwnProperty(key)) { return fb_cache[key]; }

  // scan fallbacks & cache result
  var fb = self._fallbacks[locale] || [ self._defaultLocale ];
  var fb_key;

  for (var i = 0, l = fb.length; i < l; i++) {
    fb_key = makePhraseKey(fb[i], phrase);
    if (storage.hasOwnProperty(fb_key)) {
      // found - update cache and return result
      fb_cache[key] = fb_key;
      return fb_cache[key];
    }
  }

  // mark fb_cache entry empty for fast lookup on next request
  fb_cache[key] = null;
  return null;
}


function pluralizer(lang, val, forms) {
  var idx = plural.indexOf(lang, val);

  if (idx === -1) {
    return format('[pluralizer for "%s" locale not found]', lang);
  }

  if (typeof forms[idx] === 'undefined') {
    return format('[plural form %d ("%s") not found in translation]',
                      idx, plural.forms(lang)[idx]);
  }

  return forms[idx];
}

// public api (module)
////////////////////////////////////////////////////////////////////////////////


/**
 *  new BabelFish([defaultLocale = 'en'])
 *
 *  Initiates new instance of BabelFish.
 *
 *  __Note!__ you can omit `new` for convenience, direct call will return
 * new instance too.
 **/
function BabelFish(defaultLocale) {
  if (!(this instanceof BabelFish)) { return new BabelFish(defaultLocale); }

  this._defaultLocale = defaultLocale ? String(defaultLocale) : GENERIC_LOCALE;

  // hash of locale => [ fallback1, fallback2, ... ] pairs
  this._fallbacks = {};

  // fallback cache for each phrase
  //
  // {
  //   locale_key: fallback_key
  // }
  //
  // fallback_key can be null if search failed
  //
  this._fallbacks_cache = {};

  // storage of compiled translations
  //
  // {
  //   locale + @#$ + phrase_key: {
  //     locale:      locale name - can be different for fallbacks
  //     translation: original translation phrase or data variable/object
  //     raw:         true/false - does translation contain plain data or
  //                  string to compile
  //     compiled:    copiled translation fn or plain string
  //   }
  //   ...
  // }
  //
  this._storage = {};

  // cache for complex plural parts (with params)
  //
  // {
  //   language: new BabelFish(language)
  // }
  //
  this._plurals_cache = {};
}


// public api (instance)
////////////////////////////////////////////////////////////////////////////////


/**
 *  BabelFish#addPhrase(locale, phrase, translation [, flattenLevel]) -> BabelFish
 *  - locale (String): Locale of translation
 *  - phrase (String|Null): Phrase ID, e.g. `apps.forum`
 *  - translation (String|Object|Array|Number|Boolean): Translation or an object
 *    with nested phrases, or a pure object.
 *  - flattenLevel (Number|Boolean): Optional, 0..infinity. `Infinity` by default.
 *    Define "flatten" deepness for loaded object.  You can also use
 *    `true` as `0` or `false` as `Infinity`.
 *
 *
 *  ##### Flatten & using JS objects
 *
 *  By default all nested properties are normalized to strings like "foo.bar.baz",
 *  and if value is string, it will be compiled with babelfish notation.
 *  If deepness is above `flattenLevel` OR value is not object and not string,
 *  it will be used "as is". Note, only JSON stringifiable data should be used.
 *
 *  In short: you can safely pass `Array`, `Number` or `Boolean`. For objects you
 *  should define flatten level or disable it compleetely, to work with pure data.
 *
 *  Pure objects can be useful to prepare bulk data for external libraries, like
 *  calendars, time/date generators and so on.
 *
 *  ##### Example
 *
 *  ```javascript
 *  i18n.addPhrase('ru-RU',
 *    'apps.forums.replies_count',
 *    '#{count} %{ответ|ответа|ответов}:count в теме');
 *
 *  // equals to:
 *  i18n.addPhrase('ru-RU',
 *    'apps.forums',
 *    { replies_count: '#{count} %{ответ|ответа|ответов}:count в теме' });
 *  ```
 **/
BabelFish.prototype.addPhrase = function _addPhrase(locale, phrase, translation, flattenLevel) {
  var self = this, fl;

  // Calculate flatten level. Infinity by default
  if (isBoolean(flattenLevel)) {
    fl = flattenLevel ? Infinity : 0;
  } else if (isNumber(flattenLevel)) {
    fl = Math.floor(flattenLevel);
    fl = (fl < 0) ? 0 : fl;
  } else {
    fl = Infinity;
  }

  if (isObject(translation) && (fl > 0)) {
    // recursive object walk, until flattenLevel allows
    forEach(translation, function (val, key) {
      self.addPhrase(locale, phrase + '.' + key, val, fl - 1);
    });
    return;
  }

  if (isString(translation)) {
    this._storage[makePhraseKey(locale, phrase)] = {
      translation: translation,
      locale: locale,
      raw: false
    };
  } else if (isArray(translation) ||
             isNumber(translation) ||
             isBoolean(translation) ||
             (fl === 0 && isObject(translation))) {
    // Pure objects are stored without compilation
    // Limit allowed types.
    this._storage[makePhraseKey(locale, phrase)] = {
      translation: translation,
      locale: locale,
      raw: true
    };
  } else {
    // `Regex`, `Date`, `Uint8Array` and others types will
    //  fuckup `stringify()`. Don't allow here.
    // `undefined` also means wrong param in real life.
    // `null` can be allowed when examples from real life available.
    throw new TypeError('Invalid translation - [String|Object|Array|Number|Boolean] expected.');
  }

  self._fallbacks_cache = {};
};


/**
 *  BabelFish#setFallback(locale, fallbacks) -> BabelFish
 *  - locale (String): Target locale
 *  - fallbacks (Array): List of fallback locales
 *
 *  Set fallbacks for given locale.
 *
 *  When `locale` has no translation for the phrase, `fallbacks[0]` will be
 *  tried, if translation still not found, then `fallbacks[1]` will be tried
 *  and so on. If none of fallbacks have translation,
 *  default locale will be tried as last resort.
 *
 *  ##### Errors
 *
 *  - throws `Error`, when `locale` equals default locale
 *
 *  ##### Example
 *
 *  ```javascript
 *  i18n.setFallback('ua-UK', ['ua', 'ru']);
 *  ```
 **/
BabelFish.prototype.setFallback = function _setFallback(locale, fallbacks) {
  var def = this._defaultLocale;

  if (def === locale) {
    throw new Error("Default locale can't have fallbacks");
  }

  var fb = isArray(fallbacks) ? fallbacks.slice() : [ fallbacks ];
  if (fb[fb.length - 1] !== def) { fb.push(def); }

  this._fallbacks[locale] = fb;
  this._fallbacks_cache = {};
};


// Compiles given string into function. Used to compile phrases,
// which contains `plurals`, `variables`, etc.
function compile(self, str, locale) {
  var nodes, buf, key, strict_exec, forms_exec, plurals_cache;

  // Quick check to avoid parse in most cases :)
  if (str.indexOf('#{') === -1 &&
      str.indexOf('((') === -1 &&
      str.indexOf('\\') === -1) {
    return str;
  }

  nodes = parser.parse(str);

  if (nodes.length === 1 && nodes[0].type === 'literal') {
    return nodes[0].text;
  }

  // init cache instance for plural parts, if not exists yet.
  if (!self._plurals_cache[locale]) {
    self._plurals_cache[locale] = new BabelFish(locale);
  }
  plurals_cache = self._plurals_cache[locale];

  buf = [];
  buf.push([ 'var str = "", strict, strict_exec, forms, forms_exec, plrl, cache, loc, loc_plzr, anchor;' ]);
  buf.push('params = flatten(params);');

  forEach(nodes, function (node) {
    if (node.type === 'literal') {
      buf.push(format('str += %j;', node.text));
      return;
    }

    if (node.type === 'variable') {
      key = node.anchor;
      buf.push(format(
        'str += ("undefined" === typeof (params[%j])) ? "[missed variable: %s]" : params[%j];',
        key, key, key
      ));
      return;
    }

    if (node.type === 'plural') {
      key = node.anchor;
      // check if plural parts are plain strings or executable,
      // and add executable to "cache" instance of babelfish
      // plural part text will be used as translation key
      strict_exec = {};
      forEach(node.strict, function (text, key) {
        if (text === '') {
          strict_exec[key] = false;
          return;
        }
        var parsed = parser.parse(text);
        if (parsed.length === 1 && parsed[0].type === 'literal') {
          strict_exec[key] = false;
          // patch with unescaped value for direct extract
          node.strict[key] = parsed[0].text;
          return;
        }

        strict_exec[key] = true;
        if (!plurals_cache.hasPhrase(locale, text, true)) {
          plurals_cache.addPhrase(locale, text, text);
        }
      });

      forms_exec = {};
      forEach(node.forms, function (text, idx) {
        if (text === '') {
          forms_exec[''] = false;
          return;
        }
        var parsed = parser.parse(text), unescaped;
        if (parsed.length === 1 && parsed[0].type === 'literal') {
          // patch with unescaped value for direct extract
          unescaped = parsed[0].text;
          node.forms[idx] = unescaped;
          forms_exec[unescaped] = false;
          return;
        }

        forms_exec[text] = true;
        if (!plurals_cache.hasPhrase(locale, text, true)) {
          plurals_cache.addPhrase(locale, text, text);
        }
      });
      /*eslint-disable space-in-parens*/
      buf.push(format('loc = %j;', locale));
      buf.push(format('loc_plzr = %j;', locale.split(/[-_]/)[0]));
      buf.push(format('anchor = params[%j];', key));
      buf.push(format('cache = this._plurals_cache[loc];'));
      buf.push(format('strict = %j;', node.strict));
      buf.push(format('strict_exec = %j;', strict_exec));
      buf.push(format('forms = %j;', node.forms));
      buf.push(format('forms_exec = %j;', forms_exec));
      buf.push(       'if (+(anchor) != anchor) {');
      buf.push(format('  str += "[invalid plurals amount: %s(" + anchor + ")]";', key));
      buf.push(       '} else {');
      buf.push(       '  if (strict[anchor] !== undefined) {');
      buf.push(       '    plrl = strict[anchor];');
      buf.push(       '    str += strict_exec[anchor] ? cache.t(loc, plrl, params) : plrl;');
      buf.push(       '  } else {');
      buf.push(       '    plrl = pluralizer(loc_plzr, +anchor, forms);');
      buf.push(       '    str += forms_exec[plrl] ? cache.t(loc, plrl, params) : plrl;');
      buf.push(       '  }');
      buf.push(       '}');
      return;
    }

    // should never happen
    throw new Error('Unknown node type');
  });

  buf.push('return str;');

  /*eslint-disable no-new-func*/
  return new Function('params', 'flatten', 'pluralizer', buf.join('\n'));
}


/**
 *  BabelFish#translate(locale, phrase[, params]) -> String
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
 *  - params (Object|Number|String): Params for translation. `Number` & `String`
 *    will be  coerced to `{ count: X, value: X }`
 *
 *  ##### Example
 *
 *  ```javascript
 *  i18n.addPhrase('ru-RU',
 *     'apps.forums.replies_count',
 *     '#{count} ((ответ|ответа|ответов)) в теме');
 *
 *  // ...
 *
 *  i18n.translate('ru-RU', 'app.forums.replies_count', { count: 1 });
 *  i18n.translate('ru-RU', 'app.forums.replies_count', 1});
 *  // -> '1 ответ'
 *
 *  i18n.translate('ru-RU', 'app.forums.replies_count', { count: 2 });
 *  i18n.translate('ru-RU', 'app.forums.replies_count', 2);
 *  // -> '2 ответa'
 *  ```
 **/
BabelFish.prototype.translate = function _translate(locale, phrase, params) {
  var key = searchPhraseKey(this, locale, phrase);
  var data;

  if (!key) {
    return locale + ': No translation for [' + phrase + ']';
  }

  data = this._storage[key];

  // simple string or other pure object
  if (data.raw) { return data.translation; }

  // compile data if not done yet
  if (!data.hasOwnProperty('compiled')) {
    // We should use locale from phrase, because of possible fallback,
    // to keep plural locales in sync.
    data.compiled = compile(this, data.translation, data.locale);
  }

  // return simple string immediately
  if (!isFunction(data.compiled)) {
    return data.compiled;
  }

  //
  // Generate "complex" phrase
  //

  // Sugar: coerce numbers & strings to { count: X, value: X }
  if (isNumber(params) || isString(params)) {
    params = { count: params, value: params };
  }

  return data.compiled.call(this, params, flatten, pluralizer);
};


/**
 *  BabelFish#hasPhrase(locale, phrase) -> Boolean
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
 *  - noFallback (Boolean): Disable search in fallbacks
 *
 *  Returns whenever or not there's a translation of a `phrase`.
 **/
BabelFish.prototype.hasPhrase = function _hasPhrase(locale, phrase, noFallback) {
  return noFallback ?
    this._storage.hasOwnProperty(makePhraseKey(locale, phrase))
  :
    searchPhraseKey(this, locale, phrase) ? true : false;
};


/** alias of: BabelFish#translate
 *  BabelFish#t(locale, phrase[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


/**
 *  BabelFish#stringify(locale) -> String
 *  - locale (String): Locale of translation
 *
 *  Returns serialized locale data, uncluding fallbacks.
 *  It can be loaded back via `load()` method.
 **/
BabelFish.prototype.stringify = function _stringify(locale) {
  var self = this;

  // Collect unique keys
  var unique = {};

  forEach(this._storage, function (val, key) {
    unique[key.split(keySeparator)[1]] = true;
  });

  // Collect phrases (with fallbacks)
  var result = {};

  forEach(unique, function(val, key) {
    var k = searchPhraseKey(self, locale, key);
    // if key was just a garbage from another
    // and doesn't fit into fallback chain for current locale - skip it
    if (!k) { return; }
    // create namespace if not exists
    var l = self._storage[k].locale;
    if (!result[l]) { result[l] = {}; }
    result[l][key] = self._storage[k].translation;
  });

  // Get fallback rule. Cut auto-added fallback to default locale
  var fallback = (self._fallbacks[locale] || []).pop();

  return JSON.stringify({

    fallback: { locale: fallback },
    locales: result
  });
};


/**
 *  BabelFish#load(data)
 *  - data (Object|String) - data from `stringify()` method, as object or string.
 *
 *  Batch load phrases data, prepared with `stringify()` method.
 *  Useful at browser side.
 **/
BabelFish.prototype.load = function _load(data) {
  var self = this;

  if (isString(data)) { data = JSON.parse(data); }

  forEach(data.locales, function (phrases, locale) {
    forEach(phrases, function(translation, key) {
      self.addPhrase(locale, key, translation, 0);
    });
  });

  forEach(data.fallback, function (rule, locale) {
    if (rule.length) { self.setFallback(locale, rule); }
  });
};

// export module
module.exports = BabelFish;
