const test = require('tape')
const { create } = require('../../dist')

test('network - hybrid', t => {
  const sMaster = create({
    first: {
      id: 1
    },
    second: {
      id: 2
    }
  })
  const server = sMaster.listen(7070)

  const hMaster = create()
  const hServer = hMaster.listen(7171)
  const hybrid = hMaster.connect('ws://localhost:7070')

  const cMaster = create()

  cMaster.subscribe({ keys: ['first'] }, cm => {
    if (cm.get('first')) {
      t.equals(
        cm.get(['first', 'id']).compute(),
        1,
        'cm.first.id.compute() = 1'
      )

      client.socket.close()
      hServer.close()
      hybrid.socket.close()
      server.close()
      t.end()
    }
  })

  hMaster.subscribe(hm => {})

  const client = cMaster.connect('ws://localhost:7070')
})
