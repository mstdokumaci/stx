const test = require('tape')
const { create } = require('../../dist')

test('references - remove', t => {
  const state = create({
    books: {
      bookA: {
        title: 'Book A',
        author: ['@', 'authors', 'authorA']
      }
    },
    authors: {
      authorA: {
        name: 'Author A',
        books: {
          bookA: ['@', 'books', 'bookA']
        }
      }
    }
  })

  const branch = state.create({
    myBooks: {
      bookA: ['@', 'books', 'bookA']
    },
    myAuthors: {
      authorA: ['@', 'authors', 'authorA']
    }
  })

  t.same(
    branch.serialize(),
    {
      authors: { authorA: { name: 'Author A', books: { bookA: ['@', 'books', 'bookA'] } } },
      books: { bookA: { title: 'Book A', author: ['@', 'authors', 'authorA'] } },
      myBooks: { bookA: ['@', 'books', 'bookA'] },
      myAuthors: { authorA: ['@', 'authors', 'authorA'] }
    },
    'branch.serialize() = correct'
  )

  state.get(['books', 'bookA']).set(null)
  state.get(['authors', 'authorA', 'books', 'bookA']).set(null)
  branch.get(['myBooks', 'bookA']).set(null)

  t.same(
    branch.serialize(),
    {
      authors: { authorA: { name: 'Author A', books: {} } },
      books: {},
      myBooks: {},
      myAuthors: { authorA: ['@', 'authors', 'authorA'] }
    },
    'branch.serialize() = correct'
  )

  state.get('books').set({
    bookA: {
      title: 'Book A',
      author: ['@', 'authors', 'authorA']
    }
  })
  state.get(['authors', 'authorA', 'books']).set({
    bookA: ['@', 'books', 'bookA']
  })
  branch.get('myBooks').set({
    bookA: ['@', 'books', 'bookA']
  })

  t.same(
    branch.serialize(),
    {
      authors: { authorA: { name: 'Author A', books: { bookA: ['@', 'books', 'bookA'] } } },
      books: { bookA: { title: 'Book A', author: ['@', 'authors', 'authorA'] } },
      myBooks: { bookA: ['@', 'books', 'bookA'] },
      myAuthors: { authorA: ['@', 'authors', 'authorA'] }
    },
    'branch.serialize() = correct'
  )

  t.end()
})
