const test = require('tape')
const { create } = require('../dist/index')

test('data listeners - set', t => {
  const masterFire = []
  const branch1Fire = []

  const master = create({
    id: 'master',
    first: {
      id: 1
    }
  })

  const branch1 = master.create({
    id: 'branch1'
  })

  master.get('first').on('data', (val, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${val}-${item.get('title').compute()}`)
  })

  branch1.get('first').on((val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('title').compute()}`)
  })

  master.set({
    first: {
      title: 'first'
    }
  })

  branch1.get(['first', 'title']).on('data', (val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.compute()}`)
  })

  branch1.set({
    first: {
      title: 'first-override'
    }
  })

  master.set({
    first: {
      id: null
    }
  })

  t.same(
    masterFire,
    [ 'master-add-key-first', 'master-remove-key-first' ],
    'masterFire = [ master-add-key-first, master-remove-key-first ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-add-key-first', 'branch1-set-first-override', 'branch1-remove-key-first-override' ],
    'branch1Fire = [ branch1-add-key-first, branch1-set-first-override, branch1-remove-key-first-override ]'
  )

  t.end()
})

test('data listeners - remove', t => {
  const masterFire = []
  const branch1Fire = []

  const master = create({
    id: 'master',
    first: {
      id: 1
    }
  })

  const branch1 = master.create({
    id: 'branch1'
  })

  master.get('first').on((val, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${val}-${item.get('id').compute()}`)
  })

  branch1.get('first').on('data', (val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('id').compute()}`)
  })

  master.set({
    first: null
  })

  branch1.set({
    first: {
      title: 'first'
    }
  })

  t.same(
    masterFire,
    [ 'master-remove-1' ],
    'masterFire = [ master-remove-1 ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-remove-1' ],
    'branch1Fire = [ branch1-remove-1 ]'
  )

  t.end()
})

test('data listeners - add remove key', t => {
  const master = create({
    id: 'master',
    list: {}
  })
  const branch1 = master.create({ id: 'branch1' })
  const branch2 = branch1.create({ id: 'branch2' })
  const branch3 = branch1.create({ id: 'branch3' })

  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []
  const branch3Fire = []

  const mlist = master.get('list')
  const list1 = branch1.get('list')
  const list2 = branch2.get('list')
  const list3 = branch3.get('list')

  mlist.on('data', (type, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${type}-${item.map(i => i.compute()).join('-')}`)
  })

  list1.on('data', (type, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${type}-${item.map(i => i.compute()).join('-')}`)
  })

  list2.on('data', (type, stamp, item) => {
    branch2Fire.push(`${item.root().get('id').compute()}-${type}-${item.map(i => i.compute()).join('-')}`)
  })

  list3.on('data', (type, stamp, item) => {
    branch3Fire.push(`${item.root().get('id').compute()}-${type}-${item.map(i => i.compute()).join('-')}`)
  })

  mlist.set({
    first: 1,
    second: 2
  })

  list1.set({
    third: 31
  })

  t.same(
    masterFire,
    [ 'master-add-key-1-2' ],
    'masterFire = [ master-add-key-1-2 ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-add-key-1-2', 'branch1-add-key-31-1-2' ],
    'branch1Fire = [ branch1-add-key-1-2, branch1-add-key-31-1-2 ]'
  )
  t.same(
    branch2Fire,
    [ 'branch2-add-key-1-2', 'branch2-add-key-31-1-2' ],
    'branch2Fire = [ branch2-add-key-1-2, branch2-add-key-31-1-2 ]'
  )
  t.same(
    branch3Fire,
    [ 'branch3-add-key-1-2', 'branch3-add-key-31-1-2' ],
    'branch3Fire = [ branch3-add-key-1-2, branch3-add-key-31-1-2 ]'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0
  branch3Fire.length = 0

  mlist.set({
    third: 3
  })

  t.same(
    masterFire,
    [ 'master-add-key-1-2-3' ],
    'masterFire = [ master-add-key-1-2-3 ]'
  )
  t.same(branch1Fire, [], 'branch1Fire = []')
  t.same(branch2Fire, [], 'branch2Fire = []')
  t.same(branch3Fire, [], 'branch3Fire = []')

  list1.set({
    third: null
  })

  list2.set({
    third: 32
  })

  list3.set({
    fourth: 43,
    fifth: 53
  })

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0
  branch3Fire.length = 0

  t.same(masterFire, [], 'masterFire = []')
  t.same(branch1Fire, [], 'branch1Fire = []')
  t.same(branch2Fire, [], 'branch2Fire = []')
  t.same(branch3Fire, [], 'branch3Fire = []')

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0
  branch3Fire.length = 0

  list1.set({
    third: null
  })

  t.same(masterFire, [], 'masterFire = []')
  t.same(
    branch1Fire,
    [ 'branch1-remove-key-1-2' ],
    'branch1Fire = [ branch1-remove-key-1-2 ]'
  )
  t.same(branch2Fire, [], 'branch2Fire = []')
  t.same(
    branch3Fire,
    [ 'branch3-remove-key-43-53-1-2' ],
    'branch3Fire = [ branch3-remove-key-43-53-1-2 ]'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0
  branch3Fire.length = 0

  list1.set({
    fifth: 51
  })

  t.same(masterFire, [], 'masterFire = []')
  t.same(
    branch1Fire,
    [ 'branch1-add-key-51-1-2' ],
    'branch1Fire = [ branch1-add-key-51-1-2 ]'
  )
  t.same(
    branch2Fire,
    [ 'branch2-add-key-32-51-1-2' ],
    'branch2Fire = [ branch2-add-key-32-51-1-2 ]'
  )
  t.same(branch3Fire, [], 'branch3Fire = []')

  t.end()
})

test('data listeners - references', t => {
  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []

  const master = create({
    id: 'master',
    deep: {
      real: 'thing'
    },
    pointers: {
      pointer1: ['@', 'deep', 'real'],
      pointer2: ['@', 'deep']
    }
  })

  const branch1 = master.create({
    id: 'branch1',
    pointers: {
      pointer4: ['@', 'pointers', 'pointer1'],
      pointer5: ['@', 'pointers', 'pointer4'],
      pointer6: ['@', 'pointers', 'pointer2']
    }
  })

  master.get(['pointers', 'pointer1']).on('data', (type, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${type}-${item.compute()}`)
  })

  branch1.get(['pointers', 'pointer5']).on('data', (type, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${type}-${item.compute()}`)
  })

  master.set({
    deep: {
      real: 'updated-thing'
    }
  })

  t.same(
    masterFire,
    [ 'master-set-updated-thing' ],
    'masterFire = [ master-set-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-set-updated-thing' ],
    'branch1Fire = [ branch1-set-updated-thing ]'
  )

  masterFire.length = 0
  branch1Fire.length = 0

  const listener1 = master.get(['pointers', 'pointer2']).on('data', (type, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${type}-${item.get('real').compute()}`)
  })

  const listener2 = branch1.get(['pointers', 'pointer2']).on('data', (type, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${type}-${item.get('real').compute()}`)
  })

  const branch2 = branch1.create({
    id: 'branch2',
    pointers: {
      pointer3: ['@', 'pointers', 'pointer2'],
      pointer7: ['@', 'pointers', 'pointer6']
    }
  })

  branch2.get(['pointers', 'pointer3']).on('data', (val, stamp, item) => {
    branch2Fire.push(`p3-${item.root().get('id').compute()}-${val}-${item.get('real2').compute()}`)
  })

  branch2.get(['pointers', 'pointer4']).on('data', (val, stamp, item) => {
    branch2Fire.push(`p4-${item.root().get('id').compute()}-${val}-${item.compute()}`)
  })

  branch2.get(['pointers', 'pointer7']).on('data', (val, stamp, item) => {
    branch2Fire.push(`p7-${item.root().get('id').compute()}-${val}-${item.get('real2').compute()}`)
  })

  branch1.set({
    deep: {
      real2: 'thing2'
    }
  })

  master.set({
    deep: {
      real3: 'thing3'
    }
  })

  branch2.set({
    deep: {
      real: 'override-thing'
    }
  })

  t.same(
    masterFire,
    [ 'master-add-key-updated-thing' ],
    'masterFire = [ master-add-key-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-add-key-updated-thing', 'branch1-add-key-updated-thing' ],
    'branch1Fire = [ branch1-add-key-updated-thing, branch1-add-key-updated-thing ]'
  )
  t.same(
    branch2Fire,
    [
      'p7-branch2-add-key-thing2',
      'p3-branch2-add-key-thing2',
      'p7-branch2-add-key-thing2',
      'p3-branch2-add-key-thing2',
      'p4-branch2-set-override-thing'
    ],
    'branch2Fire = correct'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0

  listener1.off()
  listener2.off()

  master.set({
    deep: {
      real: null
    }
  })

  branch2.set({
    deep: {
      real: 'updated2-thing'
    }
  })

  t.same(
    masterFire,
    [ 'master-remove-updated-thing' ],
    'masterFire = [ master-remove-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-remove-updated-thing' ],
    'branch1Fire = [ branch1-remove-updated-thing ]'
  )
  t.same(
    branch2Fire,
    [ 'p4-branch2-set-updated2-thing' ],
    'branch2Fire = [ p4-branch2-set-updated2-thing ]'
  )

  t.end()
})

test('data listeners - reference inheritance', t => {
  const branch12Fire = []
  const branch22Fire = []

  const master = create({ id: 'master' })

  const branch11 = master.create({ id: 'branch11' })
  const branch12 = branch11.create({ id: 'branch12' })
  const branch21 = master.create({ id: 'branch21' })
  const branch22 = branch21.create({ id: 'branch22' })

  branch11.set({
    deep: {
      real: 11
    }
  })

  branch12.set({
    pointers: {
      pointer1: [ '@', 'deep' ]
    }
  })

  branch21.set({
    deep: {
      real: 21
    }
  })

  branch22.set({
    pointers: {
      pointer2: [ '@', 'deep' ]
    }
  })

  branch12.get([ 'pointers', 'pointer1' ]).on('data', (type, stamp, item) => {
    const serialize = item.origin().map((i, key) => `${key}-${i.compute()}`).join('-')
    branch12Fire.push(`${item.root().get('id').compute()}-${type}-${serialize}`)
  })

  branch22.get([ 'pointers', 'pointer2' ]).on('data', (type, stamp, item) => {
    const serialize = item.origin().map((i, key) => `${key}-${i.compute()}`).join('-')
    branch22Fire.push(`${item.root().get('id').compute()}-${type}-${serialize}`)
  })

  branch11.get('deep').set({
    real2: 11
  })

  master.set({
    deep: {
      real: 0,
      real3: 0
    },
    pointers: {
      pointer2: [ '@', 'deep' ]
    }
  })

  branch21.get([ 'deep', 'real' ]).set(null)

  branch21.get([ 'deep', 'real' ]).set(null)

  master.get('pointers').set({
    pointer3: [ '@', 'deep', 'real' ],
    pointer4: {}
  })

  branch21.get([ 'pointers', 'pointer4' ]).set(null)

  master.get([ 'pointers', 'pointer4' ]).set([ '@', 'pointers', 'pointer2' ])

  t.same(
    branch12Fire,
    [
      'branch12-add-key-real-11-real2-11',
      'branch12-add-key-real2-11-real-11-real3-0'
    ],
    'branch12Fire = correct'
  )

  t.same(
    branch22Fire,
    [
      'branch22-add-key-real-21-real3-0',
      'branch22-remove-key-real3-0'
    ],
    'branch22Fire = correct'
  )

  t.same(
    branch22.get([ 'pointers', 'pointer2' ]).serialize(),
    [ '@', 'deep' ],
    'branch22.pointers.pointer2.serialize() = [ @, deep ]'
  )

  t.same(
    branch22.get([ 'pointers', 'pointer2' ]).origin().serialize(),
    { real3: 0 },
    'branch22.pointers.pointer2.serialize() = { real3: 0 }'
  )

  t.equals(
    branch22.get([ 'pointers', 'pointer4' ]),
    void 0,
    'branch22.pointers.pointer4 = undefined'
  )

  t.end()
})

test('data listeners - versatile references in branches', t => {
  const master = create({
    id: 'master',
    content: {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4
    },
    pointers: {
      love: [ '@', 'content', 'second' ],
      hate: [ '@', 'content', 'third' ]
    }
  })

  const branch11 = master.create({
    id: 'branch11',
    pointers: {
      love: [ '@', 'content', 'first' ],
      hate: [ '@', 'content', 'second' ]
    }
  })
  const branch12 = branch11.create({
    id: 'branch12',
    pointers: {
      hate: [ '@', 'content', 'third' ]
    }
  })
  const branch21 = master.create({
    id: 'branch21',
    pointers: {
      love: [ '@', 'content', 'fourth' ],
      hate: [ '@', 'content', 'second' ]
    }
  })
  const branch22 = branch21.create({
    id: 'branch22',
    pointers: {
      love: [ '@', 'content', 'second' ],
      hate: [ '@', 'content', 'first' ]
    }
  })

  const masterFire = []
  const branch11Fire = []
  const branch12Fire = []
  const branch21Fire = []
  const branch22Fire = []

  master.get([ 'pointers', 'love' ]).on('data', (type, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-love-${type}-${item.compute()}`)
  })

  master.get([ 'pointers', 'hate' ]).on('data', (type, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-hate-${type}-${item.compute()}`)
  })

  branch11.get([ 'pointers', 'love' ]).on('data', (type, stamp, item) => {
    branch11Fire.push(`${item.root().get('id').compute()}-love-${type}-${item.compute()}`)
  })

  branch11.get([ 'pointers', 'hate' ]).on('data', (type, stamp, item) => {
    branch11Fire.push(`${item.root().get('id').compute()}-hate-${type}-${item.compute()}`)
  })

  branch12.get([ 'pointers', 'love' ]).on('data', (type, stamp, item) => {
    branch12Fire.push(`${item.root().get('id').compute()}-love-${type}-${item.compute()}`)
  })

  branch12.get([ 'pointers', 'hate' ]).on('data', (type, stamp, item) => {
    branch12Fire.push(`${item.root().get('id').compute()}-hate-${type}-${item.compute()}`)
  })

  branch21.get([ 'pointers', 'love' ]).on('data', (type, stamp, item) => {
    branch21Fire.push(`${item.root().get('id').compute()}-love-${type}-${item.compute()}`)
  })

  branch21.get([ 'pointers', 'hate' ]).on('data', (type, stamp, item) => {
    branch21Fire.push(`${item.root().get('id').compute()}-hate-${type}-${item.compute()}`)
  })

  branch22.get([ 'pointers', 'love' ]).on('data', (type, stamp, item) => {
    branch22Fire.push(`${item.root().get('id').compute()}-love-${type}-${item.compute()}`)
  })

  branch22.get([ 'pointers', 'hate' ]).on('data', (type, stamp, item) => {
    branch22Fire.push(`${item.root().get('id').compute()}-hate-${type}-${item.compute()}`)
  })

  master.get('content').set({
    first: '1-1',
    second: '2-1',
    third: '3-1',
    fourth: '4-1'
  })

  t.same(
    masterFire,
    [ 'master-love-set-2-1', 'master-hate-set-3-1' ],
    'masterFire = [ master-love-set-2-1, master-hate-set-3-1 ]'
  )
  t.same(
    branch11Fire,
    [ 'branch11-love-set-1-1', 'branch11-hate-set-2-1' ],
    'branch11Fire = [ branch11-love-set-1-1, branch11-hate-set-2-1 ]'
  )
  t.same(
    branch12Fire,
    [ 'branch12-love-set-1-1', 'branch12-hate-set-3-1' ],
    'branch12Fire = [ branch12-love-set-1-1, branch12-hate-set-3-1 ]'
  )
  t.same(
    branch21Fire,
    [ 'branch21-hate-set-2-1', 'branch21-love-set-4-1' ],
    'branch21Fire = [ branch21-hate-set-2-1, branch21-love-set-4-1 ]'
  )
  t.same(
    branch22Fire,
    [ 'branch22-hate-set-1-1', 'branch22-love-set-2-1' ],
    'branch22Fire = [ branch22-hate-set-1-1, branch22-love-set-2-1 ]'
  )

  masterFire.length = 0
  branch11Fire.length = 0
  branch12Fire.length = 0
  branch21Fire.length = 0
  branch22Fire.length = 0

  master.get(['pointers', 'love']).set([ '@', 'content', 'first' ])
  master.get(['pointers', 'hate']).set([ '@', 'content', 'second' ])
  branch11.get(['pointers', 'love']).set([ '@', 'content', 'third' ])
  branch12.get(['pointers', 'love']).set([ '@', 'content', 'fourth' ])
  branch21.get(['pointers', 'hate']).set([ '@', 'content', 'third' ])
  branch22.get(['pointers', 'hate']).set([ '@', 'content', 'third' ])

  t.same(
    masterFire,
    [ 'master-love-set-1-1', 'master-hate-set-2-1' ],
    'masterFire = [ master-love-set-1-1, master-hate-set-2-1 ]'
  )
  t.same(
    branch11Fire,
    [ 'branch11-love-set-3-1' ],
    'branch11Fire = [ branch11-love-set-3-1 ]'
  )
  t.same(
    branch12Fire,
    [ 'branch12-love-set-3-1', 'branch12-love-set-4-1' ],
    'branch12Fire = [ branch12-love-set-3-1, branch12-love-set-4-1 ]'
  )
  t.same(
    branch21Fire,
    [ 'branch21-hate-set-3-1' ],
    'branch21Fire = [ branch21-hate-set-3-1 ]'
  )
  t.same(
    branch22Fire,
    [ 'branch22-hate-set-3-1' ],
    'branch22Fire = [ branch22-hate-set-1-1 ]'
  )

  masterFire.length = 0
  branch11Fire.length = 0
  branch12Fire.length = 0
  branch21Fire.length = 0
  branch22Fire.length = 0

  branch11.get('content').set({
    fourth: 411,
    third: null
  })

  branch21.get('content').set({
    first: null,
    second: 221
  })

  t.same(
    masterFire,
    [],
    'masterFire = []'
  )
  t.same(
    branch11Fire,
    [ 'branch11-love-remove-3-1' ],
    'branch11Fire = [ branch11-love-remove-3-1 ]'
  )
  t.same(
    branch12Fire,
    [ 'branch12-hate-remove-3-1', 'branch12-love-set-411' ],
    'branch12Fire = [ branch12-hate-remove-3-1, branch12-love-set-411 ]'
  )
  t.same(
    branch21Fire,
    [],
    'branch21Fire = []'
  )
  t.same(
    branch22Fire,
    [ 'branch22-love-set-221' ],
    'branch22Fire = [ branch22-love-set-221 ]'
  )

  t.end()
})

test('data listeners - allData', t => {
  const master = create({
    id: 'master',
    content: {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4
    },
    pointers: {
      love: [ '@', 'content', 'second' ],
      hate: [ '@', 'content', 'third' ]
    }
  })

  const branch1 = master.create({
    id: 'branch1',
    pointers: {
      love: [ '@', 'content', 'first' ],
      hate: [ '@', 'content', 'second' ]
    }
  })
  const branch2 = master.create({
    id: 'branch2',
    pointers: {
      hate: [ '@', 'content', 'first' ]
    }
  })

  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []

  master.on('allData', (type, stamp, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    masterFire.push(`${path}-${type}-${item.compute()}`)
  })

  const listener1 = branch1.on('allData', (type, stamp, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    branch1Fire.push(`${path}-${type}-${item.compute()}`)
  })

  branch2.on('allData', (type, stamp, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    branch2Fire.push(`${path}-${type}-${item.compute()}`)
  })

  const listener2 = branch2.on('allData', () => {})
  listener2.off()

  master.get('content').set({
    first: '1-u',
    second: '2-u',
    third: '3-u',
    fourth: '4-u'
  })

  t.same(
    masterFire,
    [
      'master-content-first-set-1-u',
      'master-content-second-set-2-u',
      'master-pointers-love-set-2-u',
      'master-content-third-set-3-u',
      'master-pointers-hate-set-3-u',
      'master-content-fourth-set-4-u'
    ],
    'masterFire = correct'
  )

  t.same(
    branch1Fire,
    [
      'branch1-content-first-set-1-u',
      'branch1-pointers-love-set-1-u',
      'branch1-content-second-set-2-u',
      'branch1-pointers-hate-set-2-u',
      'branch1-content-third-set-3-u',
      'branch1-content-fourth-set-4-u'
    ],
    'branch1Fire = correct'
  )

  t.same(
    branch2Fire,
    [
      'branch2-content-first-set-1-u',
      'branch2-pointers-hate-set-1-u',
      'branch2-content-second-set-2-u',
      'branch2-pointers-love-set-2-u',
      'branch2-content-third-set-3-u',
      'branch2-content-fourth-set-4-u'
    ],
    'branch2Fire = correct'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0

  master.get(['pointers', 'love']).set([ '@', 'content', 'first' ])
  master.get(['pointers', 'hate']).set([ '@', 'content', 'second' ])
  branch1.get(['pointers', 'love']).set([ '@', 'content', 'third' ])
  branch2.get(['pointers', 'love']).set([ '@', 'content', 'fourth' ])

  t.same(
    masterFire,
    [ 'master-pointers-love-set-1-u', 'master-pointers-hate-set-2-u' ],
    'masterFire = [ master-pointers-love-set-1-u, master-pointers-hate-set-2-u ]'
  )

  t.same(
    branch1Fire,
    [ 'branch1-pointers-love-set-3-u' ],
    'branch1Fire = [ branch1-pointers-love-set-3-u ]'
  )

  t.same(
    branch2Fire,
    [ 'branch2-pointers-love-set-1-u', 'branch2-pointers-love-set-4-u' ],
    'branch2Fire = [ branch2-pointers-love-set-1-u, branch2-pointers-love-set-4-u ]'
  )

  masterFire.length = 0
  branch1Fire.length = 0
  branch2Fire.length = 0
  listener1.off()

  master.get(['pointers', 'hate']).set([ '@', 'content', 'fourth' ])

  t.same(
    masterFire,
    [ 'master-pointers-hate-set-4-u' ],
    'masterFire = [ master-pointers-hate-set-4-u ]'
  )

  t.same(
    branch1Fire,
    [],
    'branch1Fire = []'
  )

  t.same(
    branch2Fire,
    [],
    'branch2Fire = []'
  )

  t.end()
})
