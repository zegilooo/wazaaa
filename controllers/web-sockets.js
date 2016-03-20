import io from 'socket.io'

function attachWebSockets (server) {
  if (attachWebSockets.sockets) {
    return
  }

  const ws = io(server)
  attachWebSockets.sockets = ws.sockets
}

export default attachWebSockets
