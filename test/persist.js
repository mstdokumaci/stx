const test = require('tape')
const { createPersist } = require('../dist')
const { Persist } = require('./helpers')

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

test('persist - set with reference', async t => {
  const persist = new Persist('state-ref')
  const state = await createPersist(
    { key1: 'value1' }, persist
  )

  state.set({
    key2: 'value 2',
    pointer: ['@', 'key1']
  })

  await persist.stop()

  t.end()
})

test('persist - get with reference and update', async t => {
  const persist = new Persist('state-ref')
  const state = await createPersist({}, persist)

  const listener = state.get('pointer').on((type, _, item) => {
    t.equals(
      `${type} ${item.compute()}`,
      'set updated 1',
      'set updated 1'
    )

    listener.off()

    state.set({ pointer: ['@', 'key2'] })

    t.end()
  })

  state.set({ key1: 'updated 1' })
})

test('persist - get with reference after update', async t => {
  const persist = new Persist('state-ref')
  const state = await createPersist({}, persist)

  state.get('pointer').on((type, _, item) => {
    t.equals(
      `${type} ${item.compute()}`, 'set updated 2', 'set updated 2'
    )

    t.end()
  })

  state.set({ key2: 'updated 2' })
})
