const test = require('tape')
const { create, createPersist } = require('../../dist')
const { Persist } = require('../helpers')

test('network - persist set', async t => {
  const masterPersist = new Persist('master')
  const sMaster = await createPersist({
    clients: 0,
    first: {
      id: 1
    },
    second: {
      id: 2
    },
    third: {
      id: 3
    },
    pointer: [ '@', 'first' ]
  }, masterPersist)

  const server = sMaster.listen(7070)

  server.switchBranch = async (_, branchKey, switcher) => {
    const branchPersist = new Persist(branchKey)
    const toBranch = await switcher(branchKey, branchPersist)

    toBranch.branch.clientCanUpdate = [
      {
        path: [ 'pointer' ]
      }
    ]
  }

  const cMaster = create()

  cMaster.on('connected', val => {
    if (val) {
      const sub = cMaster.get('pointer', {}).subscribe(pointer => {
        const id = pointer.get('id')
        if (id) {
          t.same(id.compute(), 1, 'id.compute() = 1')

          sub.unsubscribe()

          pointer.set([ '@', 'second' ])
          cMaster.set({ third: null })

          setTimeout(() => client.socket.close(), 50)
        }
      })

      cMaster.switchBranch('A')
    } else {
      server.close()
      t.end()
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})

test('network - persist get', async t => {
  const masterPersist = new Persist('master')
  const sMaster = await createPersist({}, masterPersist)

  const server = sMaster.listen(7070)

  server.switchBranch = async (fromBranch, branchKey, switcher) => {
    return switcher(branchKey, new Persist(branchKey))
  }

  const cMaster = create()

  cMaster.on('connected', val => {
    if (val) {
      cMaster.get('pointer', {}).subscribe(pointer => {
        const id = pointer.get('id')
        if (id) {
          if (id.compute() === 2) {
            t.equals(
              cMaster.get('third'),
              void 0,
              'third = undefined'
            )
            t.pass('id.compute() === 2')
            sMaster.get([ 'second', 'id' ]).set('updated 2')
          } else if (id.compute() === 'updated 2') {
            t.pass('id.compute() === updated 2')
            client.socket.close()
          }
        }
      })

      cMaster.switchBranch('A')
    } else {
      server.close()
      t.end()
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})
