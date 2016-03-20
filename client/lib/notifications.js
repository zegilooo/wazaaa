// Notifications Web Sockets
// =========================

// La création d’un bookmark par le serveur notifie tout le monde
// par Web Sockets.  Ce module initialise un écouteur s’il détecte
// dans la page la liste des bookmarks (`table#entries`), et réagit
// à toute notif en l'insérant en haut avec un petit effet de couleur.

import $ from 'jquery'
import io from 'socket.io-client'

// Ces modules sont partagés avec le côté serveur : d'abord les helpers…
import populateHelpers from '../../common/helpers'

// Au passage, on charge les CSS (Stylus, transpilé et injecté à la volée
// par les loaders Webpack) spécifique à ce code.
import '../css/entries.styl'

// Ensuite le template de la vue Jade !  Grâce au `jade-loader` de Webpack, il
// a été pré-compilé en un module renvoyant une fonction JS prête à l'emploi.
import template from '../../common/views/entry.jade'

$(initNotifications)

function initNotifications () {
  const container = $('table#entries tbody')
  if (container.length === 0) {
    return
  }

  // Et hop, on se connecte !
  const socket = io()

  socket.on('new-entry', (entry) => {
    // Ajouter un flag `injected` pour coller une classe de couleur initiale
    const locals = { entry, injected: true }
    // Incruster au scope Jade les helpers partagés avec le côté serveur
    // (notamment `formatDate`)
    populateHelpers(locals)
    // Faire le rendering et l'incruster en haut de la liste
    container.prepend(template(locals))
    // Dès qu'on est renderés (dès que le navigateur a désérialisé notre HTML dans
    // le DOM et a pu redonner la main à JS), retirer la classe : une transition CSS
    // fera un fondu de 0,7s sur la couleur de fond.
    setTimeout(() => {
      container.find('tr.injected').removeClass('injected')
    }, 0)
  })
}
