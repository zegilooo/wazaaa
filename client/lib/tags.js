// UI de tagging
// =============

import $ from 'jquery'
import 'select2'
import 'select2/select2_locale_fr'

import 'select2/select2.css'
import 'select2/select2-bootstrap.css'

// Activation de l'UI de tagging et fourniture des tags déjà connus
// pour tout champ de formulaire avec `name="tags"`.  Plus pro qu'une
// bête saisie textuelle.

$(initTagger)

function initTagger () {
  $('input[name="tags"]').each((i, field) => {
    field = $(field)
    field.select2({
      // l'attribut `data-tags` doit être rempli par les vues
      // et fournir un tableau JSON des tags déjà connus.
      // Voir `Entry.tags()`, `listEntries` et `newEntry` côté serveur.
      tags: field.data('tags'),
      tokenSeparators: [',', ' ']
    })
  })
}
