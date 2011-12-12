'use strict';


var Parser = module.exports = {};


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


// finds mac
var MACROS_REGEXP = new RegExp(
  "(^|[^\\\\])" + // [1] match begining of string or any char except \ (backslash)
    "([#%])" + // [2] match operation notation # or %
    "{((?:[^\\\\]|\\[\\\\|}])+)}" +
    "(?::([_a-z](?:[_a-z0-9.]+?[_a-z0-9])?))?" +
    "(?:[^_a-z0-9]|$)",
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
      nodes.push(new ScalarNode(str));
      return nodes;
    }

    // we have scalars before macros
    if (match[1] && 0 !== match[1].length) {
      nodes.push(new ScalarNode(str.slice(0, match.index + 1)));
    }

    // got variable node
    if ('#' === match[2]) {
      nodes.push(new VariableNode(match[3]));
    }

    if ('%' === match[2]) {
      nodes.push(new PluralNode(match[4], parseForms(match[3])));
    }

    // remove processed data
    str = str.slice(match.index + match[0].length);
  }

  return nodes;
};
