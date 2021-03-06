const test = require('tape')
const { create, createStamp } = require('../dist')

test('listeners - on and emit', t => {
  const masterFire = []
  const branch1Fire = []

  const master = create({
    id: 'master',
    first: {
      id: 1
    },
    pointer1: {},
    pointer2: ['@', 'pointer1']
  })

  const branch1 = master.create()

  branch1.set({
    id: 'branch1',
    pointer1: ['@', 'first', 'id']
  })

  master.on('success', (val, stamp, item) =>
    masterFire.push(`${item.get('id').compute()}-${val}`)
  )
  branch1.on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.get('id').compute()}-${val}`)
  )

  master.emit('success', 'value1')
  branch1.emit('success', 'value2')

  t.same(
    masterFire,
    ['master-value1'],
    'masterFire = [ master-value1 ]'
  )
  t.same(
    branch1Fire,
    ['branch1-value1', 'branch1-value2'],
    'branch1Fire = [ branch1-value1, branch1-value2 ]'
  )

  master.get(['first', 'id']).on('success', (val, stamp, item) =>
    masterFire.push(`${item.root().get('id').compute()}-${val}`)
  )
  branch1.get(['first', 'id']).on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.root().get('id').compute()}-${val}`)
  )
  branch1.get(['pointer2']).on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.root().get('id').compute()}-${val}`)
  )

  master.get(['first', 'id']).emit('success', 'value3')
  branch1.get(['first', 'id']).emit('success', 'value4')

  t.same(
    masterFire,
    ['master-value1', 'master-value3'],
    'masterFire = [ master-value1, master-value3 ]'
  )
  t.same(
    branch1Fire,
    [
      'branch1-value1',
      'branch1-value2',
      'branch1-value3',
      'branch1-value3',
      'branch1-value4',
      'branch1-value4'
    ],
    'branch1Fire = correct'
  )

  t.end()
})

test('listeners - off', t => {
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

  const listener1 = master.on('success', (val, stamp, item) =>
    masterFire.push(`success-${item.get('id').compute()}-${val}`)
  )
  master.on('fail', (val, stamp, item) =>
    masterFire.push(`fail-${item.get('id').compute()}-${val}`)
  )
  branch1.on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.get('id').compute()}-${val}`)
  )

  listener1.off()
  master.emit('success', 'value1')
  master.emit('fail', 'value1')
  branch1.emit('success', 'value2')

  t.same(
    masterFire,
    ['fail-master-value1'],
    'masterFire = [ fail-master-value1 ]'
  )
  t.same(
    branch1Fire,
    ['branch1-value1', 'branch1-value2'],
    'branch1Fire = [ branch1-value1, branch1-value2 ]'
  )

  master.get(['first', 'id']).on('success', (val, stamp, item) =>
    masterFire.push(`${item.root().get('id').compute()}-${val}`)
  )
  const listener2 = branch1.get(['first', 'id']).on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.root().get('id').compute()}-${val}`)
  )

  listener2.off()
  master.get(['first', 'id']).emit('success', 'value3')
  branch1.get(['first', 'id']).emit('success', 'value4')

  t.same(
    masterFire,
    ['fail-master-value1', 'master-value3'],
    'masterFire = [ fail-master-value1, master-value3 ]'
  )
  t.same(
    branch1Fire,
    ['branch1-value1', 'branch1-value2'],
    'branch1Fire = [ branch1-value1, branch1-value2 ]'
  )

  t.end()
})

test('listeners - remove', t => {
  const masterFire = []
  const branch1Fire = []
  const branch2Fire = []

  const master = create({
    id: 'master',
    first: {
      id: 1
    }
  })

  const branch1 = master.create({
    id: 'branch1'
  })

  const branch2 = branch1.create({
    id: 'branch2'
  })

  master.get(['first', 'id']).on('success', (val, stamp, item) =>
    masterFire.push(`${item.root().get('id').compute()}-${val}`)
  )
  master.get(['first', 'id']).on('success', (val, stamp, item) =>
    masterFire.push(`${item.root().get('id').compute()}-${val}`)
  )
  branch1.get(['first', 'id']).on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.root().get('id').compute()}-${val}`)
  )
  branch2.get(['first', 'id']).on('success', (val, stamp, item) =>
    branch2Fire.push(`${item.root().get('id').compute()}-${val}`)
  )

  master.get(['first', 'id']).emit('success', 'value1')
  branch1.get(['first', 'id']).emit('success', 'value2')
  branch2.get(['first', 'id']).emit('success', 'value3')

  branch1.get('first').set(null)

  const stamp = createStamp()
  master.get(['first', 'id']).emit('success', 'value4', stamp)

  t.same(
    masterFire,
    ['master-value1', 'master-value1', 'master-value4', 'master-value4'],
    'masterFire = correct'
  )
  t.same(
    branch1Fire,
    ['branch1-value1', 'branch1-value2'],
    'branch1Fire = [ branch1-value1, branch1-value2 ]'
  )
  t.same(
    branch2Fire,
    ['branch2-value1', 'branch2-value2', 'branch2-value3'],
    'branch2Fire = [ branch1-value1, branch1-value2, branch1-value3 ]'
  )

  t.end()
})
