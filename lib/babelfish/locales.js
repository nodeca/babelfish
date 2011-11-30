var fs = require('fs'),
    path = require('path'),
    common = require('./common');


// pluralization:
// http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html


fs.readdirSync(path.join(__dirname, 'locales')).forEach(function (file) {
  common.merge(module.exports, require(path.join(__dirname, 'locales', file)));
});
