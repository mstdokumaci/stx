const test = require('tape')
const { create } = require('../../../dist/index')

test('network - remove subscriptions', t => {
  const sMaster = create({
    first: 1,
    second: 2,
    third: 3
  })

  const server = sMaster.listen(7070)

  const cMaster = create()

  cMaster.subscribe(
    { keys: [ 'fourth', 'fifth' ] },
    cm => {
      if (cm.get('fifth')) {
        t.equals(
          cm.get('fifth').compute(),
          5,
          's2 cm.fifth.compute() = 5'
        )

        client.socket.close()
        server.close()
        t.end()
      } else if (cm.get('fourth')) {
        t.equals(
          cm.get('fourth').compute(),
          4,
          's2 cm.fourth.compute() = 4'
        )
      }
    }
  )

  const s1 = cMaster.subscribe(
    { excludeKeys: [ 'first' ] },
    cm => {
      if (cm.get('fourth')) {
        t.same(
          cm.serialize(),
          { second: 2, third: 3, fourth: 4 },
          's1 cm.serialize() = { second: 2, third: 3, fourth: 4 }'
        )

        s1.unsubscribe()

        setTimeout(() => {
          sMaster.set({
            fifth: 5
          })
        })
      } else if (cm.get('fifth')) {
        t.fail('s1 should not fire for fifth')
      } else if (cm.get('second')) {
        t.same(
          cm.serialize(),
          { second: 2, third: 3 },
          's1 cm.serialize() = { second: 2, third: 3 }'
        )

        setTimeout(() => {
          sMaster.set({
            fourth: 4
          })
        })
      }
    }
  )

  const client = cMaster.connect('ws://localhost:7070')
})
