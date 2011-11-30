var REGEXP = /=\s*__\(['"]([^'"]+)['"](?:,[^)]+)?\)/g


module.exports.preprocess = function preprocess(locale, string) {
  var babelfish = this;
  return string.replace(REGEXP, function (m, g) {
    var result = babelfish.getTranslation(locale, g);

    if ('string' === result) {
      return ' ' + result; // we a removing = statement
    }

    var idx = m.indexOf('(') + 1;
    return m.slice(0, idx) + "'" + locale + "', " + m.slice(idx);
  });
};
