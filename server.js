import { createServer } from 'http'
import express from 'express'
import logger from 'morgan'

import 'colors'

const app = express()
const server = createServer(app)

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')

app.use(logger(app.get('env') === 'development' ? 'dev' : 'combined'))

app.locals.title = 'Wazaaa'

if (app.get('env') === 'development') {
  app.locals.pretty = true
}

app.get('/', (req, res) => res.render('home'))

server.listen(app.get('port'), () => {
  console.log('✔ Server listening on port'.green, String(app.get('port')).cyan)
})
