const test = require('tape')
const { create } = require('../../dist/index')

test('network - listen & connect', t => {
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

test('network - listen & reconnect', t => {
  const master = create()
  const server1 = master.listen(7070)

  const client = create()
  const socket = client.connect('ws://localhost:7070')

  server1.close()
  t.pass('server1 closed')
  const server2 = master.listen(7070)

  socket.close()
  t.pass('socket closed')

  server2.close()
  t.pass('server2 closed')

  t.end()
})
