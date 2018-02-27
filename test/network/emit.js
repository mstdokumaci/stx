const test = require('tape')
const { create } = require('../../dist/index')

test('network - emit', t => {
  const master = create({
    deep: {
      real: 'thing'
    }
  })
  const server = master.listen(7070)

  const client = create()
  client.on('connected', val => {
    if (val) {
      master.get([ 'deep', 'real' ]).on('event', val => {
        t.equals(val, 'value', 'event fired on master')
        client.branch.client.socket.close()
        server.close()
        t.end()
      })

      client.get([ 'deep', 'real' ], {}).emit('event', 'value')
    }
  })

  client.connect('ws://localhost:7070')
})
