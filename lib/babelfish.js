/**
 *  class BabelFish
 *
 *  ##### Example
 *
 *      var i18n = new BabelFish();
 **/


'use strict';


var Common = require('./babelfish/common');

// helpers
////////////////////////////////////////////////////////////////////////////////


// public api (module)
////////////////////////////////////////////////////////////////////////////////


/**
 *  new BabelFish([defaultLocale = 'en'])
 *
 *
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


/**
 *  BabelFish.create([defaultLocale = 'en']) -> BabelFish
 **/
BabelFish.create = function create(defaultLocale) {
  return new BabelFish(defaultLocale);
};


/**
 *  BabelFish.compile(str) -> Function
 *
 *  Compiles given string into translator function. Used to compile phrases,
 *  which contains `plurals`, `variables`, etc.
 **/
BabelFish.compile = function compile(str) {
  if (!/[^\\][#%]\{/.test(str)) {
    return str;
  }

  return function (params) {
    params = ('object' === typeof params) ? flatenParams(params) : {};
    throw {message: 'Not implemented yet'};
  };
};


// private api (instance)
////////////////////////////////////////////////////////////////////////////////


function getLocaleStorage(self, locale) {
  if (undefined === self._storage[locale]) {
    self._storage[locale] = {};
  }

  return self._storage[locale];
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
  var storage = getLocaleStorage(this, locale),
      parts = scope.split('.'),
      key = parts.pop();

  parts.forEach(function (part) {
    if (undefined === storage[part]) {
      storage[part] = {};
    }

    storage = storage[part];
  });

  storage[key] = BabelFish.compile(value);
};


/** chainable
 *  BabelFish#setLocaleFallback(locale[, fallback1[, fallbackN]]) -> BabelFish
 *
 *  Set fallback for given locale.
 *
 *  ##### Example
 *
 *      i18n.setLocaleFallback('ru-UK', 'ua', 'ua-UA', 'ru');
 **/
BabelFish.prototype.setLocaleFallback = function setLocaleFallback(locale) {
  var self = this, fallbacks = this._fallbacks[locale] = [this.defaultLocale];
 
  Array.prototype.slice(arguments, 1).forEach(function (fb_locale) {
    if (!self._fallbacksReverse[fb_locale]) {
      self._fallbacksReverse[fb_locale] = [];
    }
    self._fallbacksReverse[fb_locale].push(locale);
    fallbacks.push(fb_locale);
  });

  return this;
};


BabelFish.prototype.getLocaleFallback = function getLocaleFallback(locale) {
  // we're on the bottom. nowhere to fallback anymore ;))
  if (locale === this.defautLocale) {
    return null;
  }

  return this._fallback[locale] || this.defautLocale;
};


/**
 *  BabelFish#translate(locale, scope[, params]) -> String
 *  - locale (String): Locale of translation
 *  - scope (String): Full phrase path, e.g. `app.forums.replies_count`
 *  - parmas (Object): Params for translation
 *
 *  ##### Example
 *
 *      i18n.translate('ru-RU', 'app.forums.replies_count', {count: 1});
 *      // -> '1 ответ'
 **/
BabelFish.prototype.translate = function translate(locale, scope, params) {
  var translator = this.getScope(locale, scope);

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
 *  BabelFish#translate(locale, scope[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


/**
 *  BabelFish#getScope(locale, scope[, options]) -> Object|Function|String
 **/
BabelFish.prototype.getScope = function getScope(locale, scope, options) {
  var storage = getLocaleStorage(this, locale),
      fallback = this.getLocaleFallback(locale),
      parts = scope.split('.'),
      i, l;

  for (i = 0, l = parts.length; i < l; i++) {
    storage = storage[parts[i]];
    if (undefined === storage) {
      return !!fallback ? this.getScope(fallback, scope, options) : null;
    }
  }

  if ('object' !== typeof storage) {
    return storage;
  }

  storage = Common.merge({}, this.getScope(fallback, scope, options), storage);

  if (false === options.deep) {
    storage = Common.filter(storage, function (val) {
      return 'object' !== typeof val;
    });
  }

  return storage;
};


module.exports = BabelFish;
