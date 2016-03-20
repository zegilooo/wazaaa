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

mongoose.Promise = Promise

import entriesController from './controllers/entries'
import mainController from './controllers/main'
import populateHelpers from './common/helpers'
import usersController from './controllers/users'

const app = express()
const publicPath = joinPaths(__dirname, 'public')

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')

app.use(express.static(publicPath))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride((req) => req.body._method))

if (app.get('env') !== 'test') {
  app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'))
}

app.use(cookieSession({ name: 'wazaaa:session', secret: 'Node.js c’est de la balle !' }))

if (app.get('env') !== 'test') {
  app.use(csurf())
}

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.locals.title = 'Wazaaa'
populateHelpers(app.locals)

if (app.get('env') === 'development') {
  app.locals.pretty = true
}

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

app.use(mainController)
app.use('/entries', entriesController)
app.use('/users', usersController)

export default app
