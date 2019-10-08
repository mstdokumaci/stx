const test = require('tape')
const { create } = require('../../../dist')

test('network - subscriptions - non existing key should not fire', t => {
  const sMaster = create({
    existing: 'value'
  })

  const server = sMaster.listen(7070)

  const cMaster = create()

  cMaster.get('non-existing', {}).subscribe(
    ne => {
      if (ne.compute()) {
        t.fail('should not fire for non existing')
      }
    }
  )

  cMaster.get('existing', {}).subscribe(
    existing => {
      if (existing.compute()) {
        t.equals(
          existing.compute(),
          'value',
          'existing.compute() === value'
        )
        client.socket.close()
        server.close()
        t.end()
      }
    }
  )

  const client = cMaster.connect('ws://localhost:7070')
})
