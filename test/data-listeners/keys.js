const test = require('tape')
const { create } = require('../../dist')

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
