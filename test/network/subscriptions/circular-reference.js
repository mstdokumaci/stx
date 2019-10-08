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

  const cMaster = create()

  sMaster.branch.newBranchMiddleware = branchRoot => {
    branchRoot.set({
      user: {
        name: 'User',
        author: ['@', 'authors', 'authorA']
      }
    })
  }

  server.switchBranch = async (_, branchKey, switcher) => switcher(branchKey)

  cMaster.on('connected', val => {
    if (val) {
      cMaster.switchBranch('A')
    } else {
      server.close()
      t.end()
    }
  })

  cMaster.get('user', {}).subscribe(user => {
    if (user.get('name')) {
      t.same(
        user.serialize(),
        { name: 'User', author: ['@', 'authors', 'authorA'] },
        'user.serialize() = { name: User, author: [@, authors, authorA] }'
      )
    }
  })

  cMaster.get('user').subscribe({ keys: ['author'], depth: 1 }, user => {
    const author = user.get('author')
    if (author) {
      author.get('books').subscribe({ depth: 2 }, books => {
        t.same(
          books.serialize(),
          {
            bookA: ['@', 'books', 'bookA'],
            bookB: ['@', 'books', 'bookB']
          },
          'books.serialize = correct'
        )

        client.socket.close()
      })
    }
  })

  const client = cMaster.connect('ws://localhost:7070')
})
