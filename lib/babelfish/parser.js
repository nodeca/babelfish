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


// finds macros in the translations
var MACROS_REGEXP = new RegExp(
  "(^|[^\\\\])" + // [1] match begining of string or any char except \ (backslash)
    "([#%])" + // [2] match operation notation # or %
    "{((?:[^\\\\}]|\\})+)}" + // [3] arguments
    "(?::([_a-z](?:[_a-z0-9.]+?[_a-z0-9])?))?" + // [4] plural anchor
    "(?:[^_a-z0-9]|$)",
  "i"
);


// used to split arguments of plural
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
      console.log('VAR', match[3]);
      // simple sanity check -- whether variable name start with a letter
      if (match[3].match(/^[a-zA-Z_$]/)) {
        nodes.push(new VariableNode(match[3]));
      } else {
        nodes.push(new ScalarNode(match[3]));
      }
    }

    if ('%' === match[2]) {
      nodes.push(new PluralNode(match[4], parseForms(match[3])));
    }

    // remove processed data
    str = str.slice(match.index + match[0].length);
  }

  return nodes;
};


// export MACROS_REGEXP for testing
Parser.MACROS_REGEXP = MACROS_REGEXP;
