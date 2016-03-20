import $ from 'jquery'
import 'select2'
import 'select2/select2_locale_fr'

import 'select2/select2.css'
import 'select2/select2-bootstrap.css'

$(initTagger)

function initTagger () {
  $('input[name="tags"]').each((i, field) => {
    field = $(field)
    field.select2({
      tags: field.data('tags'),
      tokenSeparators: [',', ' ']
    })
  })
}
