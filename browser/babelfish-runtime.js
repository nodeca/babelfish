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

// This is a "minimal" version of BabelFish used on client side ////////////////
////////////////////////////////////////////////////////////////////////////////


'use strict';


/*global window*/


// TODO: Provide shim for Underscore
var Underscore = (window || global)._;
var Pluralizer = require("1");


// helpers
////////////////////////////////////////////////////////////////////////////////


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
    parts.key = chunks.pop() || '';
  }

  // empty scope given `` or `.`, or `..` etc.
  if (!parts.key) {
    throw new TypeError('Invalid scope');
  }

  // filter chunks that left
  Underscore.each(chunks, function (chunk) {
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

  Underscore.each(parts.chunks, function (scope_key) {
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
