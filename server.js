import { createServer } from 'http'
import express from 'express'
import { join as joinPaths } from 'path'
import logger from 'morgan'

import 'colors'

import mainController from './controllers/main'

const app = express()
const server = createServer(app)
const publicPath = joinPaths(__dirname, 'public')

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')

app.use(express.static(publicPath))
app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'))

app.locals.title = 'Wazaaa'

if (app.get('env') === 'development') {
  app.locals.pretty = true
}

app.use((req, res, next) => {
  res.locals.flash = []
  res.locals.url = req.url
  next()
})

app.use(mainController)

server.listen(app.get('port'), () => {
  console.log('✔ Server listening on port'.green, String(app.get('port')).cyan)
})
