const test = require('tape')
const { create } = require('../dist/index')

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

test('subscriptions - deep field references', t => {
  const masterFire = []
  const branchFire = []

  const master = create({
    id: 'master',
    deep: {
      real: {
        deeper: {
          pointer1: ['@', 'otherDeep']
        }
      }
    },
    pointers: {
      pointer2: ['@', 'deep', 'real'],
      pointer3: ['@', 'pointers', 'pointer2']
    },
    otherDeep: {
      deeper: {
        field: 'thing'
      }
    }
  })

  const fire = (list, item) => {
    const path = [ item.root().get('id').compute() ].concat(item.path()).join('-')
    list.push(
      `${path}-${item.get([ 'deeper', 'pointer1', 'deeper', 'field' ]).compute()}`
    )
  }

  master.get([ 'pointers', 'pointer2' ]).subscribe(item => fire(masterFire, item), 's1')
  master.get([ 'pointers', 'pointer3' ]).subscribe(item => fire(masterFire, item))

  const branch = master.create({ id: 'branch' })

  branch.get([ 'pointers', 'pointer2' ]).subscribe(item => fire(branchFire, item))
  branch.get([ 'pointers', 'pointer3' ]).subscribe(item => fire(branchFire, item), 's1')

  branch.set({
    otherDeep: {
      deeper: {
        field: 'override'
      }
    }
  })

  t.same(
    masterFire,
    [
      'master-pointers-pointer2-thing',
      'master-pointers-pointer3-thing'
    ],
    'masterFire = correct'
  )
  t.same(
    branchFire,
    [
      'branch-pointers-pointer2-thing',
      'branch-pointers-pointer3-thing',
      'branch-pointers-pointer2-override',
      'branch-pointers-pointer3-override'
    ],
    'branchFire = correct'
  )

  masterFire.length = 0
  branchFire.length = 0

  master.set({
    otherDeep: {
      deeper: {
        field2: 'thing2'
      }
    }
  })

  t.same(
    masterFire,
    [
      'master-pointers-pointer2-thing',
      'master-pointers-pointer3-thing'
    ],
    'masterFire = correct'
  )
  t.same(
    branchFire,
    [
      'branch-pointers-pointer2-override',
      'branch-pointers-pointer3-override'
    ],
    'branchFire = correct'
  )

  masterFire.length = 0
  branchFire.length = 0

  master.get([ 'pointers', 'pointer2' ]).unsubscribe('s1')
  branch.get([ 'pointers', 'pointer3' ]).unsubscribe('s1')

  master.set({
    otherDeep: {
      deeper: {
        field: 'update'
      }
    }
  })

  t.same(
    masterFire,
    [ 'master-pointers-pointer3-update' ],
    'masterFire = [ master-pointers-pointer3-update ]'
  )
  t.same(
    branchFire,
    [],
    'branchFire = []'
  )

  masterFire.length = 0
  branchFire.length = 0

  master.set({
    otherDeep: {
      deeper: {
        field3: 'thing3'
      }
    }
  })

  t.same(
    masterFire,
    [ 'master-pointers-pointer3-update' ],
    'masterFire = [ master-pointers-pointer3-update ]'
  )
  t.same(
    branchFire,
    [ 'branch-pointers-pointer2-override' ],
    'branchFire = [ branch-pointers-pointer2-override ]'
  )

  t.end()
})
