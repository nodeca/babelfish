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


// Expose nodes for testing
Parser.Nodes = {
  ScalarNode: ScalarNode,
  VariableNode: VariableNode,
  PluralNode: PluralNode
};


// catch valid variable and object accessor notation
var ANCHOR_REGEXP = new RegExp(
  '([a-z_$](?:[a-z0-9_$]*|\\.[a-z_$][a-z0-9_$]*)*)',
  'i'
);


// finds macros in the translations
var MACROS_REGEXP = new RegExp(
  '(^|.*?[^\\\\])' +            // either nothing, or anything which doesn't end with \ (backslash)
    '(?:' +
      '#{' +                    // interpolation
        ANCHOR_REGEXP.source +  // interpolating variable
      '}' +
    '|' +
      '%{' +                    // pluralization
        '(.*?[^\\\\])(?=})' +   // word forms
      '}:' +
      ANCHOR_REGEXP.source +    // controlling variable
    ')',
  'i'
);

// used to unescape critical chars
var UNESCAPE_CHARS = new RegExp('\\\\([#%}{|\\\\])', 'g');
function unescapeString(str) {
  return str.replace(UNESCAPE_CHARS, '$1');
}

// used to split arguments of plural
var FORMS_SEPARATOR_REGEXP = new RegExp('([\\\\]*)[|]');
function parseForms(str) {
  var forms = [], match, tmp = '';

  while (!!str.length) {
    match = str.match(FORMS_SEPARATOR_REGEXP);

    if (null === match) {
      forms.push(str);
      str = '';
    } else if (1 === match[1].length % 2) {
      tmp += str.slice(0, match.index + match[0].length);
      str = str.slice(match.index + match[0].length);
    } else {
      forms.push(tmp + str.slice(0, match.index + match[0].length - 1));
      str = str.slice(match.index + match[0].length);
      tmp = '';
    }
  }

  return forms.map(unescapeString);
}


// parses string into array of nodes
Parser.parse = function parse(str) {
  var nodes = [], match;

  while (!!str.length) {
    match = str.match(MACROS_REGEXP);

    if (null === match) {
      nodes.push(new ScalarNode(unescapeString(str)));
      break;
    }

    // we have scalars before macros
    if (match[1] && 0 !== match[1].length) {
      nodes.push(new ScalarNode(unescapeString(match[1])));
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
Parser.ANCHOR_REGEXP = ANCHOR_REGEXP;
