const test = require('tape')
const { create } = require('../../dist')

test('network - switch branch', t => {
  const sMaster = create({
    clients: 0
  })
  const server = sMaster.listen(7070)

  server.switchBranch = (fromBranch, branchKey, switcher) => {
    fromBranch.set({
      clients: fromBranch.get('clients').compute() + 1
    })
    const toBranch = switcher(branchKey)
    toBranch.set({
      id: branchKey
    })
  }

  const cMaster1 = create()
  const cMaster2 = create()
  const cMaster3 = create()

  t.plan(3)

  cMaster1.on('connected', val => {
    if (val) {
      cMaster1.subscribe(cm => {
        if (cm.get('id') && cm.get('clients').compute() === 3) {
          t.same(
            cm.serialize(),
            { clients: 3, id: 'A' },
            'cm1.serialize() = { clients: 3, id: A }'
          )

          client1.socket.close()
        }
      })

      cMaster1.switchBranch('A')
    } else {
      server.close()
    }
  })

  cMaster2.on('connected', val => {
    if (val) {
      cMaster2.subscribe(cm => {
        if (cm.get('id') && cm.get('clients').compute() === 3) {
          t.same(
            cm.serialize(),
            { clients: 3, id: 'A' },
            'cm2.serialize() = { clients: 3, id: A }'
          )

          client2.socket.close()
        }
      })

      cMaster2.switchBranch('A')
    }
  })

  cMaster3.on('connected', val => {
    if (val) {
      cMaster3.subscribe(cm => {
        if (cm.get('id') && cm.get('clients').compute() === 3) {
          t.same(
            cm.serialize(),
            { clients: 3, id: 'B' },
            'cm3.serialize() = { clients: 3, id: B }'
          )

          client3.socket.close()
        }
      })

      cMaster3.switchBranch('B')
    }
  })

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
  const client3 = cMaster3.connect('ws://localhost:7070')
})
