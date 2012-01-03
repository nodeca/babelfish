'use strict';


var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');
var Helper = require('./helper');


/*
var MACROS_REGEXP = Parser.MACROS_REGEXP;
var VAR_REGEXP = new RegExp('^' + Parser.VAR_REGEXP_SOURCE, 'i');


function testVar(str, check) {
  return {
    topic: function () {
      var r = str.match(VAR_REGEXP);
      return r ? r.slice(0, 2) : r;
    },
    'ok': function (result) {
      Assert.deepEqual(result, check);
    }
  };
}
*/


function testParsedNodes(definitions) {
  var tests = {};

  Object.getOwnPropertyNames(definitions).forEach(function (str) {
    tests[str] = function () {
      var expected, result, msg;

      expected = definitions[str];
      result = Parser.parse(str);

      // make sure we have expected amount of nodes
      Assert.equal(result.length, expected.length, 'Same amount of nodes.');

      result.forEach(function (node, idx) {
        Assert.deepEqual(node, expected[idx]);
      });
    };
  });

  return tests;
}


// Nodes constructor from Parser

function ScalarNode(value) {
  this.type = 'text';
  this.value = value;
}


function VariableNode(anchor) {
  this.type = 'variable';
  this.anchor = anchor;
}


function PluralNode(anchor, forms) {
  this.type = 'plural';
  this.anchor = anchor;
  this.forms = forms;
}


require('vows').describe('BabelFish.Parser').addBatch({
  // Parse resulting nodes
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

    'Plurals with %{a\\}b\\|c|d}:myvar, escaping': [
      new ScalarNode('Plurals with '),
      new PluralNode('myvar', ['a}b|c', 'd']),
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
  })
  /*
  'MACROS_REGEXP': {
    'allows escaped argument separator as part of argument': {
      topic: function () {
        return [
          ' texte1 %{a|b|c}:x  texte2 '.match(MACROS_REGEXP).slice(0, 5),
          ' texte1 %{a\\||b \\||\\|  c}:x  texte2 '.match(MACROS_REGEXP).slice(0, 5),
          " texte1 %{\u00AB|1|2}:x  texte2 ".match(MACROS_REGEXP).slice(0, 5)
        ];
      },
      'good': function (result) {
        Assert.isArray(result[0]);
        Assert.deepEqual(result[0], [' texte1 %{a|b|c}:x', ' texte1 ', undefined, 'a|b|c', 'x']);
      },
      'bad': function (result) {
        Assert.isArray(result[1]);
        Assert.deepEqual(result[1], [' texte1 %{a\\||b \\||\\|  c}:x', ' texte1 ', undefined, 'a\\||b \\||\\|  c', 'x']);
      },
      'ugly': function (result) {
        Assert.isArray(result[2]);
        Assert.deepEqual(result[2], [' texte1 %{\u00AB|1|2}:x', ' texte1 ', undefined, '\u00AB|1|2', 'x']);
      }
    },
    'allows escaped macros close char as part of argument': {
      topic: function () {
        return [
          ' pretexte1 %{ |c\\}}:x soustexte2 '.match(MACROS_REGEXP).slice(0, 5),
          ' text1 %{ \\||||c\\}:\\}:x text2 '.match(MACROS_REGEXP),
          ' text1 %{ \\||||c\\}:\\}}:x text2 '.match(MACROS_REGEXP).slice(0, 5)
        ];
      },
      'for pluralization': function (result) {
        Assert.isArray(result[0]);
        Assert.deepEqual(result[0], [' pretexte1 %{ |c\\}}:x', ' pretexte1 ', undefined, ' |c\\}', 'x']);
      },
      'for pluralization, if it is done properly': function (result) {
        Assert.isNull(result[1]);
      },
      'for pluralization, plus spiky backslashes': function (result) {
        Assert.isArray(result[2]);
        Assert.deepEqual(result[2], [' text1 %{ \\||||c\\}:\\}}:x', ' text1 ', undefined, ' \\||||c\\}:\\}', 'x']);
      }
    },
    'disallows escaped macros close char in interpolation': {
      topic: function () {
        return [
          ' texte1 #{c\\}} texte2 '.match(MACROS_REGEXP),
          ' texte1 #{c\\} texte2 '.match(MACROS_REGEXP)
        ];
      },
      'properly closed': function (result) {
        Assert.isNull(result[0]);
      },
      'improperly closed': function (result) {
        Assert.isNull(result[1]);
      }
    }
  },
  'Variable parsing': {
    'extracting 1': testVar('a', ['a', 'a']),
    'extracting 2': testVar('a.a', ['a.a', 'a.a']),
    'extracting 3': testVar('a.a.aaa.aaaa', ['a.a.aaa.aaaa', 'a.a.aaa.aaaa']),
    'extracting 4': testVar('a_$.$$$a.____aa_a.aaaa._.$', ['a_$.$$$a.____aa_a.aaaa._.$', 'a_$.$$$a.____aa_a.aaaa._.$'])
  },
  'Variable parsing false positives': {
    'extracting 1': testVar('ф', null),
    'extracting 2': testVar('a..a', ['a', 'a']),
    'extracting 3': testVar('a.a.', ['a.a', 'a.a']),
    'extracting 4': testVar('.a', null),
    'extracting 5': testVar('.', null),
    'extracting 6': testVar('....', null),
    'extracting 7': testVar('Jožin z bažin', ['Jo', 'Jo'])
  }
  */
}).export(module);
