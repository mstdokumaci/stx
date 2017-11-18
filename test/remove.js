const test = require('tape')
const { Struct } = require('../')

test('remove own', t => {
  const master = new Struct({
    content: {
      first: {
        id: 1,
        name: 'first'
      },
      second: {
        id: 2,
        name: 'second'
      }
    }
  })

  master.set({
    content: {
      first: {
        name: null
      }
    }
  })

  const branch1 = master.create()
  branch1.get('content').set({
    third: {
      id: 3,
      name: 'third'
    },
    fourth: {
      id: 4,
      name: 'fourth'
    }
  })

  branch1.get('content').set({
    third: null
  })

  t.same(
    branch1.serialize(),
    {
      content: {
        first: { id: 1 },
        second: { id: 2, name: 'second' },
        fourth: { id: 4, name: 'fourth' }
      }
    },
    'branch1.serialize() = correct'
  )

  master.get('content').set({
    second: null
  })

  branch1.set({
    content: {
      fourth: {
        name: null
      }
    }
  })

  t.same(
    master.serialize(),
    { content: { first: { id: 1 } } },
    'master.serialize() = { content: { first: { id: 1 } } }'
  )

  t.same(
    branch1.serialize(),
    {
      content: {
        first: { id: 1 },
        fourth: { id: 4 }
      }
    },
    'branch1.serialize() = correct'
  )

  t.end()
})
