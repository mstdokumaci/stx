const test = require('tape')
const { create } = require('../../dist/index')

test('network - listen & connect', t => {
  const master = create()
  const server = master.listen(7070)

  const client = create()
  client.on('connected', val => {
    if (val) {
      t.pass('socket connected')
      client.branch.client.socket.close()
    } else {
      t.pass('socket closed')

      server.close()
      t.pass('server closed')

      t.end()
    }
  })

  client.connect('ws://localhost:7070')
})

test('network - listen & reconnect', t => {
  const master = create()
  const server1 = master.listen(7070)

  const client = create()

  let connectCount = 0
  let server2

  client.on('connected', val => {
    if (val) {
      t.pass('socket connected')
      if (++connectCount > 1) {
        client.branch.client.socket.close()
      } else {
        server1.close()
        server2 = master.listen(7070)
      }
    } else {
      t.pass('socket closed')

      if (connectCount > 1) {
        server2.close()
        t.pass('server closed')

        t.end()
      }
    }
  })

  client.connect('ws://localhost:7070')
})
