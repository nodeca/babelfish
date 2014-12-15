/*global describe, it*/
'use strict';


var assert = require('assert');
var p      = require('path');

var load = require('./fixtures-loader');
var Babelfish = require('../');

function parseLine(str) {
  var m = str.match(/^(\^([^:]+):)?(.*?)(\^\^([\S].*))?$/);

  if (!m) { return null; }

  var res = {
    locale: m[2] || 'en',
    text: m[3],
    params: m[5]
  };

  // Cast objects and numbers, if possible
  var obj;
  try {
    obj = JSON.parse(res.params);
    res.params = obj;
  } catch (__) {}

  return res;
}

// Add tests from specified path (file or directory)
//
function addTests(path) {

  load(path, '.|', function (data) {
    if (!data.fixtures.length) { return; }

    var meta = data.meta || {};
    var name = meta.describe || meta.desc || data.file;

    (meta.skip ? describe.skip : describe)(name, function () {

      data.fixtures.forEach(function (fixture) {
        it(fixture.header ? fixture.header : 'line ' + fixture.first.range[0] - 1, function () {
          var b, first, second;

          // "|" type - process by lines and compare one-by-one from both sections
          if (fixture.type === '|') {
            first = fixture.first.text.split(/\r?\n/g);
            second = fixture.second.text.split(/\r?\n/g);

            if (first.length !== second.length) {
              throw new Error('Fixture sections should have equal lines count at ',
                fixture.first.range[0]);
            }

            first.forEach(function (line, idx) {
              var input = parseLine(line),
                  output = parseLine(second[idx]);

              assert.notEqual(null, input, "Can't parse line " + (fixture.first.range[0] + idx));
              assert.notEqual(null, output, "Can't parse line " + (fixture.second.range[0] + idx));

              b = new Babelfish();

              b.addPhrase(input.locale, 'test', input.text);
              assert.strictEqual(b.t(output.locale, 'test', output.params), output.text);
            });
            return;
          }

          // "." type - load all from first section, then check all from second
          if (fixture.type === '.') {
            first = fixture.first.text.split(/\r?\n/g);
            second = fixture.second.text.split(/\r?\n/g);

            b = new Babelfish();

            first.forEach(function (line, idx) {
              var input = parseLine(line);

              assert.notEqual(null, input, "Can't parse line " + (fixture.first.range[0] + idx));
              b.addPhrase(input.locale, 'test', input.text);
            });

            second.forEach(function (line, idx) {
              var output = parseLine(line);

              assert.notEqual(null, output, "Can't parse line " + (fixture.second.range[0] + idx));
              assert.strictEqual(b.t(output.locale, 'test', output.params), output.text);
            });
            return;
          }

          throw new Error('Something go wrong');
        });
      });

    });
  });
}

// module.exports.addTests = addTests;

addTests(p.join(__dirname, 'fixtures'));
