{
  function regularForms(forms) {
    var result = [];
    for (var i=0; i<forms.length; i++) {
      if (forms[i].strict === undefined) { result.push(forms[i].text); }
    }
    return result;
  }
  function strictForms(forms) {
    var result = {};
    for (var i=0; i<forms.length; i++) {
      if (forms[i].strict !== undefined) { result[forms[i].strict] = forms[i].text; }
    }
    return result;
  }
}

start
  = (literal / plural / variable)*


// Plurals macros
// - `((girl|girls))`
// - `((girl|girls)):chicks_count`
plural
  = '((' forms:plural_forms '))' anchor:plural_anchor? {
      return {
        type:   'plural',
        forms:  regularForms(forms),
        strict: strictForms(forms),
        anchor: anchor || 'count'
      };
    }


// List of plural forms, e.g.:
// - `girl|girls`
plural_forms
  = part:plural_part '|' more:plural_forms {
      return [part].concat(more);
    }
  / part:plural_part {
      return [part];
    }


// Exactly one plural form, e.g.:
// - `girl`
// - `girls`
plural_part
  = '=' strict:[0-9]+ ' '? form:plural_char+ {
      return {
        strict: strict.join(''),
        text: form.join('')
      }
    }
  / plural_char+ {
      return {
        text: text()
      };
    }


// Single char of the plural form
// returns simple char or unescapes `\|` & `\))`)
plural_char
  = '\\' char:[\\|)(] {
      return char;
    }
  / !('|' / '))') . {
      return text();
    }


// Name of a variable containing count for plurals
// We allow dor notation, but limit values to valid JS identifiers,
// because translations can have some text chars without space
// right after anchor.
plural_anchor
  = ':' name:identifier {
      return name;
    }


// Interpolation variable, e.g.:
// - `#{count}`
// - `#{user.name}`
variable
  = '#{' anchor:identifier '}' {
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
  = identifier_part '.' identifier+ {
      return text()
    }
  / identifier_part


// Single part of a JS identifier (everything except dot)
// Letters are specially limited to english only
identifier_part
  = [a-zA-Z_$] [a-zA-Z0-9_$]* {
      return text();
    }


// Any text, e.g.:
// - `Hello, World!`
literal
  = literal_chars:(!(plural / variable) lc:literal_char { return lc; })+ {
      return {
        type: 'literal',
        text: literal_chars.join('')
      };
    }



// Any non-special character or escaped sequence
literal_char
  = '\\' char:[\\#()|] {
      return char;
    }
  / .
