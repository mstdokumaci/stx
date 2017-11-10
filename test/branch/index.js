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
  t.end()
})
