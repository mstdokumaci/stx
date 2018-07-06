const { create } = require('../dist/index')

/*
const state = create({ firstKey: 'value' })
console.log(state.serialize())

state.set({ second: { subKey: 'subValue' } })
console.log(state.serialize())

console.log(state.get('second').serialize())

state.set({ firstKey: null })
console.log(state.get('firstKey'))

console.log(state.serialize())

const subKey = state.get(['second', 'subKey'])
console.log(subKey.compute())

console.log(state.get('first', 1).compute())
console.log(state.get('first').compute())

console.log(subKey.path())

console.log(subKey.parent().serialize())

console.log(subKey.root().serialize())

let fired = []
state.set({ third: 3 })
const third = state.get('third')
const listener = third
  .on((val, stamp, item) => fired.push(`${val}-${item.compute()}`))
console.log(fired)
third.set('changed')
console.log(fired)
state.set({ third: 'again' })
console.log(fired)

listener.off()
third.set('yet again')
console.log(fired)

const errors = []
state.on('error', err => errors.push(err))
state.emit('error', 'satellites are not aligned')
console.log(errors)
subKey.on('error', err => errors.push(err))
subKey.emit('error', 'splines are not reticulated')
console.log(errors)

const master = create({
  movies: {
    runLolaRun: {
      year: 1998,
      imdb: 7.7,
      title: 'Run Lola Run'
    },
    goodByeLenin: {
      year: 2003,
      imdb: 7.7,
      title: 'Good Bye Lenin'
    },
    theEdukators: {
      year: 2004,
      imdb: 7.5,
      title: 'The Edukators'
    }
  }
})

const branchA = master.create({
  userName:'A',
  movies: {
    runLolaRun: { favourite: true },
    theEdukators: { favourite: true }
  }
})

const branchB = master.create({
  userName:'B',
  movies: {
    goodByeLenin: { favourite: true }
  }
})

console.log(master.get('userName'))

console.log(branchA.get(['movies', 'theEdukators']).serialize())
console.log(branchB.get(['movies', 'theEdukators']).serialize())
console.log(master.get(['movies', 'theEdukators']).serialize())

master.get(['movies', 'runLolaRun', 'rating'], 'R')
console.log(branchA.get(['movies', 'runLolaRun', 'rating']).compute())
console.log(branchB.get(['movies', 'runLolaRun', 'rating']).compute())

branchB.get(['movies', 'runLolaRun', 'rating']).set('G')
console.log(branchA.get(['movies', 'runLolaRun', 'rating']).compute())

master.get(['movies', 'runLolaRun', 'rating']).set('PG')
console.log(branchA.get(['movies', 'runLolaRun', 'rating']).compute())
console.log(branchB.get(['movies', 'runLolaRun', 'rating']).compute())

fired = []
branchA.get('movies').on('reload', val => fired.push(`A-${val}`))
branchB.get('movies').on('reload', val => fired.push(`B-${val}`))
master.get('movies').emit('reload', 'now')
branchA.get('movies').emit('reload', 'later')
console.log(fired)

branchB.set({
  watched: {
    runLolaRun: [ '@', 'movies', 'runLolaRun' ],
    goodByeLenin: [ '@', 'movies', 'goodByeLenin' ]
  }
})
console.log(branchB.get([ 'watched', 'goodByeLenin', 'favourite' ]).compute())
console.log(branchB.get([ 'watched', 'runLolaRun', 'favourite' ]))

console.log(branchB.get([ 'watched', 'goodByeLenin' ]).serialize())
console.log(branchB.get([ 'watched', 'goodByeLenin' ]).origin().serialize())

fired = []
branchB.get([ 'watched', 'runLolaRun' ])
  .on('data', (val, stamp, item) => {
    fired.push(`${val}-${item.get('favourite').compute()}`)
  })
branchB.get([ 'movies', 'runLolaRun' ]).set({ favourite: true })
console.log(fired)

let count = 0
const items = create({
  i1: {
    title: 'Item 1',
    items: {
      sub2: ['@', 'i2'],
      sub3: ['@', 'i3']
    }
  },
  i2: {
    title: 'Item2',
    items: {
      sub1: ['@', 'i1']
    }
  },
  i3: {
    title: 'Item3',
    items: {
      sub2: ['@', 'i2']
    }
  }
})

let subscription = items.get('i2').subscribe(() => { count++ })
console.log(count)

items.set({
  i2: {
    title: 'Title2'
  }
})
console.log(count)

items.get('i3').set({
  title: 'Title3'
})
console.log(count)

subscription.unsubscribe()

count = 0
subscription = items.get('i2').subscribe({
  keys: [ 'items' ],
  depth: 3
}, () => { count++ })
console.log(count)

items.set({
  i2: {
    title: 'Title2'
  }
})
console.log(count)

items.get('i1').set({
  title: 'Title1'
})
console.log(count)

items.get('i3').set({
  description: 'Description3'
})
console.log(count)

subscription.unsubscribe()

const server = items.listen(7171)
items.on('log', line => {
  console.log(line)
  server.close()
})

const cItems = create()
const client = cItems.connect('ws://localhost:7171')
cItems.get('i1', {}).subscribe(
  { depth: 1 },
  i1 => {
    if (i1.get('title')) {
      console.log(cItems.serialize())
      cItems.emit('log', 'Hello!')
      client.socket.close()
    }
  }
)

*/

const state = create()
console.log(state.parent())
