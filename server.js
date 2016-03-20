import { createServer } from 'http'

import 'colors'

import app from './app'
import attachWebSockets from './controllers/web-sockets'
import dbConnect from './models/connection'

const server = createServer(app)
attachWebSockets(server)
dbConnect(() => {
  console.log('✔ Connection established to mongoDB database'.green)

  server.listen(app.get('port'), () => {
    console.log('✔ Server listening on port'.green, String(app.get('port')).cyan)
  })
})
