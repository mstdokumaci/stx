const test = require('tape')
const { create } = require('../../dist')

const handler = require('serve-handler')
const http = require('http')
const puppeteer = require('puppeteer')

test('browser - client set', async t => {
  const master = create({
    items: {
      i1: {
        title: 'Item 1',
        favourite: false,
        favCount: 0
      },
      i2: {
        title: 'Item 2',
        favourite: false,
        favCount: 1
      }
    }
  })
  const server = master.listen(7171)

  master.branch.clientCanUpdate = [
    {
      path: ['items', '*', 'favCount']
    }
  ]

  const hMaster = create()
  const hybrid = hMaster.listen(7070)
  const hClient = hMaster.connect('ws://localhost:7171')
  hMaster.subscribe(() => { })

  const updateFavCount = favourite => {
    const favCount = hMaster.get(favourite.parent().path()).get('favCount')
    if (favourite.compute()) {
      favCount.set(favCount.compute() + 1)
    } else {
      favCount.set(favCount.compute() - 1)
    }
  }

  hMaster.branch.newBranchMiddleware = newBranch => {
    newBranch.branch.clientCanUpdate = [
      {
        path: ['items', '*', 'favourite'],
        after: updateFavCount
      }
    ]
  }

  hybrid.switchBranch = async (_, branchKey, switcher) => {
    const toBranch = await switcher(branchKey)
    toBranch.set({
      id: branchKey
    })
    return toBranch
  }

  let doneCount = 0
  const afterAll = async () => {
    if (++doneCount >= 7) {
      t.same(
        hMaster.serialize(),
        {
          items:
          {
            i1: {
              title: 'Item 1',
              favourite: false,
              favCount: 2
            },
            i2: {
              title: 'Item 2',
              favourite: false,
              favCount: 2
            }
          }
        },
        'hybrid master state is correct'
      )
      t.same(
        master.serialize(),
        {
          items:
          {
            i1: {
              title: 'Item 1',
              favourite: false,
              favCount: 2
            },
            i2: {
              title: 'Item 2',
              favourite: false,
              favCount: 2
            }
          }
        },
        'master state is correct'
      )

      await browser.close()
      await server.close()
      await hybrid.close()
      await hClient.socket.close()
      await httpServer.close()
      t.end()
    }
  }

  master.get(['items', 'i1', 'favCount']).on(() => afterAll())

  const httpServer = http.createServer(
    (request, response) => handler(
      request,
      response,
      {
        public: './dist/',
        renderSingle: true
      }
    )
  )

  httpServer.listen(8888)

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:8888')

  page.on('console', msg => console.log(msg.text()))

  await page.evaluate(
    window => new Promise(resolve => {
      window.master = window.stx.create()

      window.master.on('connected', val => {
        if (val) {
          window.master.switchBranch('user1')

          const items = window.master.get('items', {})
          items.subscribe(() => { })

          window.master.get('id', {}).subscribe(id => {
            if (id.compute() === 'user1') {
              items.get(['i2', 'favourite']).set(true)
              items.get(['i1', 'favourite']).set(true)
              items.get(['i2', 'favourite']).set(false)
              items.get(['i1', 'favourite']).set(false)
              items.set({
                i1: {
                  favourite: false
                },
                i2: {
                  favourite: false
                }
              })
              items.set({
                i1: {
                  favourite: true
                },
                i2: {
                  favourite: true
                }
              })

              window.master.switchBranch('user2')
            } else if (id.compute() === 'user2') {
              items.get(['i1', 'favourite']).set(true)
              items.get(['i1', 'favourite']).set(false)
              items.get(['i1', 'favourite']).set(true)

              window.client.socket.close()
            }
          })
        } else {
          resolve()
        }
      })
      window.client = window.master.connect('ws://localhost:7070')
    }),
    await page.evaluateHandle('window')
  )
  await afterAll()
})
