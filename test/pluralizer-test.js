'use strict';


var Assert = require('assert');


// pluralization function
var pluralize = require('../lib/babelfish/pluralizer');


function testPluralizarionRules(definition) {
  var tests = {};

  definition.langs.forEach(function (lang) {
    // en: function () {}
    tests[lang] = function () {
      // test each form
      definition.forms.forEach(function (form) {
        // for each sample data
        definition.count[form].forEach(function (n) {
          var r = pluralize(lang, n, definition.forms);
          Assert.equal(r, form, n + ' expected to be ' + form + ', got ' + r);
        });
      });
    };
  });

  return tests;
}

require('vows').describe('BabelFish.Pluralizer').addBatch({
  'French': testPluralizarionRules({
    langs: ['fr'],
    forms: ['one', 'other'],
    count: {
      one:    [0, 0.5, 1, 1.5],
      other:  [2, 2.5, 3, 10]
    }
  }),

  'German, English, Spanish': testPluralizarionRules({
    langs: ['de', 'en', 'es'],
    forms: ['one', 'other'],
    count: {
      one:    [1],
      other:  [0, 1.5, 2, 10]
    }
  }),

  'Russian, Ukranian': testPluralizarionRules({
    langs: ['ru', 'uk'],
    forms: ['one', 'few', 'many', 'other'],
    count: {
      one:    [1, 21, 31],
      few:    [2, 22, 32],
      many:   [0, 5, 20],
      other:  [1.05, 1.1, 1.2]
    }
  })
}).addBatch({
  'With unknown language': {
    topic: function () {
      return pluralize('unknown', 1, ['one']);
    },
    'returns error message': function (result) {
      Assert.equal(result, '[pluralizer for (unknown) not exists]');
    }
  },

  'With insufficient plural form': {
    topic: function () {
      return pluralize('ru', 1.1, ['one', 'few', 'many']);
    },
    'returns error message': function (result) {
      Assert.equal(result, '[plural form N3 not found in translation]');
    }
  }
}).export(module);
