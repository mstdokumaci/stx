const test = require('tape')
const { create } = require('../../dist')

test('network - emit', t => {
  const sMaster = create({
    deep: {
      real: 'thing'
    }
  })
  const server = sMaster.listen(7070)

  const cMaster = create()

  cMaster.on('connected', val => {
    if (val) {
      sMaster.get([ 'deep', 'real' ]).on('event', val => {
        t.equals(val, 'value', 'event fired on master')
        client.socket.close()
        server.close()
        t.end()
      })

      cMaster.get([ 'deep', 'real' ], {}).emit('event', 'value')
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})
