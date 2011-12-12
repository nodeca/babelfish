'use strict';


var Parser = module.exports = {};


// parses string into array of "nodes"
Parser.parse = function parse(str) {
  return [{
    type: 'string',
    value: str
  }];
};
