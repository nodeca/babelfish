'use strict';

/*
 * First version taken from https://github.com/masylum/dialect/blob/master/lib/helpers/plurals.js With kind bermission of muslim to use under MIT license
 */

/* plurals.js provide functions that give you the plural index
 * for any locale.
 *
 * Usage:
 *  require('plurals')('es')(3) => 1;
 *  require('plurals')('es')(1) => 0;
 *
 * please, add your language if its not represented.
 *
 * references:
 *
 * http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
 * http://translate.sourceforge.net/wiki/l10n/pluralforms
 * http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms
 *
 */

function plurals(locale) {
  var parts = locale.split('-');

  switch (locale) {

  // 1 Plural
  case 'ja':
  case 'vi':
  case 'ko':
    return function (n) {
      return 1;
    };

  // 2 Plurals
  case 'pt-BR':
  case 'fr':
    return function (n) {
      return n > 1 ? 1 : 0;
    };

  // 3 Plurals
  case 'lv':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
    };
  case 'br':
  case 'ga':
  case 'gd':
  case 'cy':
    return function (n) {
      return n === 1 ? 0 : n === 2 ? 1 : 2;
    };
  case 'ro':
    return function (n) {
      return n === 1 ? 0 : (n === 0 || (n % 100 > 0 && n % 100 < 20)) ? 1 : 2;
    };
  case 'lt':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'ru':
  case 'uk':
  case 'sr':
  case 'hr':
  case 'sh':
    return function (n) {
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'cs':
  case 'sk':
    return function (n) {
      return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
    };
  case 'pl':
    return function (n) {
      return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
  case 'mk':
    return function (n) {
      return n === 1 ? 0 : n % 10 >= 2 ? 1 : 2;
    };
  case 'sl':
    return function (n) {
      return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
    };

  // 2 Plurals
  default:
    if (parts.length === 2) {
      plurals(parts[0]);
    } else {
      return function (n) {
        return n === 1 ? 0 : 1;
      };
    }
  }
}

//
// Pluralizer
//

function Pluralizer() {
}

//
// Get pluralizer for given `lang`.
//
// TODO: optimize later
//
Pluralizer.prototype.get = function (lang) {
  var r = this[lang], fn;
  if (!r) {
    fn = plurals(lang);
    r = function (n, forms) {
      return forms[fn(n)] || forms[1] || forms[0];
    };
  }
  return r;
};

//
// Set custom pluralizer for given `langs`.
//
Pluralizer.prototype.add = function (langs, func) {
  var i;
  for (i = 0; i < langs.length; i += 1) {
    this[langs[i]] = func;
  }
};

//
// module
//
module.exports = Pluralizer;
