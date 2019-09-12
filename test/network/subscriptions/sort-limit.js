const test = require('tape')
const { create } = require('../../../dist')

test('network - sort & limit', t => {
  const sState = create()
  const server = sState.listen(7070)

  const cState1 = create()
  const cState2 = create()
  const cState3 = create()
  const cState4 = create()
  const cState5 = create()

  let closeCount = 0

  const closeServer = () => {
    if (++closeCount === 5) {
      server.close()
    }
  }

  cState1.on('connected', val => {
    if (val) {
      sState.set({
        authors: {
          authorA: {
            id: 1,
            name: 'Author A'
          },
          authorB: {
            id: 2,
            name: 'Author B'
          }
        },
        books: {
          bookA: {
            id: 1,
            title: 'book Â',
            author: ['@', 'authors', 'authorB'],
            orderCount: 17
          },
          bookB: {
            id: 2,
            title: 'book B',
            author: ['@', 'authors', 'authorA'],
            orderCount: 2
          },
          bookC: {
            id: 3,
            title: 'book C',
            author: ['@', 'authors', 'authorB'],
            orderCount: 3
          },
          bookD: {
            id: 4,
            title: 'book D',
            author: ['@', 'authors', 'authorA'],
            orderCount: 21
          }
        }
      })
    }
  })

  cState1.get('books', {}).subscribe(
    { sort: { path: ['author', 'name'], type: String }, limit: 3 },
    books => {
      if (books.get('bookB')) {
        t.same(
          books.serialize(),
          {
            bookB: {
              id: 2,
              title: 'book B',
              author: ['@', 'authors', 'authorA'],
              orderCount: 2
            },
            bookD: {
              id: 4,
              title: 'book D',
              author: ['@', 'authors', 'authorA'],
              orderCount: 21
            },
            bookA: {
              id: 1,
              title: 'book Â',
              author: ['@', 'authors', 'authorB'],
              orderCount: 17
            }
          },
          'cState1.books.serialize() = correct'
        )
        client1.socket.close()
        closeServer()
      }
    }
  )

  cState2.get('books', {}).subscribe(
    { sort: { path: ['title'] }, limit: 3 },
    books => {
      if (books.get('bookA')) {
        t.same(
          books.serialize(),
          {
            bookA: {
              id: 1,
              title: 'book Â',
              author: ['@', 'authors', 'authorB'],
              orderCount: 17
            },
            bookB: {
              id: 2,
              title: 'book B',
              author: ['@', 'authors', 'authorA'],
              orderCount: 2
            },
            bookC: {
              id: 3,
              title: 'book C',
              author: ['@', 'authors', 'authorB'],
              orderCount: 3
            }
          },
          'cState2.books.serialize() = correct'
        )
        client2.socket.close()
        closeServer()
      }
    }
  )

  cState3.get('books', {}).subscribe(
    { sort: { path: ['orderCount'], type: Number }, limit: 3 },
    books => {
      if (books.get('bookB')) {
        t.same(
          books.serialize(),
          {
            bookB: {
              id: 2,
              title: 'book B',
              author: ['@', 'authors', 'authorA'],
              orderCount: 2
            },
            bookC: {
              id: 3,
              title: 'book C',
              author: ['@', 'authors', 'authorB'],
              orderCount: 3
            },
            bookA: {
              id: 1,
              title: 'book Â',
              author: ['@', 'authors', 'authorB'],
              orderCount: 17
            }
          },
          'cState3.books.serialize() = correct'
        )
        client3.socket.close()
        closeServer()
      }
    }
  )

  cState4.get('books', {}).subscribe(
    { sort: { path: ['title'], desc: true }, limit: 3 },
    books => {
      if (books.get('bookD')) {
        t.same(
          books.serialize(),
          {
            bookD: {
              id: 4,
              title: 'book D',
              author: ['@', 'authors', 'authorA'],
              orderCount: 21
            },
            bookC: {
              id: 3,
              title: 'book C',
              author: ['@', 'authors', 'authorB'],
              orderCount: 3
            },
            bookB: {
              id: 2,
              title: 'book B',
              author: ['@', 'authors', 'authorA'],
              orderCount: 2
            }
          },
          'cState4.books.serialize() = correct'
        )
        client4.socket.close()
        closeServer()
      }
    }
  )

  cState5.get('books', {}).subscribe(
    { sort: { path: ['orderCount'], type: Number, desc: true }, limit: 3 },
    books => {
      if (books.get('bookD')) {
        t.same(
          books.serialize(),
          {
            bookD: {
              id: 4,
              title: 'book D',
              author: ['@', 'authors', 'authorA'],
              orderCount: 21
            },
            bookA: {
              id: 1,
              title: 'book Â',
              author: ['@', 'authors', 'authorB'],
              orderCount: 17
            },
            bookC: {
              id: 3,
              title: 'book C',
              author: ['@', 'authors', 'authorB'],
              orderCount: 3
            }
          },
          'cState5.books.serialize() = correct'
        )
        client5.socket.close()
        closeServer()
      }
    }
  )

  const client1 = cState1.connect('ws://localhost:7070')
  const client2 = cState2.connect('ws://localhost:7070')
  const client3 = cState3.connect('ws://localhost:7070')
  const client4 = cState4.connect('ws://localhost:7070')
  const client5 = cState5.connect('ws://localhost:7070')

  t.plan(5)
})
