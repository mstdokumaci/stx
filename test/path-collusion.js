const test = require('tape')
const { create } = require('../dist')

test('path collusion', t => {
  const state = create()
  const arr = {}

  let d = Date.now()
  for (let i = 0; i < 1e4; i++) {
    arr[i] = {
      val: 'value-' + i,
      a: 'a' + i,
      b: 'b' + i,
      c: 'c' + i,
      nested: {
        val: 'nested-value'
      }
    }
    for (let j = 0; j < 5; j++) {
      arr[i].nested['x' + j] = 'nested-' + j
    }
  }
  const objSet = Date.now() - d

  d = Date.now()
  state.set(arr)
  const structSet = Date.now() - d
  t.ok(
    structSet < objSet * 50,
    `1e5 sets (${structSet}ms) under 60x objSet (${objSet}ms)`
  )

  d = Date.now()
  let leaf
  for (let i = 0; i < 1e4; i++) {
    leaf = state.get(i)
    state.get([ i, 'a' ])
    state.get([ i, 'b' ])
    state.get([ i, 'c' ])
    leaf.get('nested')
    leaf.get([ 'nested', 'x0' ])
    leaf.get([ 'nested', 'x1' ])
    leaf.get([ 'nested', 'x2' ])
    leaf.get([ 'nested', 'x3' ])
    leaf.get([ 'nested', 'x4' ])
  }
  const structGet = Date.now() - d
  t.ok(
    structGet < objSet * 25,
    `1e5 gets (${structGet}ms) under 30x objSet (${objSet}ms)`
  )

  t.equals(
    state.inspect(),
    'stx { 0, 1, 2, 3, 4, ... 9995 more items }',
    'state.inspect() = stx { 0, 1, 2, 3, 4, ... 9995 more items }'
  )

  t.equals(
    Object.keys(state.branch.leaves).length,
    100001,
    '100001 leaves in state'
  )
  t.end()
})
