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


var Underscore = require('underscore');
var Parser = require('./babelfish/parser');
var Pluralizer = require('./babelfish/pluralizer');


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


// Merge several continuous `literal` nodes together
function redistribute(ast) {
  var nodes = [], last = {};

  Underscore.each(ast, function (node) {
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
  var nodes = redistribute(Parser.parse(str)),
      lang  = locale.split('-').shift(),
      translator;

  if (1 === nodes.length && 'literal' === nodes[0].type) {
    return nodes[0].text;
  }

  translator = ["var str = '';"];
  translator.push("params = this.flattenParams(params);");

  Underscore.each(nodes, function (node) {
    var anchor = "params['" + node.anchor + "']";

    if ('literal' === node.type) {
      translator.push("str += " + JSON.stringify(node.text) + ";");
      return;
    }

    if ('variable' === node.type) {
      translator.push(
        "str += ( 'undefined' === typeof (" + anchor + ") )" +
        " ? '[missed variable: " + node.anchor + "]'" +
        " : String(" + anchor + ");"
      );
      return;
    }

    if ('plural' === node.type) {
      translator.push(
        "str += ( +(" + anchor + ") != (" + anchor + ") )" +
        " ? ('[invalid plurals amount: " + node.anchor + "(' + String(" + anchor + ") + ')]')" +
        " : this.pluralize('" + lang + "', +" + anchor + ", " + JSON.stringify(node.forms) + ");"
      );
      return;
    }

    // should never happen
    throw new Error('Unknown node type');
  });

  translator.push("return str;");

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
  Underscore.each(transmitter, function (data, key) {
    // propose translation. make a copy
    if (data.locale === locale) {
      receiver[key] = Underscore.extend({}, data);
    }
  });

  return receiver;
}


// recompiles phrases for locale
function recompile(self, locale) {
  var fallbacks, fb_locale, old_storage, new_storage;

  fallbacks = (self._fallbacks[locale] || []).slice();
  old_storage = getLocaleStorage(self, locale);
  new_storage = mergeTranslations({}, getLocaleStorage(self, self.defaultLocale), self.defaultLocale);

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
  /** read-only
   *  BabelFish#defaultLocale -> String
   *
   *  Default locale, tht will be used if requested locale has no translation,
   *  and have no fallacks or none of its fallbacks have translation as well.
   **/
  Object.defineProperty(this, 'defaultLocale', {
    value: defaultLocale && String(defaultLocale) || GENERIC_LOCALE
  });

  // hash of locale => [ fallback1, fallback2, ... ] pairs
  this._fallbacks = {};

  // hash of fallback => [ locale1, locale2, ... ] pairs
  this._fallbacksReverse = {};

  // states of compilation per each locale locale => bool pairs
  this._compiled = {};

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
 *  BabelFish#addPhrase(locale, phrase, translation) -> BabelFish
 *  - locale (String): Locale of translation
 *  - phrase (String|Null): Phrase ID, e.g. `apps.forum`
 *  - translation (String|Object): Translation or an object with nested phrases.
 *
 *  ##### Errors
 *
 *  - **TypeError** when `translation` is neither _String_ nor _Object_.
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
BabelFish.prototype.addPhrase = function addPhrase(locale, phrase, translation) {
  var self = this, t = typeof translation;

  if ('string' !== t && 'object' !== t && translation !== (translation || '').toString()) {
    throw new TypeError('Invalid translation. String or Object expected');
  } else if ('object' === t) {
    // recursive recursion
    Underscore.each(translation, function (val, key) {
      self.addPhrase(locale, phrase + '.' + key, val);
    });
    return;
  }

  // compile phrase
  translation = compile(translation, locale);

  getLocaleStorage(this, locale)[phrase] = {
    type:         ('function' === typeof translation) ? 'function' : 'string',
    locale:       locale,
    translation:  translation
  };

  // mark all "dependant" locales for recompilation
  Underscore.each(self._fallbacksReverse[locale] || [], function (locale) {
    // we need to recompile non-default locales only
    if (locale !== self.defaultLocale) {
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
 *  [[BabelFish#defaultLocale]] will be tried as last resort.
 *
 *  ##### Errors
 *
 *  - throws `Error`, when `locale` equals [[BabelFish#defaultLocale]]
 *
 *  ##### Example
 *
 *      i18n.setFallback('ua-UK', ['ua', 'ru']);
 **/
BabelFish.prototype.setFallback = function setFallback(locale, fallbacks) {
  var self = this;

  if (self.defaultLocale === locale) {
    throw new Error("Default locale can't have fallbacks");
  }

  // clear out current fallbacks
  if (!!self._fallbacks[locale]) {
    Underscore.each(self._fallbacks[locale], function (fallback) {
      var idx = self._fallbacksReverse[fallback].indexOf(locale);
      if (-1 !== idx) {
        delete self._fallbacksReverse[fallback][idx];
      }
    });
  }

  // set new empty stack of fallbacks
  self._fallbacks[locale] = [];

  // fill in new fallbacks. defaultLocale is appended as last fallback
  Underscore.each(fallbacks, function (fallback) {
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


/**
 *  BabelFish#hasPhrase(locale, phrase) -> Boolean
 *  - locale (String): Locale of translation
 *  - phrase (String): Phrase ID, e.g. `app.forums.replies_count`
 *
 *  Returns whenever or not there's a translation of a `phrase`.
 **/
BabelFish.prototype.hasPhrase = function hasPhrase(locale, phrase) {
  var translator  = this.getCompiledData(locale, phrase);
  return 'string' === translator.type || 'function' === translator.type;
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
 *  Returns compiled "translator", or objet with compiled translators for all
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
