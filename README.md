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

## Listen

### On

```js
let results = []
state.set({ third: 3 })
const third = state.get('third')
const listener = third.on((val, stamp, item) => results.push(`${val}-${item.compute()}`))
results // → []
third.set('changed')
results // → [ 'set-changed' ]
state.set({ third: 'again' })
results // → [ 'set-changed', 'set-again' ]
```

### Off

```js
listener.off()
third.set('yet again')
results // → [ 'set-changed', 'set-again' ]
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

# Creating branches of master

```js
const master = create({
  movies: {
    tt0130827: {
     year: 1998,
     imdb: 7.7,
     title: 'Run Lola Run'
    },
    tt0301357: {
      year: 2003,
      imdb: 7.7,
      title: 'Good Bye Lenin'
    },
    tt0408777: {
      year: 2004,
      imdb: 7.5,
      title: 'The Edukators'
    }
  }
})

const branchA = master.create({
  userName:'A',
  movies: {
    tt0130827: { favourite: true },
    tt0408777: { favourite: true }
  }
})

const branchB = master.create({
  userName:'B',
  movies: {
    tt0301357: { favourite: true }
  }
})

master.get('userName') // → undefined

branchA.get(['movies', 'tt0408777']).serialize()
// → { favourite: true, year: 2004, imdb: 7.5, title: 'The Edukators' }
branchB.get(['movies', 'tt0408777']).serialize()
// → { year: 2004, imdb: 7.5, title: 'The Edukators' }
master.get(['movies', 'tt0408777']).serialize()
// → { year: 2004, imdb: 7.5, title: 'The Edukators' }

master.get(['movies', 'tt0130827', 'rating'], 'R')
branchB.get(['movies', 'tt0130827', 'rating']).compute() // → R
branchA.get(['movies', 'tt0130827', 'rating']).compute() // → R

branchB.get(['movies', 'tt0130827', 'rating']).set('G')
branchA.get(['movies', 'tt0130827', 'rating']).compute() // → R

master.get(['movies', 'tt0130827', 'rating']).set('PG')
branchA.get(['movies', 'tt0130827', 'rating']).compute() // → PG
branchB.get(['movies', 'tt0130827', 'rating']).compute() // → G
```
