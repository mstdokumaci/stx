const test = require('tape')
const { create } = require('../../../dist/index')

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
    keys: [ 'first', 'third' ]
  }, i1 => {
    if (i1.get('first')) {
      if (i1.get([ 'first', 'items' ])) {
        t.same(
          i1.serialize(),
          {
            first: {
              title: 'item 1 with items',
              items: {
                third: [ '@', 'items', 'third' ]
              }
            },
            third: { title: 'item 3', id: 3 }
          },
          'cMaster1.items.serialize = correct2'
        )

        setTimeout(() => {
          sMaster.set({
            items: {
              second: {
                title: null,
                id: 2
              }
            }
          })
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
        excludeKeys: [ 'third' ],
        depth: 2
      }, i2 => {
        if (i2.get('first')) {
          if (!i2.get([ 'second', 'title' ])) {
            t.same(
              i2.serialize(),
              { first: { title: 'item 1 with items', items: {} }, second: { id: 2 } },
              'cMaster2.items.serialize = correct3'
            )

            client1.socket.close()
            client2.socket.close()
            server.close()
            t.end()
          } else if (i2.get([ 'first', 'items' ])) {
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

            setTimeout(() => {
              sMaster.set({
                items: {
                  first: {
                    title: 'item 1 with items',
                    items: {
                      third: [ '@', 'items', 'third' ]
                    }
                  },
                  third: {
                    id: 3
                  }
                }
              })
            })
          }
        }
      })
    }
  })

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
})
