// Connexion à mongoDB
// ===================

import mongoose from 'mongoose'
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/wazaaa')

// On prend soin de toujours indiquer si la connexion a échoué, car c’est
// pénible à diagnostiquer sinon.
const db = mongoose.connection
db.on('error', () => {
  // La propriété `.red` est fournie par le chargement préalable du
  // module `colors` (par `server.js`).
  console.error('✘ CANNOT CONNECT TO mongoDB DATABASE wazaaa!'.red)
})

// On exporte une fonction d'enregistrement d'un callback de connexion
// réussie, si ça intéresse l'appelant (`server.js` s'en sert pour confirmer
// dans la console que la connexion est prête).
//
// Ce n'est pas anodun, car Mongoose va mettre en file d'attente toute opération
// DB jusqu'à ce que la connexion soit établie, donc vérifier ce dernier point
// est utile.
export default function listenToConnectionOpen (onceReady) {
  if (onceReady) {
    db.on('open', onceReady)
  }
}
