const test = require('tape')
const { Struct } = require('../')

test('path collusion', t => {
  const state = new Struct()
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
    `1e5 sets (${structSet}ms) under 50x objSet (${objSet}ms)`
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
    structGet < objSet * 50,
    `1e5 gets (${structGet}ms) under 50x objSet (${objSet}ms)`
  )

  t.equals(
    Object.keys(state.leaves).length,
    100001,
    '100001 leaves in state'
  )
  t.end()
})
