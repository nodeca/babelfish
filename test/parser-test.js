'use strict';


var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');


var ScalarNode = Parser.Nodes.ScalarNode;
var VariableNode = Parser.Nodes.VariableNode;
var PluralNode = Parser.Nodes.PluralNode;


function testParsedNodes(definitions) {
  var tests = {};

  Object.getOwnPropertyNames(definitions).forEach(function (str) {
    tests[str] = function () {
      var expected, result;

      expected = definitions[str];
      result = Parser.parse(str);

      // make sure we have expected amount of nodes
      Assert.equal(result.length, expected.length, 'Unexpected amount of nodes.');

      result.forEach(function (node, idx) {
        Assert.deepEqual(node, expected[idx]);
      });
    };
  });

  return tests;
}


function regExpMatch(str, data) {
  return function (re) {
    var m = re.exec(str);
    Assert.isNotNull(m, 'Pattern does not match the string.');
    data.forEach(function (expected, idx) {
      Assert.equal(m[idx], expected);
    });
  };
}


require('vows').describe('BabelFish.Parser').addBatch({
  'Parsing strings': testParsedNodes({
    'Simple string }{ with \b brackets and \t special chars': [
      new ScalarNode('Simple string }{ with \b brackets and \t special chars')
    ],

    'Quirky #{} #{1} #{  } foo bar. #{. (.) . (.).} bazzz.%{}$_ mess': [
      new ScalarNode('Quirky #{} #{1} #{  } foo bar. #{. (.) . (.).} bazzz.%{}$_ mess')
    ],

    'String with simple #{variable}...': [
      new ScalarNode('String with simple '),
      new VariableNode('variable'),
      new ScalarNode('...')
    ],

    'String with complex #{foo.bar.baz} variable': [
      new ScalarNode('String with complex '),
      new VariableNode('foo.bar.baz'),
      new ScalarNode(' variable')
    ],

    'String with plurals %{a|b}:c': [
      new ScalarNode('String with plurals '),
      new PluralNode('c', ['a', 'b'])
    ],

    'Plurals with %{a\\}b\\|c\\{d|e}:myvar, escaping': [
      new ScalarNode('Plurals with '),
      new PluralNode('myvar', ['a}b|c{d', 'e']),
      new ScalarNode(', escaping')
    ],

    'Plurals with %{a|b}:_compl3x.$variable.': [
      new ScalarNode('Plurals with '),
      new PluralNode('_compl3x.$variable', ['a', 'b']),
      new ScalarNode('.')
    ],

    'Invalid count of %{a|b}:... plurals.': [
      new ScalarNode('Invalid count of %{a|b}:... plurals.')
    ],

    'Plurals with empty %{}:myvar forms': [
      new ScalarNode('Plurals with empty %{}:myvar forms')
    ],

    'Plurals with single %{abc}:$myvar forms': [
      new ScalarNode('Plurals with single '),
      new PluralNode('$myvar', ['abc']),
      new ScalarNode(' forms')
    ],

    'Plurals with lots of forms %{b|c|d|e|f|g|h}:a': [
      new ScalarNode('Plurals with lots of forms '),
      new PluralNode('a', ['b', 'c', 'd', 'e', 'f', 'g', 'h'])
    ],

    'Escape \\%{a|b|}:plurals and \\#{variables}': [
      new ScalarNode('Escape %{a|b|}:plurals and #{variables}')
    ],

    'Invalid variable #{n..e}': [
      new ScalarNode('Invalid variable #{n..e}')
    ],

    'Escape backslash %{a\\\\|b}:c': [
      new ScalarNode('Escape backslash '),
      new PluralNode('c', ['a\\', 'b'])
    ]
  }),


  //////////////////////////////////////////////////////////////////////////////


  'MACROS_REGEXP': {
    topic: Parser.MACROS_REGEXP,

    'matches only when valid macros presented': function (re) {
      Assert.isNull(re.exec(''));
      Assert.isNotNull(re.exec('foo %{f}:v bar'));
    },

    // [0] -> macthed string
    // [1] -> leading string
    // [2] -> variable anchor
    // [3] -> plural forms
    // [4] -> plural anchor

    'matches macros with leading string':
      regExpMatch('< %{f}:v ...', [
        '< %{f}:v', '< ', undefined, 'f', 'v'
      ]),

    'matches macros without leading string':
      regExpMatch('%{f}:v ...', [
        '%{f}:v', '', undefined, 'f', 'v'
      ]),

    'skips escaped plurals':
      regExpMatch('< \\%{f1}:v1 %{f2}:v2 ...', [
        '< \\%{f1}:v1 %{f2}:v2', '< \\%{f1}:v1 ', undefined, 'f2', 'v2'
      ]),

    'skips escaped variables':
      regExpMatch('\\#{v1} %{f2}:v2 ...', [
        '\\#{v1} %{f2}:v2', '\\#{v1} ', undefined, 'f2', 'v2'
      ]),

    'allows squeezed macros':
      regExpMatch('<%{f}:v#{v}>', [
        '<%{f}:v', '<', undefined, 'f', 'v'
      ]),

    'disallows invalid variable names in interpolation macros':
      regExpMatch('#{a\\|b}#{v}...', [
        '#{a\\|b}#{v}', '#{a\\|b}', 'v', undefined, undefined
      ]),

    'allows escaping of `|` (pipe) inside plural forms':
      regExpMatch('%{a\\||b}:v', [
        '%{a\\||b}:v', '', undefined, 'a\\||b', 'v'
      ]),

    'allows escaping of `}` inside plural forms':
      regExpMatch('%{a\\}|b}:v', [
        '%{a\\}|b}:v', '', undefined, 'a\\}|b', 'v'
      ]),

    'allows escaping of `\\` to void macros escaping':
      regExpMatch('\\\\#{a}#{b}', [
        '\\\\#{a}#{b}', '\\\\#{a}', 'b', undefined, undefined
      ]),

    'allows escaping of `\\` inside macros':
      regExpMatch('%{a\\\\|b}:v', [
        '%{a\\\\|b}:v', '', undefined, 'a\\\\|b', 'v'
      ]),

    'matches complex variable name':
      regExpMatch('#{$._.foobar}:...', [
        '#{$._.foobar}', '', '$._.foobar', undefined, undefined
      ]),

    'does not include trailing dot in plural anchor':
      regExpMatch('%{f}:foo.', [
        '%{f}:foo', '', undefined, 'f', 'foo'
      ]),

    'allows unicode chars':
      regExpMatch('\u1234%{\u1234}:v...', [
        '\u1234%{\u1234}:v', '\u1234', undefined, '\u1234', 'v'
      ])
  },


  //////////////////////////////////////////////////////////////////////////////


  'ANCHOR_REGEXP': {
    topic: Parser.ANCHOR_REGEXP,

    'matches variables with valid first/last char only': function (re) {
      re = new RegExp('^' + re.source + '$', 'i');

      Assert.isNotNull(re.exec('foobar'));
      Assert.isNull(re.exec('.foobar'));
      Assert.isNull(re.exec('foobar.'));
    },

    'allows /a-z/i letters only': function (re) {
      Assert.isNull('привет'.match(re));
    },

    'matches simple variables': function (re) {
      ['simple', '$$$', '_myVar', 'var_n4m3', 'a10'].forEach(function (str) {
        regExpMatch(str, [str, str])(re);
      });
    },

    'matches complex variables': function (re) {
      ['foo.bar', 'a.b.c.d.e', '_foo_._', '$foo$.$', '_', '$'].forEach(function (str) {
        regExpMatch(str, [str, str])(re);
      });
    },

    'matches first valid name': function (re) {
      regExpMatch('Jožin', ['Jo', 'Jo'])(re);
      regExpMatch('.foobar', ['foobar', 'foobar'])(re);
      regExpMatch('foobar.', ['foobar', 'foobar'])(re);
    }
  }
}).export(module);
