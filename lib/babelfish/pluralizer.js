'use strict';

var Pluralizer = module.exports = {};


function add(langs, func) {
  langs.forEach(function (lang) {
    Pluralizer[lang] = func;
  });
}


add(['en'], function (n, forms) {
  return (1 === n) ? forms[0] : forms[1] || forms[0];
});
