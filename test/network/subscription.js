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

test('network - subscription - data size', { timeout: 3000 }, t => {
  const master = create({
    id: 'master'
  })

  const server = master.listen(7070)

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

  master.set({ bigData })

  const client = create({
    id: 'client'
  })

  client.connect('ws://localhost:7070')

  t.plan(2)

  client.get('bigData', {}).subscribe(bigData => {
    if (bigData.get('here')) {
      t.equals(
        bigData.get('here').compute(),
        'it is',
        'subscription fired for bigData'
      )
      client.branch.client.socket.close()
      server.close()
    }
  })

  client.get('otherData', {}).subscribe(otherData => {
    if (otherData.get('here')) {
      t.equals(
        otherData.get('here').compute(),
        'it is',
        'subscription fired for otherData'
      )
    }
  })

  client.on('connected', val => {
    if (val) {
      master.set({
        otherData: {
          here: 'it is'
        }
      })
    }
  })
})
