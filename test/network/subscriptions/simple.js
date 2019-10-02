const test = require('tape')
const { create } = require('../../../dist')

test('network - subscriptions - simple', t => {
  const sMaster = create({
    id: 'master',
    items: {
      first: {
        title: 'item 1'
      },
      second: {
        title: 'item 2'
      },
      third: {
        title: 'item 3'
      }
    }
  })

  const server = sMaster.listen(7070)

  const cMaster1 = create({ id: 'client1' })
  const items1 = cMaster1.get('items', {})

  const cMaster2 = create({ id: 'client2' })
  const items2 = cMaster2.get('items', {})

  items1.subscribe({
    keys: ['first', 'third']
  }, i1 => {
    if (i1.get('first')) {
      if (i1.get(['first', 'items'])) {
        t.same(
          i1.serialize(),
          {
            first: {
              title: 'item 1 with items',
              items: {
                third: ['@', 'items', 'third']
              }
            },
            third: { title: 'item 3', id: 3 }
          },
          'cMaster1.items.serialize = correct2'
        )

        sMaster.set({
          items: {
            second: {
              title: null,
              id: 2
            }
          }
        })
      } else {
        t.same(
          i1.serialize(),
          { first: { title: 'item 1' }, third: { title: 'item 3' } },
          'cMaster1.items.serialize = correct1'
        )
      }
    }
  })

  cMaster2.on('connected', val => {
    if (val) {
      items2.subscribe({
        excludeKeys: ['third'],
        depth: 2
      }, i2 => {
        if (i2.get('first')) {
          if (!i2.get(['second', 'title'])) {
            t.same(
              i2.serialize(),
              { first: { title: 'item 1 with items', items: {} }, second: { id: 2 } },
              'cMaster2.items.serialize = correct3'
            )

            client1.socket.close()
            client2.socket.close()
            server.close()
            t.end()
          } else if (i2.get(['first', 'items'])) {
            t.same(
              i2.serialize(),
              { first: { title: 'item 1 with items', items: {} }, second: { title: 'item 2' } },
              'cMaster2.items.serialize = correct2'
            )
          } else {
            t.same(
              i2.serialize(),
              { first: { title: 'item 1' }, second: { title: 'item 2' } },
              'cMaster2.items.serialize = correct1'
            )

            sMaster.set({
              items: {
                first: {
                  title: 'item 1 with items',
                  items: {
                    third: ['@', 'items', 'third']
                  }
                },
                third: {
                  id: 3
                }
              }
            })
          }
        }
      })
    }
  })

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
})

test('network - subscriptions - on branch', t => {
  const master = create({
    id: 'master',
    i1: {
      title: 'item 1'
    },
    i2: {
      title: 'item 2'
    }
  })

  const branch = master.create({ id: 'branch' })

  const server = branch.listen(7070, true)

  const cMaster1 = create({ id: 'client1' })
  const cMaster2 = create({ id: 'client2' })

  let closedCount = 0
  const closed = () => {
    if (++closedCount >= 2) {
      server.close()
      t.end()
    }
  }

  cMaster1.on('connected', val => val || closed())
  cMaster2.on('connected', val => val || closed())

  cMaster1.subscribe(
    { excludeKeys: ['id', 'i2'] },
    cm => {
      if (cm.get('i1')) {
        if (cm.get(['i1', 'title']).compute() === 'item 1') {
          t.same(
            cm.serialize(),
            { id: 'client1', i1: { title: 'item 1' } },
            'cm1.serialize() = { id: client1, i1: { title: item 1 } }'
          )

          branch.set({
            i1: {
              title: 'item 1 override'
            },
            i2: {
              title: 'item 2 override'
            },
            i3: {
              title: 'item 3'
            }
          })
        } else {
          t.same(
            cm.serialize(),
            {
              id: 'client1',
              i1: { title: 'item 1 override' },
              i3: { title: 'item 3' }
            },
            'cm1.serialize() = correct'
          )

          client1.socket.close()
        }
      }
    }
  )

  cMaster2.subscribe(
    { keys: ['i2', 'i3'] },
    cm => {
      if (cm.get('i3')) {
        t.equals(
          cm.get(['i3', 'title']).compute(),
          'item 3',
          'cm2.i3.title.compute() = item 3'
        )

        client2.socket.close()
      } else if (cm.get('i2')) {
        t.equals(
          cm.get(['i2', 'title']).compute(),
          'item 2',
          'cm2.i2.title.compute() = item 2'
        )
      }
    }
  )

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
})
