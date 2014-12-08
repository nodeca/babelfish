/*global it, describe*/

'use strict';


var assert = require('assert');


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
          assert.strictEqual(r, form, n + ' expected to be ' + form + ', got ' + r);
        });
      });
    };
  });

  return tests;
}

describe('BabelFish.Pluralizer', function () {


  describe('Languages', function () {

    it('Azerbaijani', function () {
      testPluralizarionRules({
        langs: [ 'az' ],
        forms: [ 'other' ],
        count: {
          other:  [ 0, 1.5, 2, 2.5, 10 ]
        }
      });
    });

    it('Manx', function () {
      testPluralizarionRules({
        langs: [ 'gv' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 0, 1, 2, 11, 12, 20, 21, 22 ],
          other:  [ 0.1, 1.4, 3, 4, 5.6, 10, 13, 19, 23, 24, 30 ]
        }
      });
    });

    it('Central Morocco Tamazight', function () {
      testPluralizarionRules({
        langs: [ 'tzm' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 0, 1, 11, 12, 99 ],
          other:  [ 0.1, 1.4, 2, 3.5, 10, 100, 120.4 ]
        }
      });
    });

    it('Macedonian', function () {
      testPluralizarionRules({
        langs: [ 'mk' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 1, 21, 31, 41, 51, 61 ],
          other:  [ 0, 0.1, 2, 3.5, 10, 11, 12, 20, 22 ]
        }
      });
    });

    it('Filipino', function () {
      testPluralizarionRules({
        langs: [ 'fil' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 0, 1 ],
          other:  [ 0.1, 1.3, 2, 3, 3.5, 5, 7 ]
        }
      });
    });

    it('English', function () {
      testPluralizarionRules({
        langs: [ 'en' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 1 ],
          other:  [ 0, 1.5, 2, 10 ]
        }
      });
    });

    it('Latvian', function () {
      testPluralizarionRules({
        langs: [ 'lv' ],
        forms: [ 'zero', 'one', 'other' ],
        count: {
          zero:   [ 0 ],
          one:    [ 1, 21, 31, 41, 101 ],
          other:  [ 0.1, 1.1, 2, 2.5, 3, 11, 100, 111, 120 ]
        }
      });
    });

    it('Colognian', function () {
      testPluralizarionRules({
        langs: [ 'ksh' ],
        forms: [ 'zero', 'one', 'other' ],
        count: {
          zero:   [ 0 ],
          one:    [ 1 ],
          other:  [ 0.1, 1.1, 2, 2.5, 3 ]
        }
      });
    });

    it('Irish', function () {
      testPluralizarionRules({
        langs: [ 'ga' ],
        forms: [ 'one', 'two', 'other' ],
        count: {
          one:    [ 1 ],
          two:    [ 2 ],
          other:  [ 0, 0.1, 1.1, 2.5, 3 ]
        }
      });
    });

    it('Russian', function () {
      testPluralizarionRules({
        langs: [ 'ru' ],
        forms: [ 'one', 'few', 'many', 'other' ],
        count: {
          one:    [ 1, 21, 31 ],
          few:    [ 2, 22, 32 ],
          many:   [ 0, 5, 20 ],
          other:  [ 1.05, 1.1, 1.2 ]
        }
      });
    });

    it('Polish', function () {
      testPluralizarionRules({
        langs: [ 'pl' ],
        forms: [ 'one', 'few', 'many', 'other' ],
        count: {
          one:    [ 1 ],
          few:    [ 2, 3, 4, 22, 23, 24, 32, 33, 34 ],
          many:   [ 0, 5, 6, 10, 11, 12, 14, 20, 21, 25, 30, 31, 112 ],
          other:  [ 1.05, 1.1, 1.2 ]
        }
      });
    });

    it('Lithuanian', function () {
      testPluralizarionRules({
        langs: [ 'lt' ],
        forms: [ 'one', 'few', 'other' ],
        count: {
          one:    [ 1, 21, 31, 41, 51, 61 ],
          few:    [ 2, 3, 4, 9, 22, 23, 29, 32, 39 ],
          other:  [ 1.2, 2.07, 10.94, 0, 10, 11, 20, 30, 40, 50 ]
        }
      });
    });

    it('Tachelhit', function () {
      testPluralizarionRules({
        langs: [ 'shi' ],
        forms: [ 'one', 'few', 'other' ],
        count: {
          one:    [ 0, 0.5, 1 ],
          few  :  [ 2, 3, 10 ],
          other:  [ 1.5, 2.5, 11, 11.5, 12 ]
        }
      });
    });

    it('Moldavian', function () {
      testPluralizarionRules({
        langs: [ 'mo' ],
        forms: [ 'one', 'few', 'other' ],
        count: {
          one:    [ 1 ],
          few:    [ 0, 2, 3, 10, 19, 101, 111, 119, 201, 211, 219 ],
          other:  [ 20, 21, 99, 100, 120, 121, 200, 1.2, 2.07, 20.94 ]
        }
      });
    });

    it('Czech', function () {
      testPluralizarionRules({
        langs: [ 'cs' ],
        forms: [ 'one', 'few', 'other' ],
        count: {
          one:    [ 1 ],
          few:    [ 2, 3, 4 ],
          other:  [ 0, 5, 999, 1.2, 2.07, 5.94 ]
        }
      });
    });

    it('Slovenian', function () {
      testPluralizarionRules({
        langs: [ 'sl' ],
        forms: [ 'one', 'two', 'few', 'other' ],
        count: {
          one:    [ 1, 101, 201, 301, 401, 501 ],
          two:    [ 2, 102, 202, 302, 402, 502 ],
          few:    [ 3, 4, 103, 104, 203, 204 ],
          other:  [ 0, 5, 100, 105, 200, 205, 300, 1.2, 2.07, 3.94, 5.81 ]
        }
      });
    });

    it('Maltese', function () {
      testPluralizarionRules({
        langs: [ 'mt' ],
        forms: [ 'one', 'few', 'many', 'other' ],
        count: {
          one:    [ 1 ],
          few:    [ 0, 2, 3, 4, 10, 102, 110, 202, 210 ],
          many:   [ 11, 12, 13, 19, 111, 119, 211, 219 ],
          other:  [ 20, 21, 30, 100, 101, 120, 201, 220, 301, 1.2, 2.07, 11.94, 20.81 ]
        }
      });
    });

    it('Arabic', function () {
      testPluralizarionRules({
        langs: [ 'ar' ],
        forms: [ 'zero', 'one', 'two', 'few', 'many', 'other' ],
        count: {
          zero:   [ 0 ],
          one:    [ 1 ],
          two:    [ 2 ],
          few:    [ 3, 4, 10, 103, 104, 110, 203, 204, 210 ],
          many:   [ 11, 12, 13, 20, 99, 111, 112, 120, 199, 211, 299 ],
          other:  [ 100, 101, 102, 200, 201, 202, 300, 301, 302, 0.2, 1.07, 2.94, 3.81, 11.68, 100.55 ]
        }
      });
    });

    it('Breton', function () {
      testPluralizarionRules({
        langs: [ 'br' ],
        forms: [ 'zero', 'one', 'two', 'few', 'many', 'other' ],
        count: {
          zero:   [ 0 ],
          one:    [ 1 ],
          two:    [ 2 ],
          few:    [ 3 ],
          many:   [ 6 ],
          other:  [ 4, 5, 7, 10, 990, 0.2, 1.07, 2.94, 3.81, 6.68, 4.55 ]
        }
      });
    });

    //
    // Fractional mutations
    //

    it('French', function () {
      testPluralizarionRules({
        langs: [ 'fr' ],
        forms: [ 'one', 'other' ],
        count: {
          one:    [ 0, 0.5, 1, 1.5 ],
          other:  [ 2, 2.5, 3, 10 ]
        }
      });
    });

    it('Langi', function () {
      testPluralizarionRules({
        langs: [ 'lag' ],
        forms: [ 'zero', 'one', 'other' ],
        count: {
          zero:   [ 0 ],
          one:    [ 0.5, 1, 1.5 ],
          other:  [ 2, 2.5, 3, 10 ]
        }
      });
    });
  });


  describe('Wrong params', function () {

    it('Returns error message with unknown language', function () {
      assert.equal(
        pluralize('unknown', 1, [ 'one' ]),
        '[pluralizer for (unknown) not exists]'
      );
    });

    it('Returns error message With insufficient plural form', function () {
      assert.equal(
        pluralize('ru', 1.1, [ 'one', 'few', 'many' ]),
        '[plural form N3 not found in translation]'
      );
    });
  });
});
