const test = require('tape')
const { createPersist } = require('../dist')

const persistentStorage = {}

const Persist = function (name) {
  this.start = async () => {
    if (!persistentStorage[name]) {
      persistentStorage[name] = {}
    }

    this.storage = persistentStorage[name]
  }

  this.store = (key, value) => {
    this.storage[key] = JSON.stringify(value)
  }

  this.remove = key => {
    delete this.storage[key]
  }

  this.load = async loadLeaf => {
    for (const key in this.storage) {
      loadLeaf(key, JSON.parse(this.storage[key]))
    }
  }

  this.stop = async () => {}
}

test('persist - basic set', async t => {
  const persist = new Persist('state')
  const state = await createPersist({ key1: 'value1' }, persist)

  state.set({ key2: 'value2' })

  await persist.stop()

  t.end()
})

test('persist - basic get and delete', async t => {
  const persist = new Persist('state')
  const state = await createPersist({ key3: 'value3' }, persist)

  t.same(
    state.serialize(),
    { key1: 'value1', key2: 'value2', key3: 'value3' },
    'state.serialize() = { key1: value1, key2: value2, key3: value3 }'
  )

  state.set({ key2: null })

  await persist.stop()

  t.end()
})

test('persist - basic get after delete', async t => {
  const persist = new Persist('state')
  const state = await createPersist({ key4: 'value4' }, persist)

  t.same(
    state.serialize(),
    { key1: 'value1', key3: 'value3', key4: 'value4' },
    'state.serialize() = { key1: value1, key3: value3, key4: value4 }'
  )

  await persist.stop()

  t.end()
})
