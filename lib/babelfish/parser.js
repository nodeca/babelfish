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
    //"(?::([$_a-z](?:[$_a-z0-9.]+?[$_a-z0-9])?))*" + // [4] plural anchor
    //"(?::([$_a-z][$_a-z0-9.]+))" + ,// [4] plural anchor
    "(?::([$_a-z][$_a-z0-9.]+))",// [4] plural anchor
    //(?:[^$_a-z0-9]|$)",
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


// export MACROS_REGEXP for testing
Parser.MACROS_REGEXP = MACROS_REGEXP;


function ___compile___(str, locale) {

  //
  // JavaScript micro-templating, similar to John Resig's implementation
  //
  //var self = this,
  var re_interpolate1 = /#\{([\s\S]+?)\}/g,
    re_interpolate2 = /%\{([\s\S]+?)\}:([\w.$]+)/g,
    re_inflect = /^([\w.$]+?) +([\s\S]+)/,
    interpolated = false,
    nonce = '~~~' + Math.random().toString().substring(2) + '~~~',
    re_unescape = new RegExp(nonce, 'g'),
    tmpl,
    fn;

  str = String(str || '');
  tmpl = "var __p=this.p('" + locale + "');with(locals||{}){return ['" + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    // }} are escaped to not interfere with closing }
    // FIXME: this is redundant for simple strings!
    .replace(/\}\}/g, nonce)
    // #{var forms...}
    .replace(re_interpolate1, function (match, inner) {
      interpolated = true;
      inner = inner.replace(/\\'/, "'");
      var m = re_inflect.exec(inner), forms;
      if (m) {
        // unescape }} and parse word forms
        forms = m[2].replace(re_unescape, '}').split('|');
        return '\',__p(' + m[1] + ',' + JSON.stringify(forms) + '),\'';
        // #{this.foo.bar} is sugar for this.t('foo.bar', locals)
      } else if (inner.indexOf('this.') === 0) {
        return '\',this.t("' + inner.substring(5) + '",locals),\'';
      } else {
        return '\',' + inner + ',\'';
      }
    })
    // %{forms...}:var
    .replace(re_interpolate2, function (match, forms, variable) {
      interpolated = true;
      forms = forms.replace(/\\'/, "'");
      variable = variable.replace(/\\'/, "'");
      // unescape }} and parse word forms
      forms = forms.replace(re_unescape, '}').split('|');
      return '\',__p(' + variable + ',' + JSON.stringify(forms) + '),\'';
    })
    // unescape orphan }}
    .replace(re_unescape, '}') + "'].join('')}";
    //return interpolated ? tmpl : str;
    //console.log(tmpl);
  if (interpolated) {
    /*jslint evil: true*/
    //fn = (new Function('locals', tmpl)).bind(self);
    fn = (new Function('locals', tmpl));
    /*jslint evil: false*/
    fn.body = tmpl;
    return fn;
  } else {
    return str;
  }
}
