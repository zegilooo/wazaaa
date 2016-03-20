// Point d’entrée du serveur
// =========================

import { createServer } from 'http'

// Ce `require` suffit à étendre `String` avec des propriétés de colorisation
// que nous utiliserons pour certains logs sur la console.
import 'colors'

import app from './app'
import attachWebSockets from './controllers/web-sockets'
import dbConnect from './models/connection'

// Crée le conteneur principal de web app (`app`), connecte le serveur HTTP dessus
// (`server`) et détermine le chemin complet des assets statiques.
const server = createServer(app)

// Activation de Socket.IO et mise à disposition au travers d'un
// singleton.
attachWebSockets(server)

// Connexion à la base
dbConnect(() => {
  console.log('✔ Connection established to mongoDB database'.green)

  // Lancement effectif du serveur en écoutant sur le bon port pour des
  // connexions HTTP entrantes.  Le port par défaut est 3000 (voir plus haut).
  server.listen(app.get('port'), () => {
    console.log('✔ Server listening on port'.green, String(app.get('port')).cyan)
  })
})
