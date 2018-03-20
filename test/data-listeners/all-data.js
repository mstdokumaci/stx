const test = require('tape')
const { create } = require('../../dist/index')

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
