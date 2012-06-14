var BabelFish = window.BabelFish = (function () {
  (function (self) {
    self.def  = function (name, func) {
      self[name] = {exports: {}, called: false, func: func};
    };
    self.req = function (name) {
      if (self[name].called) {
        return self[name].exports;
      }

      self[name].called  = true;
      self[name].exports = self[name].func.call(self[name], self.req);

      return self[name].exports;
    };
  }(this));

  this.def("0", function (require) {
    var module = this, exports = this.exports;

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
var Parser = require("1");
var Pluralizer = require("2");


// helpers
////////////////////////////////////////////////////////////////////////////////


// Last resort locale, that exists for sure
var GENERIC_LOCALE = 'en';


function trim(str) {
  return (str || '').toString().trimLeft().trimRight();
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


// Compiles given string into translator function. Used to compile phrases,
// which contains `plurals`, `variables`, etc.
function compile(str, locale) {
  var nodes = Parser.parse(str), lang = locale.split('-').shift(), translator;

  if (1 === nodes.length && 'text' === nodes[0].type) {
    return nodes[0].value;
  }

  translator = ["var str = '';"];
  translator.push("params = this.flattenParams(params);");

  Underscore.each(nodes, function (node, idx) {
    var anchor = "params['" + node.anchor + "']";

    if ('text' === node.type) {
      // TODO: escape node.value
      translator.push("str += '" + node.value + "';");
      return;
    }

    if ('variable' === node.type) {
      translator.push("str += (" + anchor + " || '<undefined>').toString();");
      return;
    }

    if ('plural' === node.type) {
      translator.push(
        "str += (!" + anchor + " || isNaN(" + anchor + ")) " +
          "? '<invalid_amount>' " +
          ": this.pluralize('" + lang + "', +" + anchor + ", " + JSON.stringify(node.forms) + ");"
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


function mergeTranslations(receiver, transmitter, locale) {
  Underscore.each(transmitter, function (data, key) {
    // go deeper
    if ('object' === data.type) {
      if (!receiver[key] || 'object' !== receiver[key].type) {
        receiver[key] = {
          type:   'object',
          locale: null,
          value:  {}
        };
      }
      mergeTranslations(receiver[key].value, data.value, locale);
      return;
    }

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
    value: trim(defaultLocale) || GENERIC_LOCALE
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
 *  BabelFish#addPhrase(locale, scope, value) -> BabelFish
 *  - locale (String): Locale of translation
 *  - scope (String|Null): Scope of value, e.g. `apps.forum`
 *  - value (String|Object): Value or nested scopes with values.
 *
 *  ##### Errors
 *
 *  - **TypeError** when `value` is neither _String_ nor _Object_.
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
BabelFish.prototype.addPhrase = function addPhrase(locale, scope, value) {
  var self = this, t = typeof value, parts, storage, data;

  if ('string' !== t && 'object' !== t && value !== (value || '').toString()) {
    throw new TypeError('Invalid value. String or Object expected');
  } else if ('object' === t) {
    // recursive recursion
    Underscore.each(value, function (value, key) {
      self.addPhrase(locale, scope + '.' + key, value);
    });
    return;
  }

  storage = getLocaleStorage(this, locale);
  parts = parseScope(scope);

  // process inner scope
  parts.chunks.forEach(function (scope_key) {
    if (!storage[scope_key] || 'object' !== storage[scope_key].type) {
      storage[scope_key] = {
        type:   'object',
        locale: null,
        value:  {}
      };
    }

    storage = storage[scope_key].value;
  });

  // prepare data object
  data = storage[parts.key] = {
    type:   null, // will set it below
    locale: locale,
    value:  compile(value, locale)
  };

  // set data type
  data.type = ('function' === typeof data.value) ? 'function' : 'string';

  // mark all "dependant" locales for recompilation
  (self._fallbacksReverse[locale] || []).forEach(function (locale) {
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
    self._fallbacks[locale].forEach(function (fallback) {
      var idx = self._fallbacksReverse[fallback].indexOf(locale);
      if (-1 !== idx) {
        delete self._fallbacksReverse[fallback][idx];
      }
    });
  }

  // set new empty stack of fallbacks
  self._fallbacks[locale] = [];

  // fill in new fallbacks. defaultLocale is appended as last fallback
  fallbacks.forEach(function (fallback) {
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

  // force recompilation if needed
  if (!this._compiled[locale]) {
    recompile(this, locale);
    this._compiled[locale] = true;
  }

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


    return this.exports;
  });
  this.def("1", function (require) {
    var module = this, exports = this.exports;

'use strict';


var Parser = module.exports = {};

function ScalarNode(value) {
  this.type = 'text';
  this.value = value;
}


function VariableNode(anchor) {
  this.type = 'variable';
  this.anchor = anchor;
}


function PluralNode(anchor, forms) {
  this.type = 'plural';
  this.anchor = anchor;
  this.forms = forms;
}


// Expose nodes for testing
Parser.Nodes = {
  ScalarNode: ScalarNode,
  VariableNode: VariableNode,
  PluralNode: PluralNode
};


// catch valid variable and object accessor notation
var ANCHOR_REGEXP = new RegExp(
  '([a-z_$](?:[a-z0-9_$]*|\\.[a-z_$][a-z0-9_$]*)*)',
  'i'
);


// finds macros in the translations
var MACROS_REGEXP = new RegExp(
  '(^|.*?[^\\\\])' +            // either nothing, or anything which doesn't end with \ (backslash)
    '(?:' +
      '#{' +                    // interpolation
        ANCHOR_REGEXP.source +  // interpolating variable
      '}' +
    '|' +
      '%{' +                    // pluralization
        '(.*?[^\\\\])(?=})' +   // word forms
      '}:' +
      ANCHOR_REGEXP.source +    // controlling variable
    ')',
  'i'
);

// used to unescape critical chars
var UNESCAPE_CHARS = new RegExp('\\\\([#%}{|\\\\])', 'g');
function unescapeString(str) {
  return str.replace(UNESCAPE_CHARS, '$1');
}

// used to split arguments of plural
var FORMS_SEPARATOR_REGEXP = new RegExp('([\\\\]*)[|]');
function parseForms(str) {
  var forms = [], match, tmp = '';

  while (!!str.length) {
    match = str.match(FORMS_SEPARATOR_REGEXP);

    if (null === match) {
      forms.push(str);
      str = '';
    } else if (1 === match[1].length % 2) {
      tmp += str.slice(0, match.index + match[0].length);
      str = str.slice(match.index + match[0].length);
    } else {
      forms.push(tmp + str.slice(0, match.index + match[0].length - 1));
      str = str.slice(match.index + match[0].length);
      tmp = '';
    }
  }

  return forms.map(unescapeString);
}


// parses string into array of nodes
Parser.parse = function parse(str) {
  var nodes = [], match;

  while (!!str.length) {
    match = str.match(MACROS_REGEXP);

    if (null === match) {
      nodes.push(new ScalarNode(unescapeString(str)));
      break;
    }

    // we have scalars before macros
    if (match[1] && 0 !== match[1].length) {
      nodes.push(new ScalarNode(unescapeString(match[1])));
    }

    // got variable node
    if (undefined !== match[2]) {
      nodes.push(new VariableNode(match[2]));
    // got plurals
    } else {
      nodes.push(new PluralNode(match[4], parseForms(match[3])));
    }

    // remove processed data
    str = str.slice(match.index + match[0].length);
  }

  return nodes;
};


// export RegExps for unit testing
Parser.MACROS_REGEXP = MACROS_REGEXP;
Parser.ANCHOR_REGEXP = ANCHOR_REGEXP;


    return this.exports;
  });
  this.def("2", function (require) {
    var module = this, exports = this.exports;

//
// See rules here:
// http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
//

'use strict';


// pluralizers cache
var PLURALIZERS = {};


module.exports = function pluralize(lang, count, forms) {
  var idx;

  if (!PLURALIZERS[lang]) {
    return '[pluralizer for (' + lang + ') not exists]';
  }

  idx = PLURALIZERS[lang](count);

  if (undefined === forms[idx]) {
    return '[plural form N' + idx + ' not found in translation]';
  }

  return forms[idx];
};


// HELPERS
////////////////////////////////////////////////////////////////////////////////


// adds given `rule` pluralizer for given `locales` into `storage`
function add(locales, rule) {
  var i;
  for (i = 0; i < locales.length; i += 1) {
    PLURALIZERS[locales[i]] = rule;
  }
}

// check if number is int or float
function is_int(input) {
  return (0 === input % 1);
}

// PLURALIZATION RULES
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// Azerbaijani, Bambara, Burmese, Chinese, Dzongkha, Georgian, Hungarian, Igbo,
// Indonesian, Japanese, Javanese, Kabuverdianu, Kannada, Khmer, Korean,
// Koyraboro Senni, Lao, Makonde, Malay, Persian, Root, Sakha, Sango,
// Sichuan Yi, Thai, Tibetan, Tonga, Turkish, Vietnamese, Wolof, Yoruba

add(['az', 'bm', 'my', 'zh', 'dz', 'ka', 'hu', 'ig',
  'id', 'ja', 'jv', 'kea', 'kn', 'km', 'ko',
  'ses', 'lo', 'kde', 'ms', 'fa', 'root', 'sah', 'sg',
  'ii',  'th', 'bo', 'to', 'tr', 'vi', 'wo', 'yo'], function (n) {
  return 0;
});


// Manx

add(['gv'], function (n) {
  var m10 = n % 10, m20 = n % 20;

  if ((m10 === 1 || m10 === 2 || m20 === 0) && is_int(n)) {
    return 0;
  }

  return 1;
});


// Central Morocco Tamazight

add(['tzm'], function (n) {
  if (n === 0 || n === 1 || (11 <= n && n <= 99 && is_int(n))) {
    return 0;
  }

  return 1;
});


// Macedonian

add(['mk'], function (n) {
  if ((n % 10 === 1) && (n !== 11) && is_int(n)) {
    return 0;
  }

  return 1;
});


// Akan, Amharic, Bihari, Filipino, Gun, Hindi,
// Lingala, Malagasy, Northern Sotho, Tagalog, Tigrinya, Walloon

add(['ak', 'am', 'bh', 'fil', 'guw', 'hi',
  'ln', 'mg', 'nso', 'tl', 'ti', 'wa'], function (n) {
  return (n === 0 || n === 1) ? 0 : 1;
});


// Afrikaans, Albanian, Basque, Bemba, Bengali, Bodo, Bulgarian, Catalan,
// Cherokee, Chiga, Danish, Divehi, Dutch, English, Esperanto, Estonian, Ewe,
// Faroese, Finnish, Friulian, Galician, Ganda, German, Greek, Gujarati, Hausa,
// Hawaiian, Hebrew, Icelandic, Italian, Kalaallisut, Kazakh, Kurdish,
// Luxembourgish, Malayalam, Marathi, Masai, Mongolian, Nahuatl, Nepali,
// Norwegian, Norwegian Bokmål, Norwegian Nynorsk, Nyankole, Oriya, Oromo,
// Papiamento, Pashto, Portuguese, Punjabi, Romansh, Saho, Samburu, Soga,
// Somali, Spanish, Swahili, Swedish, Swiss German, Syriac, Tamil, Telugu,
// Turkmen, Urdu, Walser, Western Frisian, Zulu

add(['af', 'sq', 'eu', 'bem', 'bn', 'brx', 'bg', 'ca',
  'chr', 'cgg', 'da', 'dv', 'nl', 'en', 'eo', 'et', 'ee',
  'fo', 'fi', 'fur', 'gl', 'lg', 'de', 'el', 'gu', 'ha',
  'haw', 'he', 'is', 'it', 'kl', 'kk', 'ku',
  'lb', 'ml', 'mr', 'mas', 'mn', 'nah', 'ne',
  'no', 'nb', 'nn', 'nyn', 'or', 'om',
  'pap', 'ps', 'pt', 'pa', 'rm', 'ssy', 'saq', 'xog',
  'so', 'es', 'sw', 'sv', 'gsw', 'syr', 'ta', 'te',
  'tk', 'ur', 'wae', 'fy', 'zu'], function (n) {
  return (1 === n) ? 0 : 1;
});


// Latvian

add(['lv'], function (n) {
  if (n === 0) {
    return 0;
  }

  if ((n % 10 === 1) && (n % 100 !== 11) && is_int(n)) {
    return 1;
  }

  return 2;
});


// Colognian

add(['ksh'], function (n) {
  return (n === 0) ? 0 : ((n === 1) ? 1 : 2);
});


// Cornish, Inari Sami, Inuktitut, Irish, Lule Sami, Northern Sami,
// Sami Language, Skolt Sami, Southern Sami

add(['kw', 'smn', 'iu', 'ga', 'smj', 'se',
  'smi', 'sms', 'sma'], function (n) {
  return (n === 1) ? 0 : ((n === 2) ? 1 : 2);
});


// Belarusian, Bosnian, Croatian, Russian, Serbian, Serbo-Croatian, Ukrainian

add(['be', 'bs', 'hr', 'ru', 'sr', 'sh', 'uk'], function (n) {
  var m10 = n % 10, m100 = n % 100;

  if (!is_int(n)) {
    return 3;
  }

  // one → n mod 10 is 1 and n mod 100 is not 11;
  if (1 === m10 && 11 !== m100) {
    return 0;
  }

  // few → n mod 10 in 2..4 and n mod 100 not in 12..14;
  if (2 <= m10 && m10 <= 4 && !(12 <= m100 && m100 <= 14)) {
    return 1;
  }

  // many → n mod 10 is 0 or n mod 10 in 5..9 or n mod 100 in 11..14;
/*  if (0 === m10 || (5 <= m10 && m10 <= 9) || (11 <= m100 && m100 <= 14)) {
    return 2;
  }

  // other
  return 3;*/
  return 2;
});


// Polish

add(['pl'], function (n) {
  var m10 = n % 10, m100 = n % 100;

  if (!is_int(n)) {
    return 3;
  }

  // one → n is 1;
  if (n === 1) {
    return 0;
  }

  // few → n mod 10 in 2..4 and n mod 100 not in 12..14;
  if (2 <= m10 && m10 <= 4 && !(12 <= m100 && m100 <= 14)) {
    return 1;
  }

  // many → n is not 1 and n mod 10 in 0..1 or
  // n mod 10 in 5..9 or n mod 100 in 12..14
  // (all other except partials)
  return 2;
});


// Lithuanian

add(['lt'], function (n) {
  var m10 = n % 10, m100 = n % 100;

  if (!is_int(n)) {
    return 2;
  }

  // one → n mod 10 is 1 and n mod 100 not in 11..19
  if (m10 === 1 && !(11 <= m100 && m100 <= 19)) {
    return 0;
  }

  // few → n mod 10 in 2..9 and n mod 100 not in 11..19
  if (2 <= m10 && m10 <= 9 && !(11 <= m100 && m100 <= 19)) {
    return 1;
  }

  // other
  return 2;
});


// Tachelhit

add(['shi'], function (n) {
  return (0 <= n && n <= 1) ? 0 : ((is_int(n) && 2 <= n && n <= 10) ? 1 : 2);
});


// Moldavian, Romanian

add(['mo', 'ro'], function (n) {
  var m100 = n % 100;

  if (!is_int(n)) {
    return 2;
  }

  // one → n is 1
  if (n === 1) {
    return 0;
  }

  // few → n is 0 OR n is not 1 AND n mod 100 in 1..19
  if (n === 0 || (1 <= m100 && m100 <= 19)) {
    return 1;
  }

  // other
  return 2;
});


// Czech, Slovak

add(['cs', 'sk'], function (n) {
  // one → n is 1
  if (n === 1) {
    return 0;
  }

  // few → n in 2..4
  if (n === 2 || n === 3 || n === 4) {
    return 1;
  }

  // other
  return 2;
});



// Slovenian

add(['sl'], function (n) {
  var m100 = n % 100;

  if (!is_int(n)) {
    return 3;
  }

  // one → n mod 100 is 1
  if (m100 === 1) {
    return 0;
  }

  // one → n mod 100 is 2
  if (m100 === 2) {
    return 1;
  }

  // one → n mod 100 in 3..4
  if (m100 === 3 || m100 === 4) {
    return 2;
  }

  // other
  return 3;
});


// Maltese

add(['mt'], function (n) {
  var m100 = n % 100;

  if (!is_int(n)) {
    return 3;
  }

  // one → n is 1
  if (n === 1) {
    return 0;
  }

  // few → n is 0 or n mod 100 in 2..10
  if (n === 0 || (2 <= m100 && m100 <= 10)) {
    return 1;
  }

  // many → n mod 100 in 11..19
  if (11 <= m100 && m100 <= 19) {
    return 2;
  }

  // other
  return 3;
});


// Arabic

add(['ar'], function (n) {
  var m100 = n % 100;

  if (!is_int(n)) {
    return 5;
  }

  if (n === 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  if (n === 2) {
    return 2;
  }

  // few → n mod 100 in 3..10
  if (3 <= m100 && m100 <= 10) {
    return 3;
  }

  // many → n mod 100 in 11..99
  if (11 <= m100 && m100 <= 99) {
    return 4;
  }

  // other
  return 5;
});


// Breton, Welsh

add(['br', 'cy'], function (n) {

  if (n === 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  if (n === 2) {
    return 2;
  }
  if (n === 3) {
    return 3;
  }
  if (n === 6) {
    return 4;
  }

  return 5;
});


// FRACTIONAL PARTS - SPECIAL CASES
////////////////////////////////////////////////////////////////////////////////


// French, Fulah, Kabyle

add(['fr', 'ff', 'kab'], function (n) {
  return (0 <= n && n < 2) ? 0 : 1;
});


// Langi

add(['lag'], function (n) {
  return (n === 0) ? 0 : ((0 < n && n < 2) ? 1 : 2);
});



    return this.exports;
  });

  return this.req("0");
}.call({}));
