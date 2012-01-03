'use strict';


var Assert = require('assert');
var Pluralizer = require('../lib/babelfish/pluralizer');
var Helper = require('./helper');

/*
function helper(lang, expected, forms) {
  function p(n) { return pluralizer.get(lang)(n, forms || ['one', 'other']); }
  Assert.equal(p(0), expected[0]);
  Assert.equal(p(1), expected[1]);
  Assert.equal(p(2), expected[2]);
  Assert.equal(p(5), expected[3]);
  Assert.equal(p(11), expected[4]);
  Assert.equal(p(21), expected[5]);
}

require('vows').describe('BabelFish.Pluralizer').addBatch({
  'Built-in plurlizers': {
    ru: testPluralizer('ru', 
    { langs: ['ru', 'uk'], forms: [ 'one', 'few', 'many', 'other' ],
  ])
}).addBatch({
  // TBD
  'en':  function () {
    helper('en', [
      'other', 'one', 'other', 'other', 'other', 'other'
    ]);
  },
  'fr':  function () {
    helper('fr', [
      'one', 'one', 'other', 'other', 'other', 'other'
    ]);
  },
  'de':  function () {
    helper('de', [
      'other', 'one', 'other', 'other', 'other', 'other'
    ]);
  },
  'es':  function () {
    helper('es', [
      'other', 'one', 'other', 'other', 'other', 'other'
    ]);
  },
  'ru':  function () {
    helper('ru', [
      'другое', 'один', 'несколько', 'много', 'несколько', 'один'
    ], ['один', 'несколько', 'много', 'другое']);
  },
  'it':  function () {
    helper('it', [
      'other', 'one', 'other', 'other', 'other', 'other'
    ]);
  },
  // TODO: continue
  //
  'xx': function () {
    pluralizer.add(['xx'], {
      forms: 2,
      rule: function (n, forms) {
        return forms[n % 5];
      }
    });
    helper('xx', [
      'a', 'b', 'c', 'a', 'b', 'b'
    ], ['a', 'b', 'c', 'd', 'e']);
  }
}).export(module);
*/
