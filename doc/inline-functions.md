Inline functions
================

* `#{varname}` Echoes value of variable
* `%g{Male|Female|Unisex}:myvar` Gender form
* `%{Singular|Plural1|Plural2}:myvar` Plural form


## Gender forms

- arguments: male|female|unisex
- variable required
- outputs appropriate form according to `sex` property of given (variable)
  object (which might be: `m` or `male`, `f` or `female`, `u` or `unisex`)
- when third form is not given, first one is used instead
- one may pass `sex` varible directly (as a string)

#### Example

    // user = {"name": 'ixti", "sex": "male"}
    %g{Дорогой|Дорогая|Дорогое}:user  // -> 'Дорогой'

    // user = {"name": 'it", "sex": "unisex"}
    %g{Дорогой|Дорогая}:user          // -> 'Дорогой'
    %g{Дорогой|Дорогая|Дорогое}:user  // -> 'Дорогое'

    // sex = 'female'
    %g{Дорогой|Дорогая}:sex           // -> 'Дорогая'
  

## Plural forms

- arguments: singular|plural1|plural2
- variable required
- outputs appropriate form according to `length` property of given (variable)
  object (which might be: `m` or `male`, `f` or `female`, `u` or `unisex`)
- one may pass `length` varible directly (as an integer)

#### Example

    // users = ["ixti", "sipsik"]
    %{Пользователь|Пользователя|Пользователей}:users // -> 'Пользователя'

    // count = 10
    %{Пользователь|Пользователя|Пользователей}:count // -> 'Пользователей'
