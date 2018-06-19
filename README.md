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
state.serialize() // → { "firstKey": "value" }
```

### Set

⚠ Default behaviour is merge.

```js
state.set({ second: { subKey: 'subValue' } })
state.serialize() // → { "firstKey": "value", "second": { "subKey": "subValue" } }
```

### Get

```js
state.get('second').serialize() // → { "subKey": "subValue" }
```

### Remove

```js
state.set({ firstKey: null })
state.get('firstKey') // → undefined
state.serialize() // → { "second": { "subKey": "subValue" } }
```

### Compute

```js
const subKey = root.get(['second', 'subKey'])
subKey.compute() // → "subValue"
```

## Navigate

### Path

```js
subKey.path() // → ["second", "subKey"]
```

### Parent

```js
subKey.parent().serialize() // → { "subKey": "subValue" }
```

### Root

```js
subKey.root().serialize() // → { "second": { "subKey": "subValue" } }
```

