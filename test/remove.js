const test = require('tape')
const { create } = require('../')

test('remove own', t => {
  const master = create({
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

test('remove on branch', t => {
  const master = create({
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

  const branch1 = master.create()
  branch1.get('content').set({
    second: null,
    third: {
      id: 3,
      name: 'third'
    }
  })

  t.same(
    branch1.serialize(),
    {
      content: {
        third: { id: 3, name: 'third' },
        first: { id: 1, name: 'first' }
      }
    },
    'branch1.serialize() = correct'
  )

  t.equals(
    branch1.get([ 'content', 'second', 'name' ]),
    void 0,
    'branch1.second.name = void 0'
  )

  const branch2 = branch1.create({
    content: {
      second: {
        id: 2
      }
    }
  })

  master.set({
    content: {
      second: {
        title: 'Second Title'
      }
    }
  })

  t.equals(
    branch1.get([ 'content', 'second', 'title' ]),
    void 0,
    'branch1.second.title = void 0'
  )

  t.same(
    branch2.get('content').serialize(),
    {
      first: { id: 1, name: 'first' },
      second: { id: 2 },
      third: { id: 3, name: 'third' }
    },
    'branch2.serialize() = correct'
  )

  t.equals(
    branch2.get([ 'content', 'second', 'name' ]),
    void 0,
    'branch2.second.name = void 0'
  )

  t.equals(
    branch2.get([ 'content', 'second', 'title' ]),
    void 0,
    'branch2.second.title = void 0'
  )

  branch1.get('content').set({
    second: null
  })

  t.same(
    branch1.serialize(),
    {
      content: {
        third: { id: 3, name: 'third' },
        first: { id: 1, name: 'first' }
      }
    },
    'branch1.serialize() = correct'
  )

  t.end()
})

test('remove- transfer keys', t => {
  const master = create({
    content: {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4
    }
  })

  const branch1 = master.create({
    content: {
      second: 21,
      third: 31
    }
  })

  const branch2 = branch1.create({
    content: {
      fourth: 42
    }
  })

  master.get('content').set(null)

  t.same(
    branch1.get('content').serialize(),
    { second: 21, third: 31 },
    'branch1.content.serialize() = { second: 21, third: 31 }'
  )
  t.same(
    branch2.get('content').serialize(),
    { second: 21, third: 31, fourth: 42 },
    'branch2.content.serialize() = { second: 21, third: 31, fourth: 42 }'
  )

  t.end()
})

test('remove override on remove own', t => {
  const master = create({
    content: {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4
    }
  })

  const branch1 = master.create({
    content: {
      first: null
    }
  })

  const branch2 = branch1.create({
    content: {
      fourth: null
    }
  })

  master.get('content').set(null)

  master.set({
    content: {
      first: 1,
      fourth: 4
    }
  })

  t.same(
    branch1.get('content').serialize(),
    { first: 1, fourth: 4 },
    'branch1.content.serialize() = { first: 1, fourth: 4 }'
  )
  t.same(
    branch2.get('content').serialize(),
    { first: 1, fourth: 4 },
    'branch2.content.serialize() = { first: 1, fourth: 4 }'
  )

  t.end()
})
