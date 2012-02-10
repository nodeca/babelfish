'use strict';


var Fs = require('fs');
var Path = require('path');


var ISSUES_DIR = Path.join(__dirname, 'issues');


var re = /[.]js$/;
var issues = {};
Fs.readdirSync(ISSUES_DIR).forEach(function (f) {
  var data;

  if (!re.test(f)) {
    // skip non-js files
    return;
  }

  data= require(Path.join(ISSUES_DIR, f));

  issues[data.title] = function () {
    data.test();
    if (data.fixed) {
      throw "Test passed, but it shouldn't!";
    }
  };
});


require('vows').describe('Issues').addBatch(issues).export(module);
