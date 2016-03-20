import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import csurf from 'csurf'
import express from 'express'
import flash from 'connect-flash'
import { join as joinPaths } from 'path'
import logger from 'morgan'

import 'colors'

import entriesController from './controllers/entries'
import mainController from './controllers/main'

const app = express()
const publicPath = joinPaths(__dirname, 'public')

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')

app.use(express.static(publicPath))
app.use(bodyParser.urlencoded({ extended: true }))

if (app.get('env') !== 'test') {
  app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'))
}

app.use(cookieSession({ name: 'wazaaa:session', secret: 'Node.js c’est de la balle !' }))
app.use(csurf())
app.use(flash())

app.locals.title = 'Wazaaa'

if (app.get('env') === 'development') {
  app.locals.pretty = true
}

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken()
  res.locals.flash = req.flash()
  res.locals.query = req.query
  res.locals.url = req.url
  next()
})

app.use(mainController)
app.use('/entries', entriesController)

export default app
