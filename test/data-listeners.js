const test = require('tape')
const { Struct } = require('../dist/index')

test('listeners - set', t => {
  const masterFire = []
  const branch1Fire = []

  const master = new Struct({
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
    [ 'master-set-first', 'master-set-first' ],
    'masterFire = [ master-set-first, master-set-first ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-set-first', 'branch1-set-first-override' ],
    'branch1Fire = [ branch1-set-first, branch1-set-first-override ]'
  )

  t.end()
})

test('listeners - remove', t => {
  const masterFire = []
  const branch1Fire = []

  const master = new Struct({
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

test('listeners - references', t => {
  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []

  const master = new Struct({
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
  })

  branch1.get(['pointers', 'pointer2']).on('data', (val, stamp, item) => {
    branch1Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('real').compute()}`)
  })

  const branch2 = branch1.create({
    id: 'branch2',
    pointers: {
      pointer3: ['@', 'pointers', 'pointer2']
    }
  })

  branch2.get(['pointers', 'pointer3']).on('data', (val, stamp, item) => {
    branch2Fire.push(`${item.root().get('id').compute()}-${val}-${item.get('real2').compute()}`)
  })

  branch1.set({
    deep: {
      real2: 'thing2'
    }
  })

  branch2.set({
    deep: {
      real: 'override2-thing'
    }
  })

  t.same(
    masterFire,
    [ 'master-set-updated-thing' ],
    'masterFire = [ master-set-updated-thing ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-set-updated-thing', 'branch1-set-updated-thing' ],
    'branch1Fire = [ branch1-set-updated-thing, branch1-set-updated-thing ]'
  )
  t.same(
    branch2Fire,
    [ 'branch2-set-thing2', 'branch2-set-thing2' ],
    'branch2Fire = [ branch2-set-thing2, branch2-set-thing2 ]'
  )

  t.end()
})
