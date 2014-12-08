//
// CLDR Version 21
// http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
//
// Charts: http://cldr.unicode.org/index/charts
// Latest: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
//
// TODO: update to latest
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

  if (typeof forms[idx] === 'undefined') {
    return '[plural form N' + idx + ' not found in translation]';
  }

  return forms[idx];
};


// HELPERS
////////////////////////////////////////////////////////////////////////////////

/*eslint-disable yoda*/

// adds given `rule` pluralizer for given `locales` into `storage`
function add(locales, rule) {
  var i;
  for (i = 0; i < locales.length; i++) {
    PLURALIZERS[locales[i]] = rule;
  }
}

// check if number is int or float
function is_int(input) {
  return (input % 1 === 0);
}

// PLURALIZATION RULES
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// Azerbaijani, Bambara, Burmese, Chinese, Dzongkha, Georgian, Hungarian, Igbo,
// Indonesian, Japanese, Javanese, Kabuverdianu, Kannada, Khmer, Korean,
// Koyraboro Senni, Lao, Makonde, Malay, Persian, Root, Sakha, Sango,
// Sichuan Yi, Thai, Tibetan, Tonga, Turkish, Vietnamese, Wolof, Yoruba

add([ 'az', 'bm', 'my', 'zh', 'dz', 'ka', 'hu', 'ig',
  'id', 'ja', 'jv', 'kea', 'kn', 'km', 'ko',
  'ses', 'lo', 'kde', 'ms', 'fa', 'root', 'sah', 'sg',
  'ii',  'th', 'bo', 'to', 'tr', 'vi', 'wo', 'yo' ], function () {
  return 0;
});


// Manx

add([ 'gv' ], function (n) {
  var m10 = n % 10, m20 = n % 20;

  if ((m10 === 1 || m10 === 2 || m20 === 0) && is_int(n)) {
    return 0;
  }

  return 1;
});


// Central Morocco Tamazight

add([ 'tzm' ], function (n) {
  if (n === 0 || n === 1 || (11 <= n && n <= 99 && is_int(n))) {
    return 0;
  }

  return 1;
});


// Macedonian

add([ 'mk' ], function (n) {
  if ((n % 10 === 1) && (n !== 11) && is_int(n)) {
    return 0;
  }

  return 1;
});


// Akan, Amharic, Bihari, Filipino, Gun, Hindi,
// Lingala, Malagasy, Northern Sotho, Tagalog, Tigrinya, Walloon

add([ 'ak', 'am', 'bh', 'fil', 'guw', 'hi',
  'ln', 'mg', 'nso', 'tl', 'ti', 'wa' ], function (n) {
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

add([ 'af', 'sq', 'eu', 'bem', 'bn', 'brx', 'bg', 'ca',
  'chr', 'cgg', 'da', 'dv', 'nl', 'en', 'eo', 'et', 'ee',
  'fo', 'fi', 'fur', 'gl', 'lg', 'de', 'el', 'gu', 'ha',
  'haw', 'he', 'is', 'it', 'kl', 'kk', 'ku',
  'lb', 'ml', 'mr', 'mas', 'mn', 'nah', 'ne',
  'no', 'nb', 'nn', 'nyn', 'or', 'om',
  'pap', 'ps', 'pt', 'pa', 'rm', 'ssy', 'saq', 'xog',
  'so', 'es', 'sw', 'sv', 'gsw', 'syr', 'ta', 'te',
  'tk', 'ur', 'wae', 'fy', 'zu' ], function (n) {
  return (n === 1) ? 0 : 1;
});


// Latvian

add([ 'lv' ], function (n) {
  if (n === 0) {
    return 0;
  }

  if ((n % 10 === 1) && (n % 100 !== 11) && is_int(n)) {
    return 1;
  }

  return 2;
});


// Colognian

add([ 'ksh' ], function (n) {
  return (n === 0) ? 0 : ((n === 1) ? 1 : 2);
});


// Cornish, Inari Sami, Inuktitut, Irish, Lule Sami, Northern Sami,
// Sami Language, Skolt Sami, Southern Sami

add([ 'kw', 'smn', 'iu', 'ga', 'smj', 'se',
  'smi', 'sms', 'sma' ], function (n) {
  return (n === 1) ? 0 : ((n === 2) ? 1 : 2);
});


// Belarusian, Bosnian, Croatian, Russian, Serbian, Serbo-Croatian, Ukrainian

add([ 'be', 'bs', 'hr', 'ru', 'sr', 'sh', 'uk' ], function (n) {
  var m10 = n % 10, m100 = n % 100;

  if (!is_int(n)) {
    return 3;
  }

  // one → n mod 10 is 1 and n mod 100 is not 11;
  if (m10 === 1 && m100 !== 11) {
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

add([ 'pl' ], function (n) {
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

add([ 'lt' ], function (n) {
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

add([ 'shi' ], function (n) {
  return (0 <= n && n <= 1) ? 0 : ((is_int(n) && 2 <= n && n <= 10) ? 1 : 2);
});


// Moldavian, Romanian

add([ 'mo', 'ro' ], function (n) {
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

add([ 'cs', 'sk' ], function (n) {
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

add([ 'sl' ], function (n) {
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

add([ 'mt' ], function (n) {
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

add([ 'ar' ], function (n) {
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

add([ 'br', 'cy' ], function (n) {

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

add([ 'fr', 'ff', 'kab' ], function (n) {
  return (0 <= n && n < 2) ? 0 : 1;
});


// Langi

add([ 'lag' ], function (n) {
  return (n === 0) ? 0 : ((0 < n && n < 2) ? 1 : 2);
});
