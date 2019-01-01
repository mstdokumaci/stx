const test = require('tape')
const { create } = require('../../../dist')

test('network - subscriptions - routing', t => {
  const sMaster = create({
    id: 'master',
    route: [ '@', 'content', 'p1' ],
    content: {
      p1: {
        title: 'Page 1',
        items: {
          i2: [ '@', 'content', 'i2' ],
          i3: [ '@', 'content', 'i3' ]
        }
      },
      p2: {
        title: 'Page 2',
        items: {
          i1: [ '@', 'content', 'i1' ],
          i3: [ '@', 'content', 'i3' ]
        }
      },
      p3: {
        title: 'Page 3',
        items: {
          i1: [ '@', 'content', 'i1' ],
          i2: [ '@', 'content', 'i2' ]
        }
      },
      i1: {
        title: 'Item 1'
      },
      i2: {
        title: 'Item 2'
      },
      i3: {
        title: 'Item 3'
      }
    }
  })

  const server = sMaster.listen(7070)

  sMaster.branch.newBranchMiddleware = branchRoot => {
    branchRoot.branch.clientCanUpdate = [
      {
        path: [ 'route' ]
      }
    ]
  }

  server.switchBranch = (_, branchKey, switcher) => {
    const toBranch = switcher(branchKey)
    toBranch.set({ branchKey })
    return toBranch
  }

  const cMaster1 = create({ id: 'client1' })
  const cMaster2 = create({ id: 'client2' })

  cMaster1.on('connected', val => {
    if (val) {
      cMaster1.get('route', {}).subscribe(cm => {
        if (cm.get('title')) {
          if (cm.get('title').compute() === 'Page 1') {
            t.equals(
              cm.get([ 'items', 'i2', 'title' ]).compute(),
              'Item 2',
              'cm1.items.i2.title.compute() = Item 2'
            )
            t.equals(
              cm.get([ 'items', 'i3', 'title' ]).compute(),
              'Item 3',
              'cm1.items.i3.title.compute() = Item 3'
            )

            cMaster1.get('route').set([ '@', 'content', 'p3' ])
          } else if (cm.get('title').compute() === 'Page 3') {
            t.equals(
              cm.get([ 'items', 'i1', 'title' ]).compute(),
              'Item 1',
              'cm1.items.i1.title.compute() = Item 1'
            )
            t.equals(
              cm.get([ 'items', 'i2', 'title' ]).compute(),
              'Item 2',
              'cm1.items.i2.title.compute() = Item 2'
            )

            cMaster1.switchBranch('user2')
          } else if (cm.get('title').compute() === 'Page 2') {
            t.equals(
              cm.get([ 'items', 'i1', 'title' ]).compute(),
              'Item 1',
              'cm1.items.i1.title.compute() = Item 1'
            )
            t.equals(
              cm.get([ 'items', 'i3', 'title' ]).compute(),
              'Item 3',
              'cm1.items.i3.title.compute() = Item 3'
            )

            client1.socket.close()
            client2.socket.close()
            server.close()
            t.end()
          }
        }
      })

      cMaster1.switchBranch('user1')
    }
  })

  cMaster2.on('connected', val => {
    if (val) {
      cMaster2.get('route', {}).subscribe(cm => {
        if (cm.get('title')) {
          if (cm.get('title').compute() === 'Page 1') {
            t.equals(
              cm.get([ 'items', 'i2', 'title' ]).compute(),
              'Item 2',
              'cm2.items.i2.title.compute() = Item 2'
            )
            t.equals(
              cm.get([ 'items', 'i3', 'title' ]).compute(),
              'Item 3',
              'cm2.items.i3.title.compute() = Item 3'
            )

            cMaster2.get('route').set([ '@', 'content', 'p2' ])
          } else if (cm.get('title').compute() === 'Page 2') {
            t.equals(
              cm.get([ 'items', 'i1', 'title' ]).compute(),
              'Item 1',
              'cm2.items.i1.title.compute() = Item 1'
            )
            t.equals(
              cm.get([ 'items', 'i3', 'title' ]).compute(),
              'Item 3',
              'cm2.items.i3.title.compute() = Item 3'
            )

            cMaster2.switchBranch('user1')
          } else if (cm.get('title').compute() === 'Page 3') {
            t.equals(
              cm.get([ 'items', 'i1', 'title' ]).compute(),
              'Item 1',
              'cm2.items.i1.title.compute() = Item 1'
            )
            t.equals(
              cm.get([ 'items', 'i2', 'title' ]).compute(),
              'Item 2',
              'cm2.items.i2.title.compute() = Item 2'
            )
          }
        }
      })

      cMaster2.switchBranch('user2')
    }
  })

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
})
