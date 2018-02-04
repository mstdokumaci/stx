const test = require('tape')
const { create } = require('../../dist/index')

test('network - server1', t => {
  const master = create()
  const server = master.listen(7070)

  server.close()

  t.pass('server closed')
  t.end()
})

test('network - server2', t => {
  const master = create()
  const server = master.listen(7070)

  server.close()

  t.pass('server closed')
  t.end()
})
