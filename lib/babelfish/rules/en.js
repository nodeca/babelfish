'use strict';


module.exports = {
  // 0 -> one, 1 -> other
  pluralize: function (count, forms) {
    return (1 === count) ? forms[0] : forms[1];
  }
};
