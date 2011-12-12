'use strict';


var Nodes = require('./parser/nodes');
var Parser = module.exports = {};


var MACROS_REGEXP = new RegExp(
  "(^|[^\\\\])([#%]){((?:[^\\\\]|\\[\\\\|}])+)}(?::([_a-z][_a-z.]+?[_a-z]))?(?:[^_a-z]|$)",
  "i"
);


var FORMS_SEPARATOR_REGEXP = new RegExp("(^|[^\\\\])[|]");


function parseForms(str) {
  return str.replace(FORMS_SEPARATOR_REGEXP, '$1( . )( . )').split('( . )( . )');
}


// parses string into array of nodes
Parser.parse = function parse(str) {
  var nodes = [], match;

  while (!!str.length) {
    match = str.match(MACROS_REGEXP);

    if (null === match) {
      nodes.push(new Nodes.ScalarNode(str));
      return nodes;
    }

    // we have scalars before macros
    if (match[1] && 0 !== match[1].length) {
      nodes.push(new Nodes.ScalarNode(str.slice(0, match.index + 1)));
    }

    // got variable node
    if ('#' === match[2]) {
      nodes.push(new Nodes.VariableNode(match[3]));
    }

    if ('%' === match[2]) {
      nodes.push(new Nodes.PluralizerNode(match[4], parseForms(match[3])));
    }

    // remove processed data
    str = str.slice(match.index + match[0].length);
  }

  return nodes;
};
