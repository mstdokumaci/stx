const test = require('tape')
const { Struct } = require('../dist/index')

test('listeners - on and emit', t => {
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

  master.on('success', (val, stamp, item) =>
    masterFire.push(`${item.get('id').compute()}-${val}`)
  )
  branch1.on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.get('id').compute()}-${val}`)
  )

  master.emit('success', 'value1')

  t.same(
    masterFire, [ 'master-value1' ],
    'masterFire = [ master-value1 ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-value1' ],
    'branch1Fire = [ branch1-value1 ]'
  )

  master.get([ 'first', 'id' ]).on('success', (val, stamp, item) =>
    masterFire.push(`${item.root().get('id').compute()}-${val}`)
  )
  branch1.get([ 'first', 'id' ]).on('success', (val, stamp, item) =>
    branch1Fire.push(`${item.root().get('id').compute()}-${val}`)
  )

  master.get([ 'first', 'id' ]).emit('success', 'value2')

  t.same(
    masterFire, [ 'master-value1', 'master-value2' ],
    'masterFire = [ master-value1, master-value2 ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-value1', 'branch1-value2' ],
    'branch1Fire = [ branch1-value1, branch1-value2 ]'
  )

  t.end()
})
