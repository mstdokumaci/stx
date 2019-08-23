const test = require('tape')
const { create } = require('../../dist')

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
    ['master-add-key-first', 'master-remove-key-first'],
    'masterFire = [ master-add-key-first, master-remove-key-first ]'
  )
  t.same(
    branch1Fire,
    ['branch1-add-key-first', 'branch1-set-first-override', 'branch1-remove-key-first-override'],
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
    ['master-remove-1'],
    'masterFire = [ master-remove-1 ]'
  )
  t.same(
    branch1Fire,
    ['branch1-remove-1'],
    'branch1Fire = [ branch1-remove-1 ]'
  )

  t.end()
})
