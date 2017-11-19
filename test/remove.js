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

test('remove override', t => {
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
