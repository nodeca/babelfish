BabelFish - human friendly i18n for javascript
==============================================

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

```bash
$ bower install babelfish
```

You need [es5-shim](https://github.com/es-shims/es5-shim) for old browsers
compatibility.


### Phrases Syntax

- `#{varname}` Echoes value of variable
- `((Singular|Plural1|Plural2)):count` Plural form

example:

- `А у меня в кармане #{nails_count} ((гвоздь|гвоздя|гвоздей)):nails_count`

You can also omit anchor variable for plurals, by default it will be `count`.
Thus following variants are equal:

- `I have #{count} ((nail|nails))`
- `I have #{count} ((nail|nails)):count`

Also you can use variables in plural parts:

- `I have ((#{count} nail|#{count} nails))`

Need special zero form or overwrite any specific value? No problems:

- `I have ((=0 no nails|#{count} nail|#{count} nails))`


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
    apples: На столе лежит #{count} ((яблоко|яблока|яблок))
```

### Usage

```javascript
// Create new instance of BabelFish with default language/locale: 'en-GB'
var BabelFish = require('babelfish');
var i18n = new BabelFish('en-GB');


// Fill in some phrases
i18n.addPhrase('en-GB', 'demo.hello',         'Hello, #{user.name}.');
i18n.addPhrase('en-GB', 'demo.conv.wazup',    'Whats up?');
i18n.addPhrase('en-GB', 'demo.conv.alright',  'Alright, man!');
i18n.addPhrase('en-GB', 'demo.coerce',        'Total: #{count}.');

i18n.addPhrase('ru-RU', 'demo.hello',         'Привет, #{user.name}.');
i18n.addPhrase('ru-RU', 'demo.conv.wazup',    'Как дела?');

i18n.addPhrase('uk-UA', 'demo.hello',         'Здоровенькі були, #{user.name}.');


// Set locale fallback to use the most appropriate translation when possible
i18n.setFallback('uk-UA', 'ru-RU');


// Translate
var params = {user: {name: 'ixti'}};

i18n.t('ru-RU', 'demo.hello', params);  // -> 'Привет, ixti.'
i18n.t('ru-RU', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('ru-RU', 'demo.conv.alright');   // -> 'Alright, man!'

i18n.t('uk-UA', 'demo.hello', params);  // -> 'Здоровенькі були, ixti.'
i18n.t('uk-UA', 'demo.conv.wazup');     // -> 'Как дела?'
i18n.t('uk-UA', 'demo.conv.alright');   // -> 'Alright, man!'

// When params is number or strings, it will be coerced to
// `{ count: XXX, value: XXX }` - use any of those in phrase.
i18n.t('en-GB', 'demo.coerce', 5);      // -> 'Total: 5.'


// You may wish to "dump" translations to load in browser later
// Dump will include all fallback translations and fallback rules
var locale_dump = i18n.stringify('ru-RU');

var i18n_new = require('babelfish')('en-GB'); // init without `new` also works
i18n_new.load(locale_dump);


// Use objects instead of strings (object/array/number/boolean) - can be
// useful to prepare bulk data for external libraries.
// Note, only JSON-supported types are ok (no date & regex)
i18n.addPhrase('en-GB', 'demo.boolean',  true);
i18n.addPhrase('en-GB', 'demo.number',   123);
i18n.addPhrase('en-GB', 'demo.array',    [1, 2, 3]);
// fourth param required for hashes (objects) to disable flattening,
// other types are autodetected
i18n.addPhrase('en-GB', 'demo.array',    { foo:1, bar:"2" }, false);
```


### Implementations in other languages

- Perl - [Locale::Babelfish](https://metacpan.org/pod/Locale::Babelfish)


### License

View the [LICENSE](https://github.com/nodeca/babelfish.tools/blob/master/LICENSE) file (MIT).
