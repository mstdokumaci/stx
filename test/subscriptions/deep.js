const test = require('tape')
const { create } = require('../../dist/index')

test('subscriptions - deep fields', t => {
  const masterFire = []
  const branchFire = []

  const master = create({
    id: 'master',
    deep: {
      real: {
        deeper: 'thing'
      }
    }
  })

  const l0 = (list, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    list.push(`${path}-${item.get([ 'deep', 'real', 'deeper' ]).compute()}`)
  }

  const l1 = (list, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    list.push(`${path}-${item.get([ 'real', 'deeper' ]).compute()}`)
  }

  const l2 = (list, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    list.push(`${path}-${item.get('deeper').compute()}`)
  }

  const l3 = (list, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    list.push(`${path}-${item.compute()}`)
  }

  master.subscribe(item => l0(masterFire, item))
  master.get('deep').subscribe(item => l1(masterFire, item))
  master.get([ 'deep', 'real' ]).subscribe(item => l2(masterFire, item))
  master.get([ 'deep', 'real' ]).subscribe(item => l2(masterFire, item))
  master.get([ 'deep', 'real', 'deeper' ]).subscribe(item => l3(masterFire, item))

  const branch = master.create({ id: 'branch' })

  branch.subscribe(item => l0(branchFire, item))
  branch.get('deep').subscribe(item => l1(branchFire, item))
  branch.get([ 'deep', 'real' ]).subscribe(item => l2(branchFire, item))
  branch.get([ 'deep', 'real', 'deeper' ]).subscribe(item => l3(branchFire, item))

  branch.set({
    deep: {
      real: {
        deeper: 'override'
      }
    }
  })

  t.same(
    masterFire,
    [
      'master-thing',
      'master-deep-thing',
      'master-deep-real-thing',
      'master-deep-real-thing',
      'master-deep-real-deeper-thing'
    ],
    'masterFire = correct'
  )
  t.same(
    branchFire,
    [
      'branch-thing',
      'branch-deep-thing',
      'branch-deep-real-thing',
      'branch-deep-real-deeper-thing',
      'branch-deep-real-deeper-override',
      'branch-deep-real-override',
      'branch-deep-override',
      'branch-override'
    ],
    'branchFire = correct'
  )

  masterFire.length = 0
  branchFire.length = 0

  branch.switchBranch('random')

  branch.set({
    deep: {
      real: {
        deeper2: 'thing2'
      }
    }
  })

  branch.set({
    deep: {
      val: 'thing3'
    },
    deep2: 'thing4'
  })

  t.same(
    masterFire,
    [],
    'masterFire = []'
  )
  t.same(
    branchFire,
    [
      'branch-deep-real-override',
      'branch-deep-override',
      'branch-override',
      'branch-deep-override',
      'branch-override'
    ],
    'branchFire = correct'
  )

  t.end()
})
