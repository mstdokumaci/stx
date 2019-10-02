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

  let doneCount = 0
  const done = () => {
    if (++doneCount >= 2) {
      client.socket.close()
      hServer.close()
      hybrid.socket.close()
      server.close()
      t.end()
    }
  }

  cMaster.subscribe({ keys: ['first'] }, cm => {
    if (cm.get('first')) {
      t.equals(
        cm.get(['first', 'id']).compute(),
        1,
        'cm.first.id.compute() = 1'
      )

      t.same(
        cm.serialize(),
        {
          first: {
            id: 1
          }
        },
        'cm.serialize = correct'
      )
      done()
    }
  })

  hMaster.subscribe(hm => {
    if (hm.get('first')) {
      t.same(
        hm.serialize(),
        {
          first: {
            id: 1
          },
          second: {
            id: 2
          }
        },
        'hm.serialize = correct'
      )
      done()
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})
