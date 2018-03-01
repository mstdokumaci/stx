const test = require('tape')
const { create } = require('../../dist/index')

test('network - subscriptions', t => {
  const master = create({
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

  const server = master.listen(7070)

  const client1 = create({ id: 'client1' })
  const items1 = client1.get('items', {})

  const client2 = create({ id: 'client2' })
  const items2 = client2.get('items', {})

  items1.subscribe({
    keys: [ 'first', 'third' ]
  }, i1 => {
    if (i1.get('first')) {
      if (i1.get([ 'first', 'items' ])) {
        t.same(
          i1.serialize(),
          {
            first: {
              title: 'item 1',
              items: {
                third: [ '@', 'items', 'third' ]
              }
            },
            third: { title: 'item 3', id: 3 }
          },
          'client1.items.serialize = correct'
        )

        client1.branch.client.socket.close()
        client2.branch.client.socket.close()
        server.close()
        t.end()
      } else {
        t.same(
          i1.serialize(),
          { first: { title: 'item 1' }, third: { title: 'item 3' } },
          'client1.items.serialize = correct'
        )
      }
    }
  })

  client2.on('connected', val => {
    if (val) {
      items2.subscribe({
        excludeKeys: [ 'third' ],
        depth: 2
      }, i2 => {
        if (i2.get('first')) {
          t.same(
            i2.serialize(),
            { first: { title: 'item 1' }, second: { title: 'item 2' } },
            'client2.items.serialize = correct'
          )

          setTimeout(() => {
            master.set({
              items: {
                first: {
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
      })
    }
  })

  client1.connect('ws://localhost:7070')
  client2.connect('ws://localhost:7070')
})
