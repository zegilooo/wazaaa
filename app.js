// Application principale
// ======================

import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import csurf from 'csurf'
import express from 'express'
import flash from 'connect-flash'
import { join as joinPaths } from 'path'
import logger from 'morgan'
import methodOverride from 'method-override'
import mongoose from 'mongoose'
import passport from 'passport'

import 'colors'

// Mongoose exige désormais qu’on fournisse notre propre implémentation de promesses,
// plutôt que l’ancienne `mpromise` intégrée.  On se cale sur les promesses natives
// dès maintenant, pour ne pas polluer tant le serveur que les tests.
mongoose.Promise = Promise

import entriesController from './controllers/entries'
import mainController from './controllers/main'
import populateHelpers from './common/helpers'
import usersController from './controllers/users'

// Crée le conteneur principal de web app (`app`), connecte le serveur HTTP dessus
// (`server`) et détermine le chemin complet des assets statiques.
const app = express()
const publicPath = joinPaths(__dirname, 'public')

// Configuration
// -------------

// Configuration et middleware pour tous les environnements (dev, prod, etc.)
app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')

// Fichiers statiques.  En le chargeant tôt, on court-circuite immédiatement
// le reste des middlewares en cas de fichier statique…
app.use(express.static(publicPath))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride((req) => req.body._method))

if (app.get('env') !== 'test') {
  app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'))
}

// `cookieSession` stocke la session complète en cookie, pas en mémoire serveur,
// ce qui résiste aux redémarrages (notamment en dev avec `nodemon`) mais pose des
// contraintes de taille (4Ko max JSONifié + base64-encodé).
app.use(cookieSession({ name: 'wazaaa:session', secret: 'Node.js c’est de la balle !' }))

if (app.get('env') !== 'test') {
  app.use(csurf())
}

// Rien à voir avec Adobe Flash!  Ce sont des flashes de session--des messages qui ne
// sont retenus que jusqu’au prochain render de la session.
app.use(flash())
// Authentification avec [Passport](http://passportjs.com)
app.use(passport.initialize())
app.use(passport.session())

// Variables locales partagées par toutes les vues
app.locals.title = 'Wazaaa'

// Configuration uniquement hors production
if (app.get('env') !== 'production') {
  // Variable spéciale utilisée par Jade pour ne pas minifier le HTML
  app.locals.pretty = true
}

// Variables automatiques dans les vues
// ------------------------------------

// Helpers pour nos vues
populateHelpers(app.locals)

// Rend l’URL, le flash, les paramètres de requête et l’utilisateur courant
// accessibles à toutes les vues
app.use((req, res, next) => {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken()
  }
  res.locals.flash = req.flash()
  res.locals.query = req.query
  res.locals.url = req.url
  res.locals.user = req.user
  next()
})

// Middlewares et routes applicatifs
// ---------------------------------

app.use(mainController)
app.use('/entries', entriesController)
app.use('/users', usersController)

export default app
