// defines pluraliation rules. based on:
// http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html


var pluralization = module.exports = {};

pluralization.en = function (count, forms) {
  return (1 === count) ? (forms.one) : (forms.other);
};

pluralization.ru = function (count, forms) {
  return forms.other;
};
