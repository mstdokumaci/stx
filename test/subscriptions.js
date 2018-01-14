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
  branch.get([ 'pointers', 'pointer3' ]).unsubscribe()

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

test('subscriptions - circular references', t => {
  const branch1Fire = []
  const branch2Fire = []
  const branch21Fire = []
  const branch22Fire = []

  const master = create({
    id: 'master',
    list: {
      i1: {
        id: 'i1',
        items: {
          sub1: ['@', 'list', 'i1'],
          sub2: ['@', 'list', 'i2'],
          sub3: ['@', 'list', 'i3']
        }
      },
      i2: {
        id: 'i2',
        items: {
          sub2: ['@', 'list', 'i2'],
          sub4: ['@', 'list', 'i4']
        },
        other: 'master'
      },
      i3: {
        id: 'i3',
        items: {
          sub2: ['@', 'list', 'i2'],
          sub4: ['@', 'list', 'i4']
        }
      },
      i4: {
        id: 'i4',
        f1: 'v1'
      }
    },
    ref: {}
  })

  master.get('ref').subscribe(item => {
    if (item.get('id') === void 0) {
      t.pass('master initial fire')
    } else {
      t.fail('master should not fire for branch')
    }
  })

  const branch1 = master.create()
  const branch2 = master.create()
  const branch21 = branch2.create()
  const branch22 = branch2.create()

  branch1.get('ref').subscribe(item => {
    if (item.get('id') === void 0) {
      branch1Fire.push('branch1.initial')
      t.pass('branch1 initial fire')
    } else if (item.get('id').compute() === 'i1') {
      const val1 = item.get([ 'items', 'sub1', 'bf1' ]).compute()
      branch1Fire.push(`branch1.i1.items.sub1.bf1=${val1}`)
      const val2 = item.get([ 'items', 'sub2', 'bf2' ]).compute()
      branch1Fire.push(`branch1.i1.items.sub2.bf2=${val2}`)
    } else if (item.get('id').compute() === 'i3') {
      const val1 = item.get([ 'items', 'sub2', 'bf2' ]).compute()
      branch1Fire.push(`branch1.i3.items.sub2.bf2=${val1}`)
      const val2 = item.get([ 'items', 'sub4', 'sub', 'bf4' ]).compute()
      branch1Fire.push(`branch1.i3.items.sub4.sub.bf4=${val2}`)
    } else {
      t.fail('branch1 should not fire more')
    }
  })

  branch2.get('ref').subscribe(item => {
    if (item.get('id') === void 0) {
      branch2Fire.push('branch2.initial')
    } else if (item.get('id').compute() === 'i2') {
      const val = item.get([ 'items', 'sub3', 'bf3' ]).compute()
      branch2Fire.push(`branch2.i2.items.sub3.bf3=${val}`)
    } else if (item.get('id').compute() === 'i3') {
      const val = item.get([ 'items', 'sub2', 'items', 'sub3', 'bf3' ]).compute()
      branch2Fire.push(`branch2.i3.items.sub2.items.sub3.bf3=${val}`)
    } else {
      t.fail('branch2 should not fire more')
    }
  })

  branch21.get('ref').subscribe(item => {
    if (item.get('id') === void 0) {
      branch21Fire.push('branch21.initial')
    } else if (item.get('id').compute() === 'i2') {
      const val = item.get([ 'items', 'sub4', 'f1' ]).compute()
      branch21Fire.push(`branch21.i2.items.sub4.f1=${val}`)
    } else if (item.get('id').compute() === 'i3') {
      const val = item.get([ 'items', 'sub4', 'f1' ]).compute()
      branch21Fire.push(`branch21.i3.items.sub4.f1=${val}`)
    } else {
      t.fail('branch21 should not fire more')
    }
  })

  branch22.get('ref').subscribe(item => {
    if (item.get('id') === void 0) {
      branch22Fire.push('branch22.initial')
    } else if (item.get('id').compute() === 'i2') {
      const val = item.get([ 'items', 'sub3', 'bf3' ]).compute()
      branch22Fire.push(`branch22.i2.items.sub3.bf3=${val}`)
    } else if (item.get('id').compute() === 'i1') {
      const val = item.get([ 'items', 'sub2', 'items', 'sub3', 'bf3' ]).compute()
      branch22Fire.push(`branch22.i1.items.sub2.items.sub3.bf3=${val}`)
    } else {
      t.fail('branch22 should not fire more')
    }
  })

  branch1.set({
    id: 'branch1',
    list: {
      i1: { items: { sub1: { bf1: false } }, bf1: false },
      i2: { bf2: false },
      i4: { sub: { bf4: true } }
    },
    ref: ['@', 'list', 'i1']
  })

  branch2.set({
    id: 'branch2',
    list: {
      i2: { items: { sub3: ['@', 'list', 'i3'] } },
      i3: { items: { sub2: { bf3: false } }, bf3: false },
      i4: { f1: true }
    },
    ref: ['@', 'list', 'i2']
  })

  t.same(
    branch1Fire,
    [
      'branch1.initial',
      'branch1.i1.items.sub1.bf1=false',
      'branch1.i1.items.sub2.bf2=false'
    ],
    'branch1Fire = correct'
  )
  t.same(
    branch2Fire,
    [
      'branch2.initial',
      'branch2.i2.items.sub3.bf3=false'
    ],
    'branch2Fire = correct'
  )
  t.same(
    branch21Fire,
    [
      'branch21.initial',
      'branch21.i2.items.sub4.f1=true'
    ],
    'branch21Fire = correct'
  )
  t.same(
    branch22Fire,
    [
      'branch22.initial',
      'branch22.i2.items.sub3.bf3=false'
    ],
    'branch22Fire = correct'
  )

  branch1Fire.length = 0
  branch2Fire.length = 0
  branch21Fire.length = 0
  branch22Fire.length = 0

  branch21.set({
    ref: [ '@', 'list', 'i3' ]
  })

  branch22.set({
    ref: [ '@', 'list', 'i1' ]
  })

  branch1.set({
    ref: ['@', 'list', 'i3']
  })

  branch2.set({
    ref: ['@', 'list', 'i3']
  })

  t.same(
    branch1Fire,
    [
      'branch1.i3.items.sub2.bf2=false',
      'branch1.i3.items.sub4.sub.bf4=true'
    ],
    'branch1Fire = correct'
  )
  t.same(
    branch2Fire,
    [ 'branch2.i3.items.sub2.items.sub3.bf3=false' ],
    'branch2Fire = [ branch2.i3.items.sub2.items.sub3.bf3=false ]'
  )
  t.same(
    branch21Fire,
    [ 'branch21.i3.items.sub4.f1=true' ],
    'branch21Fire = [ branch21.i3.items.sub4.f1=true ]'
  )
  t.same(
    branch22Fire,
    [ 'branch22.i1.items.sub2.items.sub3.bf3=false' ],
    'branch22Fire = [ branch22.i1.items.sub2.items.sub3.bf3=false ]'
  )

  t.end()
})
