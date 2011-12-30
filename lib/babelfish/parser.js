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
/*var MACROS_REGEXP = new RegExp(
  "(^|[^\\\\])" + // [1] match begining of string or any char except \ (backslash)
    "([#%])" + // [2] match operation notation # or %
    "{((?:[^\\\\}]|\\})+)}" + // [3] arguments
    "(?::([_$a-z](?:[_$a-z0-9.]*?[_$a-z0-9])?))?" + // [4] plural anchor
    "(?:[^_$a-z0-9]|$)",
  "i"
);*/

// catch valib variable and object accessor notation
var VAR_REGEXP_SOURCE = '([a-z_$](?:[a-z0-9_$]*|\\.[a-z_$][a-z0-9_$]*)*)';

var MACROS_REGEXP = new RegExp(
  '(^|.*?[^\\\\])' +            // plain string
    '(?:' +
      '#{' +                    // interpolation
        VAR_REGEXP_SOURCE +     // interpolating variable
      '}' +
    '|' +
      '%{' +                    // pluralization
        '(.*?[^\\\\])(?=})' +   // word forms
      '}:' +
      VAR_REGEXP_SOURCE +       // controlling variable
    ')',
  'i'
);

// used to split arguments of plural
var FORMS_SEPARATOR_REGEXP = new RegExp("(^|[^\\\\])[|]", 'g');


function parseForms(str) {
  return str
    // split by non-escaped '|'
    .replace(FORMS_SEPARATOR_REGEXP, '$1( . )( . )')
    .split('( . )( . )')
    // strip escaping
    .map(function (s) {
      return s.replace(/\\/g, '');
    });
}


// parses string into array of nodes
Parser.parse = function parse(str) {
  var nodes = [], match;

  while (!!str.length) {
    match = str.match(MACROS_REGEXP);

    if (null === match) {
      nodes.push(new ScalarNode(str.replace(/\\/g, '')));
      break;
    }

    // we have scalars before macros
    if (match[1] && 0 !== match[1].length) {
      nodes.push(new ScalarNode(match[1].replace(/\\/g, '')));
    }

    // got variable node
    if (undefined !== match[2]) {
      nodes.push(new VariableNode(match[2]));
    // got plurals
    } else {
      nodes.push(new PluralNode(match[4], parseForms(match[3])));
    }

    // remove processed data
    str = str.slice(match.index + match[0].length);
  }

  return nodes;
};


// export RegExps for unit testing
Parser.MACROS_REGEXP = MACROS_REGEXP;
Parser.VAR_REGEXP_SOURCE = VAR_REGEXP_SOURCE;
