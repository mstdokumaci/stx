const test = require('tape')
const { create, createStamp } = require('../../dist')

test('interference', t => {
  const stamp = createStamp()
  const master = create({
    deep: {
      real: 'thing'
    }
  }, stamp)

  const branch1 = master.create()
  const branch2 = branch1.create()

  const b1Real = branch1.get(['deep', 'real'])
  const b2Deep = branch2.get(['deep', 'real']).parent()

  b1Real.set('override1')
  b2Deep.set({ real: 'override2' })

  t.equals(
    master.get(['deep', 'real']).compute(),
    'thing',
    'master.deep.real = thing'
  )
  t.equals(
    branch1.get(['deep', 'real']).compute(),
    'override1',
    'branch1.deep.real = override1'
  )
  t.equals(
    branch2.get(['deep', 'real']).compute(),
    'override2',
    'branch2.deep.real = override2'
  )

  t.end()
})

test('root operations', t => {
  const master = create({
    real: 'thing'
  })

  t.equals(
    master.parent(),
    undefined,
    'root does not have parent'
  )

  master.set(null)

  t.same(
    master.inspect(),
    'stx { }',
    'remove on root works'
  )

  t.same(
    master.serialize(),
    {},
    'remove on root works'
  )

  t.end()
})

test('create from leaf', t => {
  const master = create({
    deep: {
      real: 'thing'
    }
  })

  try {
    const branch1 = master.get(['deep', 'real']).create()
    branch1.set('override')
  } catch (error) {
    t.equals(error.message, 'Can not create from leaf', 'Can not create from leaf')
  }

  t.end()
})

test('do not set in reference get', t => {
  const master = create({
    key1: {
      key2: {
        key3: 'thing'
      }
    },
    pointer: ['@', 'key1']
  })

  master.get(['pointer', 'key2', 'key31'], 'thing2')
  master.get(['pointer', 'key22', 'key32'], 'thing3')

  t.same(
    master.serialize(),
    {
      key1: {
        key2: {
          key3: 'thing',
          key31: 'thing2'
        }
      },
      pointer: {
        key22: {
          key32: 'thing3'
        },
        val: ['@', 'key1']
      }
    },
    'master.serialize() = correct'
  )

  t.end()
})

test('ignore same val in branch', t => {
  const master = create({
    real: 'thing'
  })

  const branch1 = master.create({
    real: 'thing'
  })

  master.get('real').set('updated')

  t.equals(
    branch1.get('real').compute(),
    'updated',
    'branch1.real.compute() = updated'
  )

  t.end()
})
