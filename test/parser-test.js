'use strict';


var Underscore = require('underscore');
var Assert = require('assert');
var Parser = require('../lib/babelfish/parser');


function LiteralNode(text) {
  this.type = 'literal';
  this.text = text;
}


function VariableNode(anchor) {
  this.type   = 'variable';
  this.anchor = anchor;
}


function PluralNode(anchor, forms) {
  this.type   = 'plural';
  this.forms  = forms;
  this.anchor = anchor || 'count';
}


// Merge several continuous `literal` nodes together
function redistribute_ast(ast) {
  var nodes = [], last = {};

  Underscore.each(ast, function (node) {
    if ('literal' === last.type && 'literal' === node.type) {
      last.text += node.text;
      return;
    }

    nodes.push(node);
    last = node;
  });

  return nodes;
}


function testParsedNodes(definitions) {
  var tests = {};

  Object.getOwnPropertyNames(definitions).forEach(function (str) {
    tests[str] = function () {
      var expected, result;

      expected = definitions[str];
      result = redistribute_ast(Parser.parse(str));

      // make sure we have expected amount of nodes
      if (result.length !== expected.length) {
        Assert.ok(false, 'Unexpected amount of nodes.' +
                  '\nExpected:  ' + expected.length +
                  '\nActual:    ' + result.length +
                  '\n' + result.map(function (o) {
                    var ret = '\n - type: ' + o.type;

                    if (o.anchor) { ret += '\n   anchor: ' + o.anchor; }
                    if (o.forms) { ret += '\n   forms: ' + o.forms; }
                    if (o.text) { ret += '\n   text: ' + o.text; }

                    return ret;
                  }));
      }

      result.forEach(function (node, idx) {
        Assert.deepEqual(node, expected[idx]);
      });
    };
  });

  return tests;
}


require('vows').describe('BabelFish.Parser').addBatch({
  'Parsing strings': testParsedNodes({
    'Simple string }{ with \b brackets and \t special chars': [
      new LiteralNode('Simple string }{ with \b brackets and \t special chars')
    ],

    'Quirky #() #(1) #(  ) foo bar. #(. (.) . (.).) bazzz.{{}}$_ mess': [
      new LiteralNode('Quirky #() #(1) #(  ) foo bar. #(. (.) . (.).) bazzz.{{}}$_ mess')
    ],

    'String with simple #(variable)...': [
      new LiteralNode('String with simple '),
      new VariableNode('variable'),
      new LiteralNode('...')
    ],

    'String with complex #(foo.bar.baz) variable': [
      new LiteralNode('String with complex '),
      new VariableNode('foo.bar.baz'),
      new LiteralNode(' variable')
    ],

    'String with plurals {{a|b}}:c': [
      new LiteralNode('String with plurals '),
      new PluralNode('c', ['a', 'b'])
    ],

    'Plurals with {{a\\}b\\|c\\{d|e}}:myvar, escaping': [
      new LiteralNode('Plurals with '),
      new PluralNode('myvar', ['a}b|c{d', 'e']),
      new LiteralNode(', escaping')
    ],

    'Plurals with {{a|b}}:_compl3x.$variable.': [
      new LiteralNode('Plurals with '),
      new PluralNode('_compl3x.$variable', ['a', 'b']),
      new LiteralNode('.')
    ],

    'Plurals with empty {{}}:myvar forms': [
      new LiteralNode('Plurals with empty {{}}:myvar forms')
    ],

    'Plurals with single {{abc}}:$myvar forms': [
      new LiteralNode('Plurals with single '),
      new PluralNode('$myvar', ['abc']),
      new LiteralNode(' forms')
    ],

    'Plurals with lots of forms {{b|c|d|e|f|g|h}}:a': [
      new LiteralNode('Plurals with lots of forms '),
      new PluralNode('a', ['b', 'c', 'd', 'e', 'f', 'g', 'h'])
    ],

    'Escape \\{{a|b|}}:plurals and \\#(variables)': [
      new LiteralNode('Escape {{a|b|}}:plurals and #(variables)')
    ],

    'Invalid variable #(n..e)': [
      new LiteralNode('Invalid variable #(n..e)')
    ],

    'Escape backslash {{a\\\\|b}}:c': [
      new LiteralNode('Escape backslash '),
      new PluralNode('c', ['a\\', 'b'])
    ],

    'Automagically set {{anchor|to|count}} when plural have no anchor': [
      new LiteralNode('Automagically set '),
      new PluralNode('count', ['anchor', 'to', 'count']),
      new LiteralNode(' when plural have no anchor')
    ],

    'Treat {{trailing|semicolumn}}: literally and use automagic anchor': [
      new LiteralNode('Treat '),
      new PluralNode('count', ['trailing', 'semicolumn']),
      new LiteralNode(': literally and use automagic anchor')
    ]
  })
}).export(module);
