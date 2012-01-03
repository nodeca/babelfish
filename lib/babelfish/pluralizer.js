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


// PLURALIZATION RULES
////////////////////////////////////////////////////////////////////////////////


add(['fr'], function (n) {
  return (0 <= n && n < 2) ? 0 : 1;
});


add(['en', 'es', 'de'], function (n) {
  return (1 === n) ? 0 : 1;
});


add(['ru', 'uk'], function (n) {
  var m10 = n % 10, m100 = n % 100;

  // other.
  if (0 !== n % 1) {
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
  if (0 === m10 && 5 <= m10 && m10 <= 9 && 11 <= m100 && m100 <= 14) {
    return 2;
  }

  // other
  return 3;
});
