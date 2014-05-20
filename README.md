BabelFish - i18n for node.js
============================

[![Build Status](https://travis-ci.org/nodeca/babelfish.svg?branch=master)](https://travis-ci.org/nodeca/babelfish)

Internationalisation with easy syntax for node.js. Classic solutions use multiple phrases
for plurals. But we define plurals inline - that's more compact, and easier to maintain.
Also, phrases are grouped into nested scopes, like in Ruby.

We support all pluralisation rules from [unicode CLDR](http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html),
version [2.0.1](http://cldr.unicode.org/index/downloads).

### Installation

__node.js:__

```bash
$ npm install babelfish
```

__browser:__

If you need AMD module, use [browserify](https://github.com/nodeca/babelfish)
to build.

```bash
$ npm install babelfish
$ cd node_modules/babelfish
$ browserify -r ./ -s Babelfish > babelfish_browser.js
```


### Phrases Syntax

-  `#{varname}` Echoes value of variable
-  `((Singular|Plural1|Plural2)):count` Plural form

example:

    А у меня в кармане #{nails_count} ((гвоздь|гвоздя|гвоздей)):nails_count

You can also omit anchor variable for plurals, by default it will be `count`.
Thus following variants are equal:

- `I have #{count} ((nail|nails))`
- `I have #{count} ((nail|nails)):count`

Also you can use variables in plural parts:

- `I have ((one nail|#{count} nails))`


##### Escape chars

If you need `#{`, `((`, `|` or `))` somewhere in text, where it can be considered
as markup part - just escape them with `\`.


##### Example with YAML

As BabelFish flatten scopes, it's really fun and nice to store translations in
YAML files:

```yaml
  ---
  ru-RU:
    profile: Профиль
    forums: Форумы
    apps:
      forums:
        new_topic: Новая тема
        last_post:
          title : Последнее сообщение
          by : от
    demo:
      apples: "На столе лежит #{apples.count} ((яблоко|яблока|яблок)):apples.count"
```

### Usage

``` javascript
// Create new instance of BabelFish with default language/locale: 'en-GB'
var i18n = require('babelfish').create('en-GB');


// Fill in some phrases
i18n.addPhrase('en-GB', 'demo.hello',         'Hello, #{user.name}.');
i18n.addPhrase('en-GB', 'demo.conv.wazup',    'Whats up?');
i18n.addPhrase('en-GB', 'demo.conv.alright',  'Alright, man!');

i18n.addPhrase('ru-RU', 'demo.hello',         'Привет, #{user.name}.');
i18n.addPhrase('ru-RU', 'demo.conv.wazup',    'Как дела?');

i18n.addPhrase('uk-UA', 'demo.hello',         'Здоровенькі були, #{user.name}.');


// Set locale fallback so we use most appropriate translation
i18n.setFallback('uk-UA', 'ru-RU');


// Translate
var params = {user: {name: 'ixti'}};

i18n.t('ru-RU', 'demo.hello', params);  // -> 'Привет, ixti.'
i18n.t('ru-RU', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('ru-RU', 'demo.conv.alright');   // -> 'Alright, man!'

i18n.t('uk-UA', 'demo.hello', params);  // -> 'Здоровенькі були, ixti.'
i18n.t('uk-UA', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('uk-UA', 'demo.conv.alright');   // -> 'Alright, man!'


// You may want to get "compiled" translations to serialize later
i18n.getCompiledData('ru-RU');
// -> {
//      'demo.hello'        : { e: 1, l: "ru-RU", t: [Function] },
//      'demo.conv.wazup'   : { e: 0, l: "ru-RU", t: 'Как дела?' },
//      'demo.conv.alright' : { e: 0, l: "ru-RU", t: 'Alright, man!' }
//    }

// Or get compilet translations as direct evalable string,
// for browser asset generation:
i18n.stringify(locale);


// Use objects instead of strings (object/array/number/boolean) - can be
// useful to prepare bulk data for external libraries
i18n.addPhrase('en-GB', 'demo.boolean',  true);
i18n.addPhrase('en-GB', 'demo.number',   123);
i18n.addPhrase('en-GB', 'demo.array',    [1, 2, 3]);
// fourth param required for hashes (objects) to disable flattening,
// other types are autodetected
i18n.addPhrase('en-GB', 'demo.array',    { foo:1, bar:"2" }, false);
```

**NOTICE**
`BabelFish#getCompiledData` just exports an object with strings/functions.
You are responsible to serialize it and then inject into browser runtime.
You can use `BabelFish#stringify` if you are ok with defaults.

Assuming that you have serialized data and it's available on browser as
`i18nData`, you can do following to inject them into i18n (on browser):

```html
<script type="text/javascript" src="/assets/babelfish-runtime.js"></script>
<script type="text/javascript" src="/assets/i18n.ru-RU.js"></script>
<script type="text/javascript">
  var i18n = new BabelFish('en-GB');

  // We assume `i18n.ru-RU.js` exports `i18nData` global variable
  i18n._storage['ru-RU'] = i18nData;
</script>
```

### Known issues and workarounds

- __No separate definition for plural zero value__. Solution: make 2 phrases
  and write select condition in template.

Since those cases are rare, that's acceptabale trade-off for having fun with 99%
of other translations. But [you can help to imporve](https://github.com/nodeca/babelfish/issues/14)
babelfish.


### License

View the [LICENSE](https://github.com/nodeca/babelfish.tools/blob/master/LICENSE) file (MIT).
