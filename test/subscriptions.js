const test = require('tape')
const { create } = require('../dist/index')

test('subscriptions - deep field references', t => {
  const master = create({
    id: 'master',
    deep: {
      real: {
        deeper: {
          pointer1: ['@', 'otherDeep']
        }
      }
    },
    pointers: {
      pointer2: ['@', 'deep', 'real'],
      pointer3: ['@', 'pointers', 'pointer2']
    },
    otherDeep: {
      deeper: {
        field: 'is a thing'
      }
    }
  })

  master.get([ 'pointers', 'pointer2' ]).subscribe(item => {
    console.log(item.root().get('id').compute(), item.path())
  })

  master.get([ 'pointers', 'pointer3' ]).subscribe(item => {
    console.log(item.root().get('id').compute(), item.path())
  })

  const branch = master.create()

  branch.get([ 'pointers', 'pointer2' ]).subscribe(item => {
    console.log(item.root().get('id').compute(), item.path())
    /*
    if (type === 'new') {
      t.equals(
        val.get(['deeper', 'pointer1', 'deeper', 'field', 'compute']), 'is a thing',
        'pointer2 fired for original'
      )
    } else if (type === 'update') {
      t.equals(
        val.get(['deeper', 'pointer1', 'deeper', 'field', 'compute']), 'override',
        'pointer2 fired for override'
      )
    }
    */
  })

  branch.get([ 'pointers', 'pointer3' ]).subscribe(item => {
    console.log(item.root().get('id').compute(), item.path())
    /*
    if (type === 'new') {
      t.equals(
        val.get(['deeper', 'pointer1', 'deeper', 'field', 'compute']), 'is a thing',
        'pointer3 fired for original'
      )
    } else if (type === 'update') {
      t.equals(
        val.get(['deeper', 'pointer1', 'deeper', 'field', 'compute']), 'override',
        'pointer3 fired for override'
      )
    }
    */
  })

  branch.set({
    key: 'branch',
    otherDeep: {
      deeper: {
        field: 'override'
      }
    }
  })

  t.end()
})
