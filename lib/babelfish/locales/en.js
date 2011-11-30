function pluralize(count, forms) {
  return (1 === count && forms.one) ? (forms.one) : (forms.other);
}


module.exports = {
  "en":    { pluralize: pluralize },
  "en-AU": { pluralize: pluralize },
  "en-GB": { pluralize: pluralize },
  "en-US": { pluralize: pluralize }
};
