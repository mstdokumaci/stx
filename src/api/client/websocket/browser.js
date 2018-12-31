const WebSocket = window.WebSocket

const bindSocketListeners = (socket, close, error, open, message) => {
  socket.onclose = close
  socket.onerror = error
  socket.onopen = open
  socket.onmessage = ({ data }) => message(data)
}

export { WebSocket, bindSocketListeners }
