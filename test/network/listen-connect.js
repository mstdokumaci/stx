const test = require('tape')
const { create } = require('../../dist')

test('network - listen & connect', t => {
  const sMaster = create()
  const server = sMaster.listen(7070, true)

  const cMaster = create()
  cMaster.on('connected', val => {
    if (val) {
      t.pass('socket connected')
      setTimeout(() => {
        client.socket.close()
      })
    } else {
      t.pass('socket closed')

      server.close()
      t.pass('server closed')

      t.end()
    }
  })

  const client = cMaster.connect('ws://localhost:7070')

  try {
    cMaster.connect('ws://localhost:7070')
  } catch (error) {
    t.equals(error.message, 'Can not connect twice', 'Can not connect twice')
  }
})

test('network - listen & reconnect', t => {
  const sMaster = create()
  const server1 = sMaster.listen(7070)

  const cMaster = create()

  let connectCount = 0
  let server2

  cMaster.on('connected', val => {
    if (val) {
      t.pass('socket connected')
      if (++connectCount > 1) {
        client.socket.close()
      } else {
        server1.close()
        server2 = cMaster.listen(7070)
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

  const client = cMaster.connect('ws://localhost:7070')
})
