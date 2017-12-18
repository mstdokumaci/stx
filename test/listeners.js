const test = require('tape')
const { Struct } = require('../dist/index')

test('listeners - on and emit', t => {
  const masterFire = []
  const branch1Fire = []

  const master = new Struct({
    id: 'master',
    first: {
      id: 1
    },
    second: {
      id: 2
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

  master.emit('success', 'COMPLETE')

  t.same(
    masterFire, [ 'master-COMPLETE' ],
    'masterFire = [ master-COMPLETE ]'
  )
  t.same(
    branch1Fire,
    [ 'branch1-COMPLETE' ],
    'branch1Fire = [ branch1-COMPLETE ]'
  )

  t.end()
})
