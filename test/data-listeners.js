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

  branch1.get('first').on('data', (val, stamp, item) => {
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

  master.get('first').on('data', (val, stamp, item) => {
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

  mlist.set({
    third: 3
  })

  t.same(
    masterFire,
    [ 'master-add-key-1-2', 'master-add-key-1-2-3' ],
    'masterFire = [ master-add-key-1-2, master-add-key-1-2-3 ]'
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

  t.same(
    masterFire,
    [ 'master-add-key-1-2', 'master-add-key-1-2-3' ],
    'masterFire = [ master-add-key-1-2, master-add-key-1-2-3 ]'
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
    [
      'branch3-add-key-1-2',
      'branch3-add-key-31-1-2',
      'branch3-add-key-43-53-1-2-3'
    ],
    'branch3Fire = correct'
  )

  list1.set({
    third: null
  })

  t.same(
    masterFire,
    [ 'master-add-key-1-2', 'master-add-key-1-2-3' ],
    'masterFire = [ master-add-key-1-2, master-add-key-1-2-3 ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-add-key-1-2', 'branch1-add-key-31-1-2', 'branch1-remove-key-1-2-3' ],
    'branch1Fire = [ branch1-add-key-1-2, branch1-add-key-31-1-2, branch1-remove-key-1-2-3 ]'
  )
  t.same(
    branch2Fire,
    [ 'branch2-add-key-1-2', 'branch2-add-key-31-1-2' ],
    'branch2Fire = [ branch2-add-key-1-2, branch2-add-key-31-1-2 ]'
  )
  t.same(
    branch3Fire,
    [
      'branch3-add-key-1-2',
      'branch3-add-key-31-1-2',
      'branch3-add-key-43-53-1-2-3',
      'branch3-remove-key-43-53-1-2-3'
    ],
    'branch3Fire = correct'
  )

  list1.set({
    fifth: 51
  })

  t.same(
    masterFire,
    [ 'master-add-key-1-2', 'master-add-key-1-2-3' ],
    'masterFire = [ master-add-key-1-2, master-add-key-1-2-3 ]'
  )
  t.same(
    branch1Fire,
    [
      'branch1-add-key-1-2',
      'branch1-add-key-31-1-2',
      'branch1-remove-key-1-2-3',
      'branch1-add-key-51-1-2'
    ],
    'branch1Fire = correct'
  )
  t.same(
    branch2Fire,
    [
      'branch2-add-key-1-2',
      'branch2-add-key-31-1-2',
      'branch2-add-key-51-1-2-32'
    ],
    'branch2Fire = correct'
  )
  t.same(
    branch3Fire,
    [
      'branch3-add-key-1-2',
      'branch3-add-key-31-1-2',
      'branch3-add-key-43-53-1-2-3',
      'branch3-remove-key-43-53-1-2-3'
    ],
    'branch3Fire = correct'
  )

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
    id: 'branch1'
  })

  master.get(['pointers', 'pointer1']).on('data', (val, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${val}-${item.compute()}`)
  })

  branch1.get(['pointers', 'pointer1']).on('data', (val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.compute()}`)
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

  master.get(['pointers', 'pointer2']).on('data', (val, stamp, item) => {
    masterFire.push(`${item.root().get('id').compute()}-${val}-${item.get('real').compute()}`)
  }, 'listener1')

  branch1.get(['pointers', 'pointer2']).on('data', (val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('real').compute()}`)
  }, 'listener1')

  const branch2 = branch1.create({
    id: 'branch2',
    pointers: {
      pointer3: ['@', 'pointers', 'pointer2'],
      pointer4: ['@', 'pointers', 'pointer1']
    }
  })

  branch2.get(['pointers', 'pointer3']).on('data', (val, stamp, item) => {
    branch2Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('real2').compute()}`)
  })

  branch2.get(['pointers', 'pointer4']).on('data', (val, stamp, item) => {
    branch2Fire.push(`${item.root().get('id').compute()}-${val}-${item.compute()}`)
  })

  branch1.set({
    deep: {
      real2: 'thing2'
    }
  })

  branch2.set({
    deep: {
      real: 'override-thing'
    }
  })

  t.same(
    masterFire,
    [ 'master-set-updated-thing' ],
    'masterFire = [ master-set-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-set-updated-thing', 'branch1-add-key-updated-thing' ],
    'branch1Fire = [ branch1-set-updated-thing, branch1-add-key-updated-thing ]'
  )
  t.same(
    branch2Fire,
    [ 'branch2-add-key-thing2', 'branch2-set-override-thing' ],
    'branch2Fire = [ branch2-add-key-thing2, branch2-set-override-thing ]'
  )

  master.get(['pointers', 'pointer2']).off('data', 'listener1')
  branch1.get(['pointers', 'pointer2']).off('data', 'listener1')

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
    [ 'master-set-updated-thing', 'master-remove-updated-thing' ],
    'masterFire = [ master-set-updated-thing, master-remove-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [
      'branch1-set-updated-thing',
      'branch1-add-key-updated-thing',
      'branch1-remove-updated-thing'
    ],
    'branch1Fire = correct'
  )
  t.same(
    branch2Fire,
    [
      'branch2-add-key-thing2',
      'branch2-set-override-thing',
      'branch2-set-updated2-thing'
    ],
    'branch2Fire = correct'
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
      'branch22-remove-key-real-0-real3-0'
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
    id: 'branch12',
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

  console.log(masterFire)
  console.log(branch11Fire)
  console.log(branch12Fire)
  console.log(branch21Fire)
  console.log(branch22Fire)

  t.end()
})
