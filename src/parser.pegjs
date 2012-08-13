start
  = (plural / variable / literal)*


plural
  = "{{" forms:plural_forms "}}" anchor:plural_anchor? {
      return {
        type:   'plural',
        forms:  forms,
        anchor: anchor || 'count'
      };
    }
  // We met invalid plural form e.g. `{{|}}`,
  // so instead of failing return string node `{{` to make
  // parser continue parsing
  / char:"{{" {
      return {
        type: 'literal',
        text: String(char)
      };
    }


plural_forms
  = part:plural_part "|" more:plural_forms {
      return [part].concat(more);
    }
  / part:plural_part {
      return [part];
    }


plural_part
  = chars:plural_char+ {
      return chars.join('');
    }


plural_char
  = "\\" char:. { return String(char); }
  / [^|}\\]


plural_anchor
  = ":" name:identifier {
      return name;
    }


variable
  = "%{" anchor:identifier "}" {
      return {
        type:   'variable',
        anchor: anchor
      };
    }
  // We met invalid identifier e.g. `%{n..e}`,
  // so instead of failing return string node `%{` to make
  // parser continue parsing
  / char:"%{" {
      return {
        type: 'literal',
        text: String(char)
      };
    }


// Valid Javascript variable identifier, e.g.:
// - `foo`
// - `foo.bar`
// - `$myElement`
identifier
  = a:identifier_part "." b:identifier+ {
      return a + "." + b;
    }
  / identifier_part


identifier_part
  = a:[a-zA-Z_$] b:[a-zA-Z0-9_$]* {
      return a + b.join("");
    }


// Any text, e.g.:
// - `Hello, World!`
literal
  = chars:literal_char+ {
      return {
        type: 'literal',
        text: chars.join('')
      };
    }


literal_char
  // any Unicode character except { or \ or control character
  = [^%{\\]
  / !"{{" char:"{" {
      return String(char);
    }
  / !"%{" char:"%" {
      return String(char);
    }
  / "\\" char:. {
      return String(char);
    }
