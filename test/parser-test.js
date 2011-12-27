'use strict';


var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');
var Helper = require('./helper');


require('vows').describe('BabelFish.Parser').addBatch({
  'Parsing simple string': {
    topic: function () {
      return Parser.parse('Просто строка');
    },
    'results in simple string': function (result) {
      Assert.deepEqual(result, [ { type: 'text', value: 'Просто строка' } ]);
    }
  },
  'Parsing string with variable': {
    topic: function () {
      return Parser.parse('Complex string, with variable foo.bar.baz #{foo.bar.baz}');
    },
    'results in function': function (result) {
      Assert.deepEqual(result, [ { value: 'Complex string, with variable foo.bar.baz ', type: 'text' }, { anchor: 'foo.bar.baz', type: 'variable' } ]);
    }
  },
  'Parsing string with plurals': {
    'empty plurals': {
      topic: function () {
        return Parser.parse('More complex string, with plurals foo_bar$baz.fu %{}:foo_bar$baz.fu');
      },
      'results in function': function (result) {
        Assert.deepEqual(result, [ { value: 'More complex string, with plurals foo_bar$baz.fu %{}:foo_bar$baz.fu', type: 'text' } ]);
      }
    },
    'singular form': {
      topic: function () {
        return Parser.parse('More complex string, with plurals foo_bar$baz.fu %{fou}:foo_bar$baz.fu');
      },
      'results in function': function (result) {
        Assert.deepEqual(result, [ { value: 'More complex string, with plurals foo_bar$baz.fu ', type: 'text' }, { forms: [ 'fou' ], anchor: 'foo_bar', type: 'plural' }, { value: 'baz.fu', type: 'text' } ]);
      }
    }
  },
  'MACROS_REGEXP': {
    'allows escaped argument separtor as part of argument': 'TBD',
    'allows escaped macros close char as part of argument': 'TBD'
  }
}).export(module);
