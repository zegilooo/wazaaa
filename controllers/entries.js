import fetch from 'isomorphic-fetch'
import { Router } from 'express'
import unfluff from 'unfluff'

import Entry from '../models/entry'

const router = new Router()

router.use(requireAuthentication)
router.use('/:id', loadAndVerifyEntry)

router.get('/', listEntries)
router.post('/', createEntry)
router.get('/new', newEntry)
router.get('/:id', showEntry)
router.patch('/:id/downvote', downvoteEntry)
router.patch('/:id/upvote', upvoteEntry)
router.post('/:id/comments', commentEntry)

function commentEntry (req, res) {
  req.entry.comment(req.user, req.body.text)
  .then(
    () => req.flash('success', 'Votre commentaire a bien été ajouté.'),
    (err) => req.flash('error', `Votre commentaire n’a pas pu être ajouté : ${err.message}`)
  )
  .then(() => res.redirect(`/entries/${req.entry.id}`))
}

function createEntry (req, res) {
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
    req.flash('success', `Votre bookmark « ${entry.title} » a bien été créé.`)
    res.redirect(`/entries/${entry.id}`)
  })
  .catch((err) => {
    req.flash('error', `Une erreur est survenue en traitant cette URL : ${err.message}`)
    res.redirect('/entries/new')
  })
}

function downvoteEntry (req, res) {
  voteOnEntry(req, res, -1)
}

function listEntries (req, res) {
  Promise.all([
    Entry.count().exec(),
    Entry.getEntries(req.query)
  ])
  .then(([entryCount, entries]) => {
    res.render('entries/index', { pageTitle: 'Les bookmarks', entries, entryCount })
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

function newEntry (req, res) {
  res.render('entries/new', { pageTitle: 'Nouveau bookmark' })
}

function requireAuthentication (req, res, next) {
  if (req.user) {
    return next()
  }

  req.flash('info', 'Vous devez être authentifié-e pour consulter les bookmarks.')
  res.redirect('/')
}

function showEntry (req, res) {
  const { entry } = req
  res.render('entries/show', { pageTitle: entry.title, entry })
}

function upvoteEntry (req, res) {
  voteOnEntry(req, res, +1)
}

function voteOnEntry (req, res, offset) {
  const { entry, user } = req
  if (entry.votedBy(user)) {
    req.flash('error', 'Vous avez déjà voté pour ce bookmark…')
    return res.redirect(`/entries/${entry.id}`)
  }

  entry.voteBy(user, offset)
  .then(
    () => req.flash('success', 'Votre vote a bien été pris en compte'),
    (err) => req.flash('error', `Votre vote n’a pas pu être pris en compte : ${err.message}`)
  )
  .then(() => res.redirect(`/entries/${entry.id}`))
}

export default router
