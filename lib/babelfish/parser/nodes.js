'use strict';


module.exports.ScalarNode = function ScalarNode(value) {
  this.type = 'scalar';
  this.value = value;
};


module.exports.VariableNode = function VariableNode(anchor) {
  this.type = 'variable';
  this.anchor = anchor;
};


module.exports.PluralizerNode = function PluralizerNode(anchor, forms) {
  this.type = 'pluralizer';
  this.anchor = anchor;
  this.forms = forms;
};
