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

  data = require(Path.join(ISSUES_DIR, f));

  issues[data.title] = function () {
    try {
      data.test();
    } catch (err) {
      if (!data.fixed && 'AssertionError' === err.name) {
        throw {pending: 'Needs to be fixed'};
      }

      throw err;
    }

    if (data.fixed) {
      throw "Test passed, but it shouldn't!";
    }
  };
});


require('vows').describe('Issues').addBatch(issues).export(module);
