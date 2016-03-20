// Contrôleur des bookmarks
// ========================

import fetch from 'isomorphic-fetch'
import { Router } from 'express'
import unfluff from 'unfluff'

import Entry from '../models/entry'
import ws from './web-sockets'

// Chaque contrôleur exporte un routeur Express.
const router = new Router()

// Middleware vérifiant qu'on est authentifié (Passport aura rempli `req.user`)
router.use(requireAuthentication)

// Middleware pré-chargeant l'entité bookmark (`Entry`) pour toute URL REST de
// type identité (`/entries/BSON_ID` éventuellement suivie d'une fin de chemin).
// Si l'entité n'existe pas, on ramène au listing.
router.use('/:id', loadAndVerifyEntry)

// Routes RESTful choisies + quelques actions modifiantes
router.get('/', listEntries)
router.post('/', createEntry)
router.get('/new', newEntry)
router.get('/:id', showEntry)
router.patch('/:id/downvote', downvoteEntry)
router.patch('/:id/upvote', upvoteEntry)
router.post('/:id/comments', commentEntry)

// Ajout d'un commentaire à un bookmark.  D'un point de vue strictement « conventions » on
// aurait dû faire un contrôleur dédié avec une action `create` mais j'ai trouvé ça un peu
// *overkill* sur ce coup, donc bon…
function commentEntry (req, res) {
  req.entry.comment(req.user, req.body.text)
  .then(
    () => req.flash('success', 'Votre commentaire a bien été ajouté.'),
    (err) => req.flash('error', `Votre commentaire n’a pas pu être ajouté : ${err.message}`)
  )
  .then(() => res.redirect(`/entries/${req.entry.id}`))
}

// Création d'un bookmark
function createEntry (req, res) {
  // Merci `isomorphic-fetch` qui nous fournit un requêtage HTTP par promesse,
  // dont la valeur d'accomplissement est la réponse, qu’on chaîne avec une promesse sur
  // le corps de réponse, en tant que texte !
  fetch(req.body.url)
  .then((res) => res.text())
  .then((html) => {
    const analysis = unfluff(html)
    return Entry.post({
      excerpt: analysis.text.slice(0, 100) + '…',
      poster: req.user,
      tags: req.body.tags,
      title: analysis.title,
      url: req.body.url
    })
  })
  .then((entry) => {
    // On notifie par websockets les clients concernés.  Attention au champ `poster`, qui
    // n'a pas été prérempli suite à cette simple création, mais que le côté client voudra
    // utiliser : on simule son remplissage à la main :-)
    const notif = entry.toJSON()
    notif.poster = req.user
    ws.sockets.emit('new-entry', notif)
    req.flash('success', `Votre bookmark « ${entry.title} » a bien été créé.`)
    res.redirect(`/entries/${entry.id}`)
  })
  // En déplaçant la gestion d'erreur dans un dernier `.then` dédié, on lui permet de
  // récupérer au passage une erreur dans le callback d'accomplissement juste avant,
  // notamment en cas de souci Web Sockets.
  .catch((err) => {
    req.flash('error', `Une erreur est survenue en traitant cette URL : ${err.message}`)
    res.redirect('/entries/new')
  })
}

// Downvote d'un bookmark.  Le code est tellement similaire à celui de l'upvote qu'on l'a factorisé.
function downvoteEntry (req, res) {
  voteOnEntry(req, res, -1)
}

// Listing des bookmarks.  La seule petite complexité rajoutée est qu'on a besoin, séparément,
// d'un `Entry.getEntries` et d'un `Entry.tags`.  Elles sont ici séquentielles mais on pourrait facilement
// les paralléliser avec un équivalent de `Promise.all`, ce qui allègerait aussi ce code : essayez donc !
function listEntries (req, res) {
  Promise.all([
    Entry.tags(),
    Entry.count().exec(),
    Entry.getEntries(req.query)
  ])
  .then(([tags, entryCount, entries]) => {
    res.render('entries/index', { pageTitle: 'Les bookmarks', entries, entryCount, tags })
  })
  .catch((err) => {
    req.flash('error', `Impossible d’afficher les bookmarks : ${err.message}`)
    res.redirect('/')
  })
}

const NON_RESOURCE_IDS = ['new']

function loadAndVerifyEntry (req, res, next) {
  if (NON_RESOURCE_IDS.indexOf(req.params.id) !== -1) {
    return next()
  }

  Entry.getEntry(req.params.id)
  .then((entry) => {
    // Souci SQL ou entité introuvable : on sera gérés par le dernier callback
    // de rejet de promesse.
    if (!entry) {
      throw new Error(`No entry found for ID ${req.params.id}`)
    }

    req.entry = entry
    next()
  })
  .catch((err) => {
    req.flash('info', `Ce bookmark n’existe pas (ou plus) ${err.message}`)
    res.redirect('/entries')
  })
}

// Formulaire de création d'un bookmark.
function newEntry (req, res) {
  Entry.tags().then((tags) => {
    res.render('entries/new', { pageTitle: 'Nouveau bookmark', tags })
  })
}

function requireAuthentication (req, res, next) {
  if (req.user) {
    return next()
  }

  req.flash('info', 'Vous devez être authentifié-e pour consulter les bookmarks.')
  res.redirect('/')
}

// Affiche d'un bookmark.
function showEntry (req, res) {
  const { entry } = req
  res.render('entries/show', { pageTitle: entry.title, entry })
}

// Upvote d'un bookmark.  Le code est tellement similaire à celui du downvote qu'on l'a factorisé.
function upvoteEntry (req, res) {
  voteOnEntry(req, res, +1)
}

// Code central de vote (up/down) d'un bookmark.
function voteOnEntry (req, res, offset) {
  const { entry, user } = req
  // Si l'utilisateur courant a déjà voté pour le bookmark, refuser son lobbying ;-)
  if (entry.votedBy(user)) {
    req.flash('error', 'Vous avez déjà voté pour ce bookmark…')
    return res.redirect(`/entries/${entry.id}`)
  }

  entry.voteBy(user, offset)
  .then(
    () => req.flash('success', 'Votre vote a bien été pris en compte'),
    (err) => req.flash('error', `Votre vote n’a pas pu être pris en compte : ${err.message}`)
  )
  // Ce petit `.then` final joue un peu le rôle d'un `finally`…
  .then(() => res.redirect(`/entries/${entry.id}`))
}

export default router
