const test = require('tape')
const { create } = require('../../dist/index')

test('subscriptions - options', t => {
  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []

  const master = create({
    id: 'master',
    first: {
      second: {
        third: {
          fourth: 'thing'
        }
      }
    }
  })

  const pushPath = (list, item) => {
    list.push([ item.root().get('id').compute() ].concat(item.path()).join('-'))
  }

  master.get('first').subscribe(
    { depth: 2, keys: [ 'second' ] },
    item => pushPath(masterFire, item)
  )

  const branch1 = master.create({ id: 'branch1' })
  const branch2 = master.create({ id: 'branch2' })

  branch1.get('first').subscribe(
    { depth: 3, excludeKeys: [ 'second2' ] },
    item => pushPath(branch1Fire, item)
  )

  branch2.get('first').subscribe(
    { depth: 4, keys: [ 'second', 'second2' ], excludeKeys: [ 'second2' ] },
    item => pushPath(branch2Fire, item)
  )

  t.same(
    masterFire,
    [ 'master-first' ],
    'master.first fired for initial'
  )
  t.same(
    branch1Fire,
    [ 'branch1-first' ],
    'branch1.first fired for initial'
  )
  t.same(
    branch2Fire,
    [ 'branch2-first' ],
    'branch2.first fired for initial'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0

  master.get([ 'first', 'second', 'third', 'fourth' ]).set('updated')

  t.same(
    masterFire,
    [],
    'master.first did not fire for depth:3'
  )
  t.same(
    branch1Fire,
    [ 'branch1-first' ],
    'branch1.first fired for depth:3'
  )
  t.same(
    branch2Fire,
    [ 'branch2-first' ],
    'branch2.first fired for depth:3'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0

  master.set({
    first: {
      second2: 'thing'
    }
  })

  t.same(
    masterFire,
    [],
    'master.first did not fire for second2'
  )
  t.same(
    branch1Fire,
    [],
    'branch1.first did not fire for second2'
  )
  t.same(
    branch2Fire,
    [],
    'branch2.first did not fire for second2'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0

  master.set({
    first: {
      second3: 'thing'
    }
  })

  t.same(
    masterFire,
    [],
    'master.first did not fire for second3'
  )
  t.same(
    branch1Fire,
    [ 'branch1-first' ],
    'branch1.first fired for second3'
  )
  t.same(
    branch2Fire,
    [],
    'branch2.first did not fire for second3'
  )

  t.end()
})
