const test = require('tape')
const { create } = require('../../dist/index')

test('network - subscriptions', t => {
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

test('network - subscription - data size', { timeout: 3000 }, t => {
  const sMaster = create({
    id: 'master'
  })

  const server = sMaster.listen(7070)

  const bigData = { here: 'it is' }
  const val = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ' +
    'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
    'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
    'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit' +
    'anim id est laborum. Blandit inimicus pri ex, no placerat invenire vim. In ignota noster ' +
    'dicunt mel. Odio omnis everti duo ea. Nulla detraxit deserunt et nec, ne tempor pericula ' +
    'his. Per epicurei interesset an, cum te menandri ullamcorper, ut mea velit inciderint. ' +
    'Justo facer nam ea, ius scripta alienum delectus no. Usu in periculis mediocritatem, quo ' +
    'inermis epicuri delectus ut, mei cu nominavi rationibus voluptatibus. At diam facilisis ' +
    'eos, nam ad copiosae insolens. Vix ei ipsum dicam interpretaris. Augue impetus suscipit ' +
    'in has. Eum id tale augue denique, euripidis persecuti et vis. At recteque persequeris ' +
    'vel. Ludus partem maluisset duo ne. Eum an idque eligendi. Ei utroque voluptaria eos. ' +
    'Et omnis tincidunt ius, et cetero sapientem facilisis ius. Pro te lobortis pertinacia. ' +
    'Nobis vidisse detraxit sit ut. Cu splendide complectitur sea, mei ea decore nusquam ' +
    'invenire. Vix no mollis tamquam eligendi, id cum feugait nominavi, ut regione delenit ' +
    'sapientem est. Vis an disputando repudiandae, qui illud incorrupte te, sed maluisset ' +
    'consetetur posidonium te. Amet placerat eum ne, qui sumo partiendo salutandi ea. Mel ' +
    'case civibus eligendi ei, ei causae cetero eum, stet impetus ea est. Urbanitas ' +
    'signiferumque ex per. An dico habeo disputationi eam, vim te meis antiopam sententiae, ' +
    'propriae periculis adversarium eos ex. Insolens percipitur efficiantur qui at, dicam ' +
    'qualisque appellantur ne per. In saepe delenit incorrupte eam, antiopam elaboraret id ' +
    'eum. Mazim noluisse definitiones has ad, vel id erat equidem. Ex qui inani iusto delenit.'
  let i = 1e3
  while (i--) {
    const d = 1e11 + Math.round(Math.random() * 1e9) + i
    bigData[`key-${d}-longer-string-${d}`] = {
      keyOne: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyTwo: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyThree: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyFour: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyFive: { subKeyOne: val, subKeyTwo: val, subKeyThree: val }
    }
  }

  sMaster.set({ bigData })

  const cMaster = create({
    id: 'client'
  })

  t.plan(2)

  cMaster.get('bigData', {}).subscribe(bigData => {
    if (bigData.get('here')) {
      t.equals(
        bigData.get('here').compute(),
        'it is',
        'subscription fired for bigData'
      )
      client.socket.close()
      server.close()
    }
  })

  cMaster.get('otherData', {}).subscribe(otherData => {
    if (otherData.get('here')) {
      t.equals(
        otherData.get('here').compute(),
        'it is',
        'subscription fired for otherData'
      )
    }
  })

  cMaster.on('connected', val => {
    if (val) {
      sMaster.set({
        otherData: {
          here: 'it is'
        }
      })
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})

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
