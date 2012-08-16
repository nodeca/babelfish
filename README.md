BabelFish - i18n for node.js
============================

[![Build Status](https://secure.travis-ci.org/nodeca/babelfish.png)](http://travis-ci.org/nodeca/babelfish)

Internationalisation with easy syntax for node.js. Classic solutions use multiple phrases
for plurals. But we define plurals inline - that's more compact, and easier to maintain.
Also, phrases are grouped into nested scopes, like in Ruby.

We support all pluralisation rules from [unicode CLDR](http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html),
version [2.0.1](http://cldr.unicode.org/index/downloads).


## Phrases Syntax

-  `#{varname}` Echoes value of variable
-  `((Singular|Plural1|Plural2)):count` Plural form

example:

    А у меня в кармане #{nails_count} ((гвоздь|гвоздя|гвоздей)):nails_count

You can also omit anchor variable for plurals, by default it will be `count`.
Thus following variants are equal:

- `I have #{count} ((nail|nails))`
- `I have #{count} ((nail|nails)):count`


#### Escape chars

If you need `#{`, `((`, `|` or `))` somewhere in text, where it can be considered
as markup part - just escape them with `\`.


#### Example with YAML

As BabelFish supports scopes, it's really fun and nice to store translations in
YAML files:

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


## Usage

    // Create new instance of BabelFish with default lnguage/locale: 'en'
    var i18n = require('babelfish').create('en-GB');


    // Fill in some phrases
    i18n.addPhrase('en-GB', 'demo.hello',         'Hello, #{user.name}.');
    i18n.addPhrase('en-GB', 'demo.conv.wazup',    'Whats up?');
    i18n.addPhrase('en-GB', 'demo.conv.alright',  'Alright, man!');

    i18n.addPhrase('ru-RU', 'demo.hello',         'Привет, #{user.name}.');
    i18n.addPhrase('ru-RU', 'demo.conv.wazup',    'Как дела?');

    i18n.addPhrase('uk-UA', 'demo.hello',         'Здоровенькі були, #{user.name}.');


    // Set locale fallback so we use most appropriate translation
    i18n.setLocaleFallback('uk-UA', 'ru-RU');


    // Translate
    var params = {user: {name: 'ixti'}};

    i18n.t('ru-RU', 'demo.hello', params);  // -> 'Привет, ixti.'
    i18n.t('ru-RU', 'demo.conv.wazup');     // -> 'Как дела?'
    i18n.t('ru-RU', 'demo.conv.alright');   // -> 'Alright, man!'

    i18n.t('uk-UA', 'demo.hello', params);  // -> 'Здоровенькі були, ixti.'
    i18n.t('uk-UA', 'demo.conv.wazup');     // -> 'Как дела?'
    i18n.t('uk-UA', 'demo.conv.alright');   // -> 'Alright, man!'


    // Get compiled phrase or all phrases within scope.
    i18n.getTranslation('ru-RU', 'demo');
    // -> { hello : [Function],
    //      conv  : { wazup   : 'Как дела?',
    //                alright : 'Alright, man!' } }

    // You may want to get translations within only one level of the scope
    // This might be useful for exporting translations partially to browser
    i18n.getTranslation('ru-RU', 'demo', {deep: false});
    // -> { hello : [Function] }

    i18n.getTranslation('ru-RU', 'demo.hello');
    // -> [Function]


## License

View the [LICENSE](https://github.com/nodeca/babelfish.tools/blob/master/LICENSE) file (MIT).
