/**
 *  class BabelFish
 *
 *  ##### Example
 *
 *      var i18n = new BabelFish();
 **/


'use strict';


var common = require('./babelfish/common');


/**
 *  new BabelFish([defaultLocale = 'en'])
 *
 *
 **/
function BabelFish(defaultLocale) {
  this._storage = {};
}


/**
 *  BabelFish.create([defaultLocale = 'en']) -> BabelFish
 **/
BabelFish.create = function create(defaultLocale) {
  return new BabelFish(defaultLocale);
};


BabelFish.prototype._getLocaleStorage = function (locale) {
  if (undefined === this._storage[locale]) {
    this._storage[locale] = {};
  }

  return this._storage[locale];
};


BabelFish.prototype._compile = function (str) {
  // not ready yet
  return str;
};


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
  var storage = this._getLocaleStorage(locale),
      parts = scope.split('.'),
      key = parts.pop();

  parts.forEach(function (part) {
    if (undefined === storage[part]) {
      storage[part] = {};
    }

    storage = storage[part];
  });

  storage[key] = this._compile(value);
};


/** chainable
 *  BabelFish#setLocaleFallback(locale, fallback) -> BabelFish
 *
 *  Set fallback for given locale.
 *
 *  ##### Example
 *
 *      i18n.setLocaleFallback('ru-UK', 'ua');
 **/
BabelFish.prototype.setLocaleFallback = function setLocaleFallback(locale) {
  throw {message: "Not implemented yet"};
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
  var storage = this._getLocaleStorage(locale),
      parts = scope.split('.'),
      i, l;

  for (i = 0, l = parts.length; i < l; i++) {
    storage = storage[parts[i]];
    if (undefined === storage) {
      return null;
    }
  }

  if ('object' !== typeof storage) {
    return storage;
  }

  if (options.deep) {
    return common.clone(storage);
  }

  return common.filter(storage, function (val) {
    return 'object' !== typeof val;
  });
};


module.exports = BabelFish;
