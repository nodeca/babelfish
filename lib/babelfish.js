/**
 *  class BabelFish
 *
 *  Internalization and localization library that makes i18n and l10n fun again.
 *
 *  ##### Example
 *
 *      var BabelFish = require('babelfish'),
 *          i18n = new BabelFish();
 **/


'use strict';


var parser = require('./babelfish/parser');
var pluralizer = require('./babelfish/pluralizer');

function _class(obj) { return Object.prototype.toString.call(obj); }

function isString(obj)   { return _class(obj) === '[object String]'; }
function isNumber(obj)   { return _class(obj) === '[object Number]'; }
function isBoolean(obj)  { return _class(obj) === '[object Boolean]'; }
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


// Extend a given object with all the properties in passed-in object(s).
function extend(obj) {
  forEach(Array.prototype.slice.call(arguments, 1), function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
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


// Merge several continuous `literal` nodes together
function redistribute(ast) {
  var nodes = [], last = {};

  forEach(ast, function (node) {
    if ('literal' === last.type && 'literal' === node.type) {
      last.text += node.text;
      return;
    }

    nodes.push(node);
    last = node;
  });

  return nodes;
}


// Compiles given string into translator function. Used to compile phrases,
// which contains `plurals`, `variables`, etc.
function compile(str, locale) {
  var nodes, lang, translator;

  // Quick check to avoid parse in most cases :)
  if (str.indexOf('#{') === -1 && str.indexOf('((') === -1) {
    return str;
  }

  nodes = redistribute(parser.parse(str));
  lang  = locale.split('-').shift();

  if (1 === nodes.length && 'literal' === nodes[0].type) {
    return nodes[0].text;
  }

  translator = ['var str = "";'];
  translator.push('params = this.flattenParams(params);');

  forEach(nodes, function (node) {
    var anchor = format('params["%s"]', node.anchor);

    if ('literal' === node.type) {
      translator.push(format('str += %j;', node.text));
      return;
    }

    if ('variable' === node.type) {
      translator.push(format(
        'str += ("undefined" === typeof (%s)) ? "[missed variable: %s]" : String(%s);',
        anchor, node.anchor, anchor
      ));
      return;
    }

    if ('plural' === node.type) {
      translator.push(format(
        'str += (+(%s) != (%s)) ? ("[invalid plurals amount: %s(" + String(%s) + ")]") : this.pluralize("%s", +%s, %j);',
        anchor, anchor, node.anchor, anchor, lang, anchor, node.forms
      ));
      return;
    }

    // should never happen
    throw new Error('Unknown node type');
  });

  translator.push('return str;');

  /*jslint evil:true*/
  return new Function('params', translator.join('\n'));
}


// Returns locale storage. Creates one if needed
function getLocaleStorage(self, locale) {
  if (undefined === self._storage[locale]) {
    self._storage[locale] = {};
  }

  return self._storage[locale];
}


function mergeTranslations(receiver, transmitter, locale) {
  forEach(transmitter, function (data, key) {
    // propose translation. make a copy
    if (data.l === locale) {
      receiver[key] = extend({}, data);
    }
  });

  return receiver;
}


// recompiles phrases for locale
function recompile(self, locale) {
  var fallbacks, fb_locale, old_storage, new_storage;

  fallbacks = (self._fallbacks[locale] || []).slice();
  old_storage = getLocaleStorage(self, locale);
  new_storage = mergeTranslations({}, getLocaleStorage(self, self._defaultLocale), self._defaultLocale);

  // mix-in fallbacks
  while (fallbacks.length) {
    fb_locale = fallbacks.pop();
    mergeTranslations(new_storage, getLocaleStorage(self, fb_locale), fb_locale);
  }

  // mix-in locale overrides
  self._storage[locale] = mergeTranslations(new_storage, old_storage, locale);
}


// public api (module)
////////////////////////////////////////////////////////////////////////////////


/**
 *  new BabelFish([defaultLocale = 'en'])
 *
 *  Initiates new instance of BabelFish. It can't be used as function (without
 *  `new` keyword. Use [[BabelFish.create]] for this purpose.
 **/
function BabelFish(defaultLocale) {
  this._defaultLocale = defaultLocale ? String(defaultLocale) : GENERIC_LOCALE;

  // hash of locale => [ fallback1, fallback2, ... ] pairs
  this._fallbacks = {};

  // hash of fallback => [ locale1, locale2, ... ] pairs
  this._fallbacksReverse = {};

  // states of compilation per each locale locale => bool pairs
  this._compiled = {};

  // storage of compiled translations
  // {
  //   locale: {
  //     phrase_key: {
  //       l: locale name - can be different for fallbacks
  //       e: [0 - string | 1 - function] - should be executed or not
  //       t: [String|Function] translation
  //     }
  //     ...
  //   }
  //   ...
  // }
  this._storage = {};
}


/** chainable
 *  BabelFish.create([defaultLocale = 'en']) -> BabelFish
 *
 *  Syntax sugar for constructor:
 *
 *      new BabelFish('ru')
 *      // equals to:
 *      BabelFish.create('ru');
 **/
BabelFish.create = function _create(defaultLocale) {
  return new BabelFish(defaultLocale);
};


// public api (instance)
////////////////////////////////////////////////////////////////////////////////


/** chainable
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
 *      i18n.addPhrase('ru-RU',
 *        'apps.forums.replies_count',
 *        '#{count} %{ответ|ответа|ответов}:count в теме');
 *
 *      // equals to:
 *      i18n.addPhrase('ru-RU',
 *        'apps.forums',
 *        { replies_count: '#{count} %{ответ|ответа|ответов}:count в теме' });
 **/
BabelFish.prototype.addPhrase = function _addPhrase(locale, phrase, translation, flattenLevel) {
  var self = this, _t, fl;

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
    // recursive recursion
    forEach(translation, function (val, key) {
      self.addPhrase(locale, phrase + '.' + key, val, fl-1);
    });
    return;
  }

  if (isString(translation)) {
    // compile phrase
    _t = compile(translation, locale);
    getLocaleStorage(this, locale)[phrase] = {
      e:  isFunction(_t) ? 1 : 0,
      l:  locale,
      t:  _t
    };
  } else if (isArray(translation) ||
             isNumber(translation) ||
             isBoolean(translation) ||
             (fl === 0 && isObject(translation))) {
    // Pure objects are stored without compilation
    getLocaleStorage(this, locale)[phrase] = {
      e:  0,
      l:  locale,
      t:  translation
    };
  } else {
    throw new TypeError('Invalid translation. [String|Object|Array|Number|Boolean] expected');
  }

  // mark all "dependant" locales for recompilation
  forEach(self._fallbacksReverse[locale] || [], function (locale) {
    // we need to recompile non-default locales only
    if (locale !== self._defaultLocale) {
      self._compiled[locale] = false;
    }
  });

  return this;
};


/** chainable
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
 *      i18n.setFallback('ua-UK', ['ua', 'ru']);
 **/
BabelFish.prototype.setFallback = function _setFallback(locale, fallbacks) {
  var self = this;

  if (self._defaultLocale === locale) {
    throw new Error('Default locale can\'t have fallbacks');
  }

  // clear out current fallbacks
  if (!!self._fallbacks[locale]) {
    forEach(self._fallbacks[locale], function (fallback) {
      var idx = self._fallbacksReverse[fallback].indexOf(locale);
      if (-1 !== idx) {
        delete self._fallbacksReverse[fallback][idx];
      }
    });
  }

  // set new empty stack of fallbacks
  self._fallbacks[locale] = [];

  // fill in new fallbacks. defaultLocale is appended as last fallback
  forEach(fallbacks, function (fallback) {
    if (!self._fallbacksReverse[fallback]) {
      self._fallbacksReverse[fallback] = [];
    }

    if (-1 === self._fallbacksReverse[fallback].indexOf(locale)) {
      self._fallbacksReverse[fallback].push(locale);
    }

    self._fallbacks[locale].push(fallback);
  });

  // mark locale for recompilation
  self._compiled[locale] = false;

  return this;
};


/**
 *  BabelFish#translate(locale, phrase[, params]) -> String
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
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
BabelFish.prototype.translate = function _translate(locale, phrase, params) {
  var translator  = this.getCompiledData(locale, phrase);

  // simple string or other pure object
  if (0 === translator.e) {
    return translator.t;
  }

  // function
  if (1 === translator.e) {
    return translator.t.call({
      flattenParams: flattenParams,
      pluralize: pluralizer
    }, params);
  }

  return locale + ': No translation for [' + phrase + ']';
};


/**
 *  BabelFish#hasPhrase(locale, phrase) -> Boolean
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
 *
 *  Returns whenever or not there's a translation of a `phrase`.
 **/
BabelFish.prototype.hasPhrase = function _hasPhrase(locale, phrase) {
  var translator  = this.getCompiledData(locale, phrase);
  return 0 === translator.e || 1 === translator.e;
};


/** alias of: BabelFish#translate
 *  BabelFish#t(locale, phrase[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


/**
 *  BabelFish#getCompiledData(locale, phrase) -> Object
 *  BabelFish#getCompiledData(locale) -> Object
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
 *
 *  Returns compiled "translator", or object with compiled translators for all
 *  phrases of `locale` if `phrase` was not specified.
 *
 *  Each translator is an object with fields:
 *
 *  - **type** _(String)_
 *    - _string_:     Simple translation (contains no substitutions)
 *    - _function_:   Translation with macroses
 *
 *  - **locale** _(String|Null)_
 *    Locale of translation. It can differ from requested locale in case when
 *    translation was taken from fallback locale.
 *
 *  - **translation** _(String|Function)_
 **/
BabelFish.prototype.getCompiledData = function getCompiledData(locale, phrase) {
  var storage;

  if (!locale) {
    throw new Error('You must specify locale');
  }

  // force recompilation if needed
  if (!this._compiled[locale]) {
    recompile(this, locale);
    this._compiled[locale] = true;
  }

  storage = getLocaleStorage(this, locale);

  // requested FULL storage
  if (!phrase) {
    return storage;
  }

  return storage[phrase] || {};
};


// export module
module.exports = BabelFish;

/**
 *  BabelFish#stringify(locale) -> String
 *  - locale (String): Locale of translation
 *
 *  Similar to `getCompiledData`, but returns string, suitable to generate
 *  browser scripts. Evaluated result can be assigned directly to `_store[locale]`
 *  in browser.
 **/
BabelFish.prototype.stringify = function _stringify(locale) {
  var result = [];
  var compiled = this.getCompiledData(locale);

  forEach(compiled, function (tranlator, key) {
    result.push(format(
      '"%s":{l:"%s",e:%d,t:%s}',
      key,
      tranlator.l,
      tranlator.e,
      // functions are dumped via toString(), other objects via JSON
      tranlator.e === 1 ? tranlator.t.toString() : JSON.stringify(tranlator.t)
    ));
  });

  return '{' + result.join(',') + '}';
};
