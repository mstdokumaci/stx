const test = require('tape')
const { create } = require('../../dist')

const handler = require('serve-handler')
const http = require('http')
const puppeteer = require('puppeteer')

test('browser - data size', { timeout: 4000 }, async t => {
  const master = create()
  const server = master.listen(7070)

  const bigData = { here: 'it is' }
  const val = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ' +
    'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
    'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
    'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit' +
    'anim id est laborum. Blandit inimicus pri ex, no placerat invenire vim. In ignota noster ' +
    'dicunt mel. Odio omnis everti duo ea. Nulla detraxit deserunt et nec, ne tempor pericula ' +
    'his. Per epicurei interesset an, cum te menandri ullamcorper, ut mea velit inciderint. ' +
    'Justo facer nam ea, ius scripta alienum delectus no. Usu in periculis mediocritatem, quo ' +
    'inermis epicuri delectus ut, mei cu nominavi rationibus voluptatibus. At diam facilisis ' +
    'eos, nam ad copiosae insolens. Vix ei ipsum dicam interpretaris. Augue impetus suscipit ' +
    'in has. Eum id tale augue denique, euripidis persecuti et vis. At recteque persequeris ' +
    'vel. Ludus partem maluisset duo ne. Eum an idque eligendi. Ei utroque voluptaria eos. ' +
    'Et omnis tincidunt ius, et cetero sapientem facilisis ius. Pro te lobortis pertinacia. ' +
    'Nobis vidisse detraxit sit ut. Cu splendide complectitur sea, mei ea decore nusquam ' +
    'invenire. Vix no mollis tamquam eligendi, id cum feugait nominavi, ut regione delenit ' +
    'sapientem est. Vis an disputando repudiandae, qui illud incorrupte te, sed maluisset ' +
    'consetetur posidonium te. Amet placerat eum ne, qui sumo partiendo salutandi ea. Mel ' +
    'case civibus eligendi ei, ei causae cetero eum, stet impetus ea est. Urbanitas ' +
    'signiferumque ex per. An dico habeo disputationi eam, vim te meis antiopam sententiae, ' +
    'propriae periculis adversarium eos ex. Insolens percipitur efficiantur qui at, dicam ' +
    'qualisque appellantur ne per. In saepe delenit incorrupte eam, antiopam elaboraret id ' +
    'eum. Mazim noluisse definitiones has ad, vel id erat equidem. Ex qui inani iusto delenit.'
  let i = 7e2
  while (i--) {
    const d = 1e11 + Math.round(Math.random() * 1e9) + i
    bigData[`key-${d}-longer-string-${d}`] = {
      keyOne: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyTwo: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyThree: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyFour: { subKeyOne: val, subKeyTwo: val, subKeyThree: val },
      keyFive: { subKeyOne: val, subKeyTwo: val, subKeyThree: val }
    }
  }

  master.set({ bigData })

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

  const fired = []
  page.on('console', msg => fired.push(msg.text()))

  await page.evaluate(
    window => new Promise(resolve => {
      window.master = window.stx.create()

      window.master.get('bigData', {}).subscribe(bigData => {
        if (bigData.get('here')) {
          console.log('bigData.here', bigData.get('here').compute())
          resolve()
        }
      })

      window.client = window.master.connect('ws://localhost:7070')
    }),
    await page.evaluateHandle('window')
  )

  master.set({
    otherData: {
      here: 'it is'
    }
  })

  await page.evaluate(
    window => new Promise(resolve => {
      window.master.get('otherData', {}).subscribe(otherData => {
        if (otherData.get('here')) {
          console.log('otherData.here', otherData.get('here').compute())
          window.client.socket.close()
          resolve()
        }
      })
    }),
    await page.evaluateHandle('window')
  )

  t.same(
    fired,
    ['bigData.here it is', 'otherData.here it is'],
    'fired = [ bigData.here it is, otherData.here it is ]'
  )

  await browser.close()
  await server.close()
  await httpServer.close()
  t.end()
})
