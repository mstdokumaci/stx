const test = require('tape')
const { create } = require('../../dist/index')

test('network - server1', t => {
  const master = create()
  const server = master.listen(7070)

  const client = create()
  const socket = client.connect('ws://localhost:7070')
  socket.close()
  t.pass('socket closed')

  server.close()
  t.pass('server closed')

  t.end()
})

test('network - server2', t => {
  const master = create()
  const server = master.listen(7070)

  const client = create()
  const socket = client.connect('ws://localhost:7070')
  socket.close()
  t.pass('socket closed')

  server.close()
  t.pass('server closed')

  t.end()
})
