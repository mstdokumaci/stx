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

  global.debug = true
  master.set({
    deep: {
      real: 'updated-thing'
    }
  })
  global.debug = false

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

  t.end()
})
