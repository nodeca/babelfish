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


var Common = require('./babelfish/common');


// helpers
////////////////////////////////////////////////////////////////////////////////


// RegExp for testing string if it contains macros (plurals, variables, etc)
var MACROS_REGEXP = new RegExp("(?:^|[^\\\\])[#%]{"); // } <-- vim hack


// Compiles given string into translator function. Used to compile phrases,
// which contains `plurals`, `variables`, etc.
function compile(str) {
  if (!MACROS_REGEXP.test(str)) {
    return str;
  }

  return function (params) {
    params = ('object' === typeof params) ? Common.flatenParams(params) : {};
    throw {message: 'Not implemented yet'};
  };
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
 *  new BabelFish([defaultLocale = 'en'])
 *
 *  Initiates new instance of BabelFish. It can't be used as function (without
 *  `new` keyword. Use [[BabelFish.create]] for this purpose.
 **/
function BabelFish(defaultLocale) {
  /**
   *  BabelFish#defaultLocale -> String
   *
   *  Default locale, tht will be used if requested locale has no translation,
   *  and have no fallacks or none of its fallbacks have translation as well.
   **/
  this.defaultLocale = defaultLocale || 'en';

  // hash of locale => [ fallback1, fallback2, ... ] pairs
  this._fallbacks = {};

  // hash of fallback => [ locale1, locale2, ... ] pairs
  this._fallbacksReverse = {};

  // storage of compiled translations
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
BabelFish.create = function create(defaultLocale) {
  return new BabelFish(defaultLocale);
};


// public api (instance)
////////////////////////////////////////////////////////////////////////////////


/** chainable
 *  BabelFish#addPhrase(locale, scope, value) -> BabelFish
 *  - locale (String): Locale of translation
 *  - scope (String|Null): Scope of value, e.g. `apps.forum`
 *  - value (String|Object): Value or nested scopes with values.
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
BabelFish.prototype.addPhrase  = function addPhrase(locale, scope, value) {
  var storage, parts, key;

  storage = getLocaleStorage(this, locale);
  parts = scope.split('.');
  key = parts.pop();

  parts.forEach(function (part) {
    if (undefined === storage[part]) {
      storage[part] = {};
    }

    storage = storage[part];
  });

  storage[key] = compile(value);
};


/** chainable
 *  BabelFish#setFallback(locale[, fallback1[, fallbackN]]) -> BabelFish
 *  - locale (String): Target locale
 *  - fallback (String): Fallback locale
 *
 *  Set fallback for given locale.
 *
 *  When `locale` has no translation for the phrase, `fallback1` will be tried,
 *  if translation still not found, then `fallback2` will be tried and so on.
 *  If none of fallbacks have translation, [[BabelFish#defaultLocale]] will be
 *  tried.
 *
 *  ##### Example
 *
 *      i18n.setFallback('ru-UK', 'ua', 'ua-UA', 'ru');
 **/
BabelFish.prototype.setFallback = function setFallback(locale) {
  var self = this;
 
  // clear out current fallbacks
  if (!!self._fallbacks[locale]) {
    self._fallbacks[locale].forEach(function (fallback) {
      var idx;

      if (!!self._fallbacksReverse[fallback]) {
        idx = self._fallbacksReverse[fallback].indexOf(locale);
        if (-1 !== idx) {
          delete self._fallbacksReverse[fallback][idx];
        }
      }
    });
  }

  // set new empty stack of fallbacks
  self._fallbacks[locale] = [];

  // fill in new fallbacks
  Array.prototype.slice(arguments, 1).forEach(function (fallback) {
    if (!self._fallbacksReverse[fb_locale]) {
      self._fallbacksReverse[fb_locale] = [];
    }

    self._fallbacksReverse[fallback].push(locale);
    self._fallbacks.push(fallback);
  });

  // TODO: add recompilation of phrases (when fallback set after phrases)

  return this;
};


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
  var translator = this.getTranslation(locale, scope);

  if (null === translator) {
    return 'No [' + locale + '] translation for ' + scope;
  }

  if ('string' === typeof translator) {
    return translator;
  } else if ('function' === typeof translator) {
    return translator(params);
  } else {
    return 'Invalid scope usage: ' + scope;
  }
};


/** alias of: BabelFish#translate
 *  BabelFish#t(locale, scope[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


/**
 *  BabelFish#getTranslation(locale, scope[, options]) -> Object
 *  - locale (String): Locale of translation
 *  - scope (String): Full phrase path, e.g. `app.forums.replies_count`
 *  - options (Object): Params for translation
 *
 *  Returns compiled "translator" (if `scope` points phrase) or nested scope
 *  of translators. Each value of hash is an object with fields:
 *
 *  - **type** _(String)_
 *    - _string_:     Simple translation (contains no substitutions)
 *    - _function_:   Translation with macroses
 *    - _object_:     Nested scope of translations
 *
 *  - **orig** _(String|Null)_
 *    Represents original string of translation as of [[BabelFish#addPhrase]].
 *    `Null`, when `type` is `object`.
 *
 *  - **locale** _(String|Null)_
 *    Locale of translation. It can differ from requested locale in case when
 *    translation was taken from fallback locale.
 *    `Null`, when `type` is `object`.
 *
 *  - **value** _(String|Function|Object)_
 *
 *
 *  ##### Options
 *
 *  - **deep** _(Boolean, Default: true)_
 *    Whenever return nested translations.
 **/
BabelFish.prototype.getTranslation = function getTranslation(locale, scope, options) {
  var storage = getLocaleStorage(this, locale),
      fallback = this.getLocaleFallback(locale),
      parts = scope.split('.'),
      i, l;

  for (i = 0, l = parts.length; i < l; i++) {
    storage = storage[parts[i]];
    if (undefined === storage) {
      return !!fallback ? this.getTranslation(fallback, scope, options) : null;
    }
  }

  if ('object' !== typeof storage) {
    return storage;
  }

  storage = Common.merge({}, this.getTranslation(fallback, scope, options), storage);

  if (false === options.deep) {
    storage = Common.filter(storage, function (val) {
      return 'object' !== typeof val;
    });
  }

  return storage;
};


module.exports = BabelFish;
