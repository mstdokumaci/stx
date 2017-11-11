const test = require('tape')
const { Struct } = require('../../')

test('create branch', t => {
  const master = new Struct()

  master.set({
    deep: {
      real: 'thing'
    },
    pointers: {
      pointer1: ['@', 'deep'],
      pointer2: ['@', 'deep', 'real']
    }
  })

  const branch1 = master.create()

  branch1.set({
    deep: {
      real2: 'thing2'
    },
    pointers: {
      pointer3: ['@', 'deep', 'real'],
      pointer4: ['@', 'deep', 'real2'],
      pointer5: ['@', 'pointers', 'pointer1']
    }
  })

  t.equals(
    branch1.get(['deep', 'real']).compute(),
    master.get(['deep', 'real']).compute(),
    'branch1.deep.real = master.deep.real'
  )
  t.equals(
    branch1.get(['deep', 'real2']).compute(),
    'thing2',
    'branch1.deep.real2.compute() = thing2'
  )
  t.equals(
    master.get(['deep', 'real2']),
    void 0,
    'master.deep.real2 = void 0'
  )

  t.equals(
    branch1.get(['pointers', 'pointer1', 'real']).compute(),
    master.get(['pointers', 'pointer1', 'real']).compute(),
    'branch1.pointers.pointer1.real.compute() = master.pointers.pointer1.real.compute()'
  )
  t.equals(
    branch1.get(['pointers', 'pointer2']).compute(),
    master.get(['pointers', 'pointer2']).compute(),
    'branch1.pointers.pointer2.compute() = master.pointers.pointer2.compute()'
  )

  t.equals(
    branch1.get(['pointers', 'pointer3']).compute(),
    master.get(['deep', 'real']).compute(),
    'branch1.pointers.pointer3 = master.deep.real'
  )
  t.equals(
    master.get(['pointers', 'pointer3']),
    void 0,
    'master.pointers.pointer3 = void 0'
  )

  t.equals(
    branch1.get(['pointers', 'pointer4']).compute(),
    'thing2',
    'branch1.pointers.pointer4.compute() = thing2'
  )
  t.equals(
    master.get(['pointers', 'pointer4']),
    void 0,
    'master.pointers.pointer4 = void 0'
  )

  t.equals(
    branch1.get(['pointers', 'pointer5', 'real']).compute(),
    master.get(['deep', 'real']).compute(),
    'branch1.pointers.pointer5.real.compute() = master.deep.real'
  )
  t.equals(
    master.get(['pointers', 'pointer5']),
    void 0,
    'master.pointers.pointer5 = void 0'
  )

  t.end()
})
