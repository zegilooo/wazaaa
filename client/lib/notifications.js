import $ from 'jquery'
import io from 'socket.io-client'

import populateHelpers from '../../common/helpers'

import '../css/entries.styl'

import template from '../../common/views/entry.jade'

$(initNotifications)

function initNotifications () {
  const container = $('table#entries tbody')
  if (container.length === 0) {
    return
  }

  const socket = io()

  socket.on('new-entry', (entry) => {
    const locals = { entry, injected: true }
    populateHelpers(locals)
    container.prepend(template(locals))
    setTimeout(() => {
      container.find('tr.injected').removeClass('injected')
    }, 0)
  })
}
