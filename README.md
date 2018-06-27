# stx
Batteries included data structure / state manager.

[![Build Status](https://travis-ci.org/mstdokumaci/stx.svg?branch=master)](https://travis-ci.org/mstdokumaci/stx)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/stx.svg)](https://badge.fury.io/js/stx)
[![Coverage Status](https://coveralls.io/repos/github/mstdokumaci/stx/badge.svg?branch=master)](https://coveralls.io/github/mstdokumaci/stx?branch=master)

## CRUD operations

### Create

```js
import { create } from 'stx'
const state = create({ firstKey: 'value' })
```

### Serialize

```js
state.serialize() // → { firstKey: 'value' }
```

### Set

⚠ Default behaviour is merge.

```js
state.set({ second: { subKey: 'subValue' } })
state.serialize() // → { firstKey: 'value', second: { subKey: 'subValue' } }
```

### Get

```js
state.get('second').serialize() // → { subKey: 'subValue' }
```

### Remove

```js
state.set({ firstKey: null })
state.get('firstKey') // → undefined
state.serialize() // → { second: { subKey: 'subValue' } }
```

### Compute

```js
const subKey = state.get(['second', 'subKey'])
subKey.compute() // → subValue
```
### Get with set

Second parameter of get is a default value for the path.

⚠ It'll be `set` and returned in absence of given path otherwise it'll be ignored.

```js
state.get('first', 1).compute() // → 1
state.get('first').compute() // → 1
```


## Navigate

### Path

```js
subKey.path() // → [ 'second', 'subKey' ]
```

### Parent

```js
subKey.parent().serialize() // → { subKey: 'subValue' }
```

### Root

```js
subKey.root().serialize() // → { second: { subKey: 'subValue' }, first: 1 }
```

## Listeners

### On

```js
let fired = []
state.set({ third: 3 })
const third = state.get('third')
const listener = third.on((val, stamp, item) => fired.push(`${val}-${item.compute()}`))
fired // → []
third.set('changed')
fired // → [ 'set-changed' ]
state.set({ third: 'again' })
fired // → [ 'set-changed', 'set-again' ]
```

### Off

```js
listener.off()
third.set('yet again')
fired // → [ 'set-changed', 'set-again' ]
```

### Emit

⚠ Events fired on a path can be listened only at exact same path.

```js
const errors = []
state.on('error', err => errors.push(err))
state.emit('error', 'satellites are not aligned')
errors // → [ 'satellites are not aligned' ]
subKey.on('error', err => errors.push(err))
subKey.emit('error', 'splines are not reticulated')
errors // → [ 'satellites are not aligned', 'splines are not reticulated' ]
```

## Creating branches from master

```js
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

master.get('userName') // → undefined

branchA.get(['movies', 'theEdukators']).serialize()
// → { favourite: true, year: 2004, imdb: 7.5, title: 'The Edukators' }
branchB.get(['movies', 'theEdukators']).serialize()
// → { year: 2004, imdb: 7.5, title: 'The Edukators' }
master.get(['movies', 'theEdukators']).serialize()
// → { year: 2004, imdb: 7.5, title: 'The Edukators' }

master.get(['movies', 'runLolaRun', 'rating'], 'R')
branchB.get(['movies', 'runLolaRun', 'rating']).compute() // → R
branchA.get(['movies', 'runLolaRun', 'rating']).compute() // → R

branchB.get(['movies', 'runLolaRun', 'rating']).set('G')
branchA.get(['movies', 'runLolaRun', 'rating']).compute() // → R

master.get(['movies', 'runLolaRun', 'rating']).set('PG')
branchA.get(['movies', 'runLolaRun', 'rating']).compute() // → PG
branchB.get(['movies', 'runLolaRun', 'rating']).compute() // → G
```

### Listeners on branches

```js
fired = []
branchA.get('movies').on('reload', val => fired.push(`A-${val}`))
branchB.get('movies').on('reload', val => fired.push(`B-${val}`))
master.get('movies').emit('reload', 'now')
branchA.get('movies').emit('reload', 'later')
fired // → [ 'A-now', 'B-now', 'A-later' ]
```

## References

```js
branchB.set({
  watched: {
    runLolaRun: [ '@', 'movies', 'runLolaRun' ],
    goodByeLenin: [ '@', 'movies', 'goodByeLenin' ]
  } 
})

branchB.get([ 'watched', 'goodByeLenin', 'favourite' ]).compute() // → true
branchB.get([ 'watched', 'runLolaRun', 'favourite' ]) // → undefined
```

### Origin

```js
branchB.get([ 'watched', 'goodByeLenin' ]).serialize()
// → [ '@', 'movies', 'goodByeLenin' ]
branchB.get([ 'watched', 'goodByeLenin' ]).origin().serialize()
// → { favourite: true, year: 2003, imdb: 7.7, title: 'Good Bye Lenin' }
```

### Data listeners on references

```js
fired = []
branchB.get([ 'watched', 'runLolaRun' ])
  .on('data', (val, stamp, item) => {
    fired.push(`${val}-${item.get('favourite').compute()}`)
  })
branchB.get([ 'movies', 'runLolaRun' ]).set({ favourite: true })
fired // → [ 'add-key-true' ]
```

## Subscriptions

```js
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

items.get('i2').subscribe(() => { count++ })
count // → 1 (fired once for existing path)

items.set({
  i2: {
    description: 'Description2'
  }
})
count // → 2 (fired once more for immediate child)

items.get('i3').set({
  description: 'Description3'
})
count // → 3 (fired once more for nested child)
// i2.items.sub1.items.sub3.description === i3.description
```
