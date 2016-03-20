import { createServer } from 'http'

import 'colors'

const server = createServer((req, res) => {
  res.end('WAZAAA!')
})

server.listen(3000, () => {
  console.log('✔ Server listening on port'.green, String(3000).cyan)
})
