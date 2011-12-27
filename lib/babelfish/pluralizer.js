'use strict';

var plurals = require('./plurals');

var Pluralizer = module.exports = {};


function getPluralizer(lang) {
  var fn = plurals(lang);
  return function (n, forms) {
    return forms[fn(n)] || forms[1] || forms[0];
  };
}


function add(langs, func) {
  langs.forEach(function (lang) {
    Pluralizer[lang] = func || getPluralizer(lang);
  });
}

add(['en']);
