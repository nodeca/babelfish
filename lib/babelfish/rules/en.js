'use strict';


module.exports = {
  pluralize: function (count, forms) {
    return (1 === count) ? (forms.one || forms.other) : (forms.other);
  }
};
