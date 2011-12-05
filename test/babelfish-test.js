var assert = require('assert'),
    BabelFish = require('../lib/babelfish');

require('vows').describe('BabelFish').addBatch({
  'Exported module': {
    'is a constructor': function () {
      assert.isFunction(BabelFish);
      assert.instanceOf(new BabelFish, BabelFish);
    },

    'has `create` (constructor proxy)': function () {
      assert.isFunction(BabelFish.create);
      assert.equal(BabelFish.create.length, BabelFish.length);
    }
  },

  'BabelFish instance': {
    topic: new (BabelFish),

    'addPhrase() overrides scope on duplicate': function (i18n) {
      i18n.addPhrase('ru', 'addphrase', 'original');
      i18n.addPhrase('ru', 'addphrase', 'override');

      assert.equal(i18n.getScope('ru', 'addphrase'), 'override');
    },

    'getScope()': {
      'returns String when scope has no macros': function (i18n) {
        i18n.addPhrase('ru', 'getscope.string', 'test');
        assert.instanceOf(i18n.getScope('ru', 'getscope.string', String));
      },

      'returns Function when scope has macros': function (i18n) {
        i18n.addPhrase('ru', 'getscope.function', 'test #{test}');
        assert.instanceOf(i18n.getScope('ru', 'getscope.function', Function));
      },

      'returns inner scope Object when scope requested': function (i18n) {
        i18n.addPhrase('ru', 'getscope.object.foo', 'foo');
        i18n.addPhrase('ru', 'getscope.object.bar', 'bar');
        i18n.addPhrase('ru', 'getscope.object.inner.moo', 'moo');

        var flat = i18n.getScope('ru', 'getscope.object', {deep: false}),
            deep = i18n.getScope('ru', 'getscope.object', {deep: true});

        assert.include(flat, 'foo');
        assert.include(flat, 'bar');
        assert.isUndefined(flat, 'inner');

        assert.include(deep, 'foo');
        assert.include(deep, 'bar');
        assert.include(deep, 'inner');
        assert.include(deep.inner, 'moo');
      }
    },

    'prepared function can be used multiple times': function (i18n) {
      i18n.addPhrase('ru', 'getscope.function_test', 'foo #{bar}');

      var func = i18n.getScope('ru', 'getscope.function_test');

      assert.equal('foo 1', func({bar: 1}));
      assert.equal('foo 2', func({bar: 2, baz: 3}));
    },

    'translates inline plurals': function (i18n) {
      i18n.addPhrase('ru', 'plurals', '-%{foo|bar}:{nails.count}-');
      assert.equal('-foo-', i18n.t('ru', 'plurals', {nails: {count: 1}}));
      assert.equal('-bar-', i18n.t('ru', 'plurals', {nails: {count: 2}}));
    },

    'fallbacks to default language in worst case': function (i18n) {
      i18n.addPhrase('en', 'fallback.generic.foo', 'foo');
      i18n.addPhrase('en', 'fallback.generic.bar', 'bar');
      i18n.addPhrase('ru', 'fallback.generic.bar', 'moo');

      assert.equal(i18n.t('en', 'fallback.generic.foo'), 'foo');
      assert.equal(i18n.t('en', 'fallback.generic.bar'), 'bar');
      assert.equal(i18n.t('ru', 'fallback.generic.foo'), 'foo');
      assert.equal(i18n.t('ru', 'fallback.generic.bar'), 'moo');
    },

    'allows specify fallback route': function (i18n) {
      i18n.addPhrase('en', 'fallback.generic.foo', 'foo');
      i18n.addPhrase('en', 'fallback.generic.bar', 'bar');
      i18n.addPhrase('en', 'fallback.generic.moo', 'moo');

      i18n.addPhrase('ru', 'fallback.generic.bar', 'bar.ru');
      i18n.addPhrase('ru', 'fallback.generic.moo', 'moo.ru');

      i18n.addPhrase('ua', 'fallback.generic.moo', 'moo.ua');

      i18n.setFallbackLocale('ua', 'ru');

      assert.equal(i18n.t('ua', 'fallback.generic.foo'), 'foo');
      assert.equal(i18n.t('ua', 'fallback.generic.bar'), 'bar.ru');
      assert.equal(i18n.t('ua', 'fallback.generic.moo'), 'moo.ua');
    }
  }
}).export(module);
