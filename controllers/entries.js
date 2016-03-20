import fetch from 'isomorphic-fetch'
import { Router } from 'express'
import unfluff from 'unfluff'

const router = new Router()

router.get('/', listEntries)
router.post('/', createEntry)
router.get('/new', newEntry)
router.get('/:id', showEntry)
router.patch('/:id/downvote', downvoteEntry)
router.patch('/:id/upvote', upvoteEntry)
router.post('/:id/comments', commentEntry)

function commentEntry (req, res) {
  res.send('COMING SOON')
}

function createEntry (req, res) {
  fetch(req.body.url)
  .then((res) => res.text())
  .then((html) => {
    const analysis = unfluff(html)
    return {
      excerpt: analysis.text.slice(0, 100) + '…',
      tags: req.body.tags,
      title: analysis.title,
      url: req.body.url
    }
  })
  .then((entry) => {
    req.flash('success', `Votre bookmark « ${entry.title} » a bien été créé.`)
    res.redirect('/entries') // FIXME
  })
  .catch((err) => {
    req.flash('error', `Une erreur est survenue en traitant cette URL : ${err.message}`)
    res.redirect('/entries/new')
  })
}

function downvoteEntry (req, res) {
  res.send('COMING SOON')
}

function listEntries (req, res) {
  res.render('entries/index', { pageTitle: 'Les bookmarks', entries: [] })
}

function newEntry (req, res) {
  res.render('entries/new', { pageTitle: 'Nouveau bookmark' })
}

function showEntry (req, res) {
  res.send('COMING SOON')
}

function upvoteEntry (req, res) {
  res.send('COMING SOON')
}

export default router
