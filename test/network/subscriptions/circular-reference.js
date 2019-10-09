const test = require('tape')
const { create } = require('../../../dist')

test('network - subscriptions - circular references', t => {
  const sMaster = create({
    user: {},
    authors: {
      authorA: {
        name: 'Author A',
        books: {
          bookA: ['@', 'books', 'bookA'],
          bookB: ['@', 'books', 'bookB']
        }
      },
      authorB: {
        name: 'Author B',
        books: {
          bookC: ['@', 'books', 'bookC']
        }
      }
    },
    books: {
      bookA: {
        title: 'Book A',
        author: ['@', 'authors', 'authorA']
      },
      bookB: {
        title: 'Book B',
        author: ['@', 'authors', 'authorA']
      },
      bookC: {
        title: 'Book C',
        author: ['@', 'authors', 'authorB']
      }
    }
  })

  const server = sMaster.listen(7070)

  const cMaster1 = create()
  const cMaster2 = create()
  const cMaster3 = create()

  sMaster.branch.newBranchMiddleware = branchRoot => {
    branchRoot.set({
      user: {
        name: 'User',
        author: ['@', 'authors', 'authorA']
      },
      draft: {
        bookB: {
          title: 'Book B improved',
          book: ['@', 'books', 'bookB']
        }
      }
    })
  }

  server.switchBranch = async (_, branchKey, switcher) => switcher(branchKey)

  let closedCount = 0
  const closed = () => {
    if (++closedCount >= 3) {
      server.close()
      t.end()
    }
  }

  cMaster1.on('connected', val => {
    if (val) {
      cMaster1.switchBranch('A')
    } else {
      closed()
    }
  })

  cMaster2.on('connected', val => {
    if (val) {
      cMaster2.switchBranch('B')
    } else {
      closed()
    }
  })

  cMaster3.on('connected', val => {
    if (val) {
      cMaster3.switchBranch('C')
    } else {
      closed()
    }
  })

  cMaster1.get('user', {}).subscribe(user => {
    if (user.get('name')) {
      t.same(
        user.serialize(),
        { name: 'User', author: ['@', 'authors', 'authorA'] },
        'cm1.user.serialize() = { name: User, author: [@, authors, authorA] }'
      )
    }
  })

  cMaster1.get('draft', {}).subscribe(draft => {
    if (draft.get('bookB')) {
      t.same(
        draft.serialize(),
        {
          bookB: {
            title: 'Book B improved',
            book: ['@', 'books', 'bookB']
          }
        },
        'cm1.draft.serialize() = correct'
      )
    }
  })

  cMaster1.get('user').subscribe({ keys: ['author'], depth: 2 }, user => {
    const author = user.get('author')
    if (author) {
      author.get('books').subscribe({ depth: 2 }, books => {
        t.same(
          books.serialize(),
          {
            bookA: ['@', 'books', 'bookA'],
            bookB: ['@', 'books', 'bookB']
          },
          'cm1.books.serialize = correct'
        )

        client1.socket.close()
      })
    }
  })

  cMaster2.get('user', {}).subscribe({ excludeKeys: ['author'] }, user => {
    if (user.get('name')) {
      t.same(
        user.serialize(),
        { name: 'User', author: ['@', 'authors', 'authorA'] },
        'cm2.user.serialize() = { name: User, author: [@, authors, authorA] }'
      )
    }
  })

  cMaster2.get('draft', {}).subscribe(draft => {
    if (draft.get('bookB')) {
      t.same(
        draft.serialize(),
        {
          bookB: {
            title: 'Book B improved',
            book: ['@', 'books', 'bookB']
          }
        },
        'cm2.draft.serialize() = correct'
      )
    }
  })

  cMaster2.get('user', {}).subscribe({ keys: ['author'], depth: 2 }, user => {
    const author = user.get('author')
    if (author) {
      author.get('books').subscribe({ depth: 2 }, books => {
        if (books.get('bookB')) {
          t.same(
            books.serialize(),
            {
              bookA: ['@', 'books', 'bookA'],
              bookB: ['@', 'books', 'bookB']
            },
            'cm2.books.serialize = correct'
          )

          client2.socket.close()
        }
      })
    }
  })

  cMaster3.get('user', {}).subscribe({ excludeKeys: ['author'] }, user => {
    if (user.get('name')) {
      t.same(
        user.serialize(),
        { name: 'User', author: ['@', 'authors', 'authorA'] },
        'cm3.user.serialize() = { name: User, author: [@, authors, authorA] }'
      )
    }
  })

  cMaster3.get('draft', {}).subscribe({ depth: 2 }, draft => {
    if (draft.get('bookB')) {
      t.same(
        draft.serialize(),
        {
          bookB: {
            title: 'Book B improved',
            book: ['@', 'books', 'bookB']
          }
        },
        'cm3.draft.serialize() = correct'
      )
    }
  })

  cMaster3.get('user', {}).subscribe({ keys: ['author'], depth: 2 }, user => {
    const author = user.get('author')
    if (author) {
      author.get('books').subscribe({ depth: 2 }, books => {
        if (books.get('bookB')) {
          t.same(
            books.serialize(),
            {
              bookA: ['@', 'books', 'bookA'],
              bookB: ['@', 'books', 'bookB']
            },
            'cm3.books.serialize = correct'
          )

          client3.socket.close()
        }
      })
    }
  })

  const client1 = cMaster1.connect('ws://localhost:7070')
  const client2 = cMaster2.connect('ws://localhost:7070')
  const client3 = cMaster3.connect('ws://localhost:7070')
})
