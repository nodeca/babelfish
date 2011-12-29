'use strict';


var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');
var Helper = require('./helper');

var MACROS_REGEXP = Parser.MACROS_REGEXP;

require('vows').describe('BabelFish.Parser').addBatch({
  'Parsing simple string': {
    topic: function () {
      return [
        Parser.parse('Просто строка'),
        Parser.parse('    #{ '),
        Parser.parse('    }} '),
        Parser.parse('  }\t\n #{'),
      ];
    },
    'results in text node': function (result) {
      Assert.deepEqual(result, [
        [ { type: 'text', value: 'Просто строка' } ],
        [ { type: 'text', value: '    #{ ' } ],
        [ { type: 'text', value: '    }} ' } ],
        [ { type: 'text', value: '  }\t\n #{' } ],
      ]);
    }
  },
  'Parsing string with variable': {
    topic: function () {
      return Parser.parse('Complex string, with variable foo.bar.baz #{foo.bar.baz}');
    },
    'results in anchor node': function (result) {
      Assert.deepEqual(result, [
        { value: 'Complex string, with variable foo.bar.baz ', type: 'text' },
        { anchor: 'foo.bar.baz', type: 'variable' }
      ]);
    }
  },
  'Parsing strings with quirky interpolation': {
    topic: function () {
      return [
        Parser.parse('#{}'),
        Parser.parse('#{1}'),
        Parser.parse('#{  }'),
        Parser.parse(' foo bar. #{. (.) . (.).} bazzz.%{}$_'),
      ];
    },
    'results in passing string verbatim': function (result) {
      Assert.deepEqual(result, [
        [{value: '#{}', type: 'text'}],
        [{ value: '#{1}', type: 'text' }],
        [{ value: '#{  }', type: 'text' }],
        [{ value: ' foo bar. #{. (.) . (.).} bazzz.%{}$_', type: 'text' }],
      ]);
    }
  },
  'Parsing string with plurals': {
    'quirky but valid variable': {
      topic: function () {
        return [
          Parser.parse('%{a|b|c}:foo_bar$baz.fu.1.bar.baz'),
          Parser.parse('%{a|b|c}:___[0][1][2].a'),
          Parser.parse('%{a|b|c}:...'),
        ];
      },
      'results in sane behavior': function (result) {
        Assert.deepEqual(result, [
          [ { forms: [ 'a', 'b', 'c' ], anchor: 'foo_bar$baz.fu.1.bar.baz', type: 'plural' } ],
          [ { forms: [ 'a', 'b', 'c' ], anchor: '___', type: 'plural' }, { value: '[0][1][2].a', type: 'text'} ],
          [ { value: '%{a|b|c}:...', type: 'text' } ],
        ]);
      }
    },
    'empty plural': {
      topic: function () {
        return Parser.parse('More complex string, with plurals foo_bar$baz.fu %{}:foo_bar$baz.fu');
      },
      'results in passing string intact': function (result) {
        Assert.deepEqual(result, [ { value: 'More complex string, with plurals foo_bar$baz.fu %{}:foo_bar$baz.fu', type: 'text' } ]);
      }
    },
    'only singular form given': {
      topic: function () {
        return Parser.parse('%{fou}:foo_bar$baz.fu');
      },
      'one form got': function (result) {
        Assert.deepEqual(result, [ { forms: [ 'fou' ], anchor: 'foo_bar$baz.fu', type: 'plural' } ]);
      }
    },
    'two forms given': {
      topic: function () {
        return Parser.parse('%{fou  |fous  }:x');
      },
      'two forms got': function (result) {
        Assert.deepEqual(result, [ { forms: [ 'fou  ', 'fous  ' ], anchor: 'x', type: 'plural' } ]);
      }
    },
    'three forms given': {
      topic: function () {
        return Parser.parse('%{fou  |fous  |  multifous  }:x');
      },
      'three forms got': function (result) {
        Assert.deepEqual(result, [ { forms: [ 'fou  ', 'fous  ', '  multifous  ' ], anchor: 'x', type: 'plural' } ]);
      }
    },
    'four forms given': {
      topic: function () {
        return Parser.parse('%{fou  |fous  |  multifous  |}:x');
      },
      'four forms got': function (result) {
        Assert.deepEqual(result, [ { forms: [ 'fou  ', 'fous  ', '  multifous  ', '' ], anchor: 'x', type: 'plural' } ]);
      }
    }
  },
  'MACROS_REGEXP': {
    'allows escaped argument separator as part of argument': {
      topic: function () {
        return [
          '%{a|b|c}:x'.match(MACROS_REGEXP).slice(0, 5),
          '%{a\||b \||\\|  c}:x'.match(MACROS_REGEXP).slice(0, 5),
          '%{\u007d|1|2}:x'.match(MACROS_REGEXP).slice(0, 5),
        ];
      },
      'good': function (result) {
        Assert.isArray(result[0]);
        Assert.deepEqual(result[0], ['%{a|b|c}:x', '', undefined, 'a|b|c', 'x']);
      },
      'bad': function (result) {
        Assert.isArray(result[1]);
        Assert.deepEqual(result[1], ['%{a\||b \||\\|  c}:x', '', undefined, 'a\||b \||\\|  c', 'x']);
      },
      'ugly': function (result) {
        Assert.isArray(result[2]);
        Assert.deepEqual(result[2], ['%{\u007d|1|2}:x', '', undefined, '\u007d|1|2', 'x']);
      },
    },
    'allows escaped macros close char as part of argument': {
      topic: function () {
        return [
          '#{c\}}'.match(MACROS_REGEXP).slice(0, 3),
          '%{ |c\}}:x'.match(MACROS_REGEXP).slice(0, 5),
          '%{ \||||c\}\\}:x'.match(MACROS_REGEXP).slice(0, 5),
        ];
      },
      'for interpolation': function (result) {
        Assert.isArray(result[0]);
        Assert.deepEqual(result[0], ['#{c}', '', 'c']);
      },
      'for pluralization': function (result) {
        Assert.isArray(result[1]);
        Assert.deepEqual(result[1], ['%{ |c\}}:x', '', undefined, ' |c\}', 'x']);
      },
      'for pluralization, plus spiky backslashes': function (result) {
        Assert.isArray(result[2]);
        Assert.deepEqual(result[2], ['%{ \||||c\}\\}:x', '', undefined, ' \||||c\}\\', 'x']);
      },
    },
    'attempt at fixing regexp for interpolation': {
      topic: function () {
        return '#{c\}}'.match(MACROS_REGEXP).slice(0, 3);
      },
      'works': function (result) {
        Assert.isArray(result);
        Assert.deepEqual(result, ['#{c}', '', 'c']);
      },
    },
    'attempt at fixing regexp for pluralization': {
      topic: function () {
        return '%{ |c\}}:x'.match(MACROS_REGEXP).slice(0, 5);
      },
      'works': function (result) {
        Assert.isArray(result);
        Assert.deepEqual(result, ['%{ |c\}}:x', '', undefined, ' |c\}', 'x']);
      },
    },
    'attempt at fixing regexp for pluralization, plus spiky backslashes': {
      topic: function () {
        return '%{ \||||c\}\\}:x'.match(MACROS_REGEXP).slice(0, 5);
      },
      'works': function (result) {
        Assert.isArray(result);
        Assert.deepEqual(result, ['%{ \||||c\}\\}:x', '', undefined, ' \||||c\}\\', 'x']);
      },
    },
  }
}).export(module);
