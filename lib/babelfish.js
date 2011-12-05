/**
 *  class BabelFish
 *
 *  ##### Example
 *
 *      var i18n = new BabelFish();
 **/


'use strict';


/**
 *  new BabelFish([defaultLocale = 'en'])
 *
 *
 **/
function BabelFish(defaultLocale) {}


/**
 *  BabelFish.create([defaultLocale = 'en']) -> BabelFish
 **/
BabelFish.create = function create(defaultLocale) {
  return new BabelFish(defaultLocale);
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
  throw {message: "Not implemented yet"};
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
  throw {message: "Not implemented yet"};
};


/** alias of: BabelFish#translate
 *  BabelFish#translate(locale, scope[, params]) -> String
 **/
BabelFish.prototype.t = BabelFish.prototype.translate;


/**
 *  BabelFish#getScope(locale, scope[, options]) -> Object|Function|String
 **/
BabelFish.prototype.getScope = function getScope(locale, scope, options) {
  throw {message: "Not implemented yet"};
};


module.exports = BabelFish;
