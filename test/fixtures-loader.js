// Fixtures loader/parcer. Should be move to separate
// package after testing with another projects.
'use strict';

var fs = require('fs');
var p  = require('path');

function parse(input, options) {
  var lines = input.split(/\r?\n/g),
      max = lines.length,
      min = 0,
      line = 0,
      fixture, i, l, currentSep, blockStart;

  var result = {
    fixtures: []
  };

  var sep = options.sep;

  // Try to parse meta
  if (/^-{3,}$/.test(lines[0] || '')) {
    line++;
    while (line < max && !/^-{3,}$/.test(lines[line])) { line++; }

    // If meta end found - extract range
    if (line < max) {
      result.meta = lines.slice(2, line).join('\n');
      line++;
      min = line;

    } else {
      // if no meta closing - reset to start and try to parse data without meta
      line = 0;
    }
  }

  // Scan fixtures
  while (line < max) {
    if (sep.indexOf(lines[line]) < 0) {
      line++;
      continue;
    }

    currentSep = lines[line];

    fixture = {
      type: currentSep,
      header: '',
      first: {
        text: '',
        range: []
      },
      second: {
        text: '',
        range: []
      }
    };

    line++;
    blockStart = line;

    // seek end of first block
    while (line < max && lines[line] !== currentSep) { line++; }
    if (line >= max) { break; }

    fixture.first.text = lines.slice(blockStart, line).join('\n');
    fixture.first.range.push(blockStart, line);
    line++;
    blockStart = line;

    // seek end of second block
    while (line < max && lines[line] !== currentSep) { line++; }
    if (line >= max) { break; }

    fixture.second.text = lines.slice(blockStart, line).join('\n');
    fixture.second.range.push(blockStart, line);
    line++;

    // Look back for header on 2 lines before texture blocks
    i = fixture.first.range[0] - 2;
    while (i >= Math.max(min, fixture.first.range[0] - 3)) {
      l = lines[i];
      if (sep.indexOf(l) >= 0) { break; }
      if (l.trim().length) {
        fixture.header = l.trim();
        break;
      }
      i--;
    }

    result.fixtures.push(fixture);
  }

  return (result.meta || result.fixtures.length) ? result : null;
}


// Read fixtures recursively, and run iterator on parsed content
//
// Options
//
// - sep (String|Array) - allowed fixture separator(s)
//
// Parsed data fields:
//
// - file (String): file name
// - meta (Mixed):  metadata from header, if exists
// - fixtures
//
function load(path, options, iterator) {
  var input, parsed,
      stat = fs.statSync(path);

  if (typeof options === 'function') {
    iterator = options;
    options = { sep: [ '.' ] };
  } else if (typeof options === 'string') {
    options = { sep: options.split('') };
  } else if (Array.isArray(options)) {
    options = { sep: options };
  }

  if (stat.isFile()) {
    input = fs.readFileSync(path, 'utf8');

    parsed = parse(input, options);

    if (!parsed) { return null; }

    parsed.file = path;

    if (iterator) {
      iterator(parsed);
    }
    return parsed;
  }

  var result, res;
  if (stat.isDirectory()) {
    result = [];

    fs.readdirSync(path).forEach(function (name) {
      res = load(p.join(path, name), options, iterator);
      if (Array.isArray(res)) {
        result = result.concat(res);
      } else if (res) {
        result.push(res);
      }
    });

    return result;
  }

  // Silently other entries (symlinks and so on)
  return null;
}

module.exports = load;
