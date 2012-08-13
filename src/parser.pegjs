start
  = (plural / variable / literal)*


// Plurals macros
// - `{{girl|girls}}`
// - `{{girl|girls}}:chicks_count`
plural
  = "{{" forms:plural_forms "}}" anchor:plural_anchor? {
      return {
        type:   'plural',
        forms:  forms,
        anchor: anchor || 'count'
      };
    }


// List of plural forms, e.g.:
// - `girl|girls`
plural_forms
  = part:plural_part "|" more:plural_forms {
      return [part].concat(more);
    }
  / part:plural_part {
      return [part];
    }


// Exactly one plural form, e.g.:
// - `girl`
// - `girls`
plural_part
  = chars:plural_char+ {
      return chars.join('');
    }


// Single char of the plural form (returns simple char or unescapes `\|`)
plural_char
  = "\\" char:[\\|}{] { return String(char); }
  / [^\\|}]


// Name of a variable containing count for plurals
plural_anchor
  = ":" name:identifier {
      return name;
    }


// Interpolation variable, e.g.:
// - `%(count)`
// - `%(user.name)`
variable
  = "%(" anchor:identifier ")" {
      return {
        type:   'variable',
        anchor: anchor
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


// Single part of a JS identifier (everything except dot)
identifier_part
  = a:[a-zA-Z_$] b:[a-zA-Z0-9_$]* {
      return a + b.join("");
    }


// Any text, e.g.:
// - `Hello, World!`
literal
  = char:literal_char {
      return {
        type: 'literal',
        text: String(char)
      };
    }


// Any non-special character
literal_char
  // any Unicode character except { or \ or control character
  = "\\" char:[\\{%] {
      return String(char);
    }
  / .
