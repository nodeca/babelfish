/**
 *  class BabelFish
 *
 *  ##### Example
 *
 *      var i18n = new BabelFish();
 **/


/**
 *  new BabelFish(defaultLocale)
 **/
function BabelFish(defaultLocale) {
  throw {message: "Not implemented yet"};
}


/** chainable
 *  BabelFish#addPhrase(locale, scope, value) -> BabelFish
 *  - locale (String): Locale as it defined in locales.yml, e.g. `ru-RU`
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


/**
 *  BabelFish#getCompiledPhrase(locale[, scope = null[, options]]) -> Object
 *  - locale (String): Locale as it defined in locales.yml, e.g. `ru-RU`
 *  - scope (String|Null): Retreive phrases of given scope (`null` means global)
 *  - options (Object): Options of retreival
 *
 *  Retreives compiled phrase/phrases of the scope for given locale.
 *
 *  ##### Options
 *
 *  - deep (Boolean): Whenever get nested scopes. Default: `true`.
 **/
BabelFish.prototype.getCompiledPhrase = function getCompiledPhrase(locale, scope, options) {
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
BabelFish.prototype.setLocaleFallback = function setLocaleFallback(locale, fallback) {
  throw {message: "Not implemented yet"};
};


/**
 *  I18n#translate(locale, scope[, params]) -> String
 *  - locale (String): Locale as it defined in locales.yml, e.g. `ru-RU`
 *  - scope (String): Full phrase path, e.g. `app.forums.replies_count`
 *  - parmas (Object): Params for translation
 *
 *  ##### Example
 *
 *      i18n.translate('ru-RU', 'app.forums.replies_count', {count: 1});
 *      // -> '1 ответ'
 **/
BabelFish.prototype.t
BabelFish.prototype.translate = function translate(locale, scope, params) {
  throw {message: "Not implemented yet"};
};
