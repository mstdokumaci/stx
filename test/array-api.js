const test = require('tape')
const { create } = require('../dist/index')

test('array api - forEach', t => {
  const master = create({
    articles: {
      first: {
        title: 'First Article'
      },
      second: {
        title: 'Second Article'
      }
    }
  })

  const branch1 = master.create({
    articles: {
      third: {
        title: 'Third Article'
      }
    }
  })

  const branch2 = branch1.create({
    articles: {
      first: {
        favourite: true
      },
      third: {
        favourite: true
      }
    }
  })

  t.same(
    master.serialize(),
    {
      articles: {
        first: { title: 'First Article' },
        second: { title: 'Second Article' }
      }
    },
    'master.serialize() is correct'
  )
  t.same(
    branch1.serialize(),
    {
      articles: {
        first: { title: 'First Article' },
        second: { title: 'Second Article' },
        third: { title: 'Third Article' }
      }
    },
    'branch1.serialize() is correct'
  )
  t.same(
    branch2.serialize(),
    {
      articles: {
        first: { favourite: true, title: 'First Article' },
        second: { title: 'Second Article' },
        third: { favourite: true, title: 'Third Article' }
      }
    },
    'branch2.serialize() is correct'
  )

  const masterArray = []
  master.get('articles').forEach((article, id) => {
    article.forEach((prop, propName) => {
      masterArray.push([ id, propName, prop.compute() ])
    })
  })

  const branch1Array = []
  branch1.get('articles').forEach((article, id) => {
    article.forEach((prop, propName) => {
      branch1Array.push([ id, propName, prop.compute() ])
    })
  })

  const branch2Array = []
  branch2.get('articles').forEach((article, id) => {
    article.forEach((prop, propName) => {
      branch2Array.push([ id, propName, prop.compute() ])
    })
  })

  t.same(
    masterArray,
    [
      [ 'first', 'title', 'First Article' ],
      [ 'second', 'title', 'Second Article' ]
    ],
    'master has correct keys'
  )
  t.same(
    branch1Array,
    [
      [ 'third', 'title', 'Third Article' ],
      [ 'first', 'title', 'First Article' ],
      [ 'second', 'title', 'Second Article' ]
    ],
    'branch1 has correct keys'
  )
  t.same(
    branch2Array,
    [
      [ 'third', 'favourite', true ],
      [ 'third', 'title', 'Third Article' ],
      [ 'first', 'favourite', true ],
      [ 'first', 'title', 'First Article' ],
      [ 'second', 'title', 'Second Article' ]
    ],
    'branch2 has correct keys'
  )

  t.end()
})

test('array api - filter', t => {
  const master = create({
    articles: {
      first: {
        favourite: false,
        name: 'first'
      },
      second: {
        favourite: false,
        name: 'second'
      }
    }
  })

  const branch1 = master.create()
  branch1.get('articles').set({
    third: {
      name: 'third',
      favourite: true
    }
  })

  const branch2 = branch1.create({
    articles: {
      first: {
        favourite: true
      },
      second: {
        favourite: true
      },
      third: {
        favourite: false
      }
    }
  })

  t.same(
    master
      .get('articles')
      .filter(item => item.get('favourite').compute())
      .map(item => item.get('name').compute()),
    [],
    'master.articles.filter() = []'
  )
  t.same(
    branch1
      .get('articles')
      .filter(item => item.get('favourite').compute())
      .map(item => item.get('name').compute()),
    [ 'third' ],
    'branch1.articles.filter() = [ third ]'
  )
  t.same(
    branch2
      .get('articles')
      .filter(item => item.get('favourite').compute())
      .map(item => item.get('name').compute()),
    [ 'first', 'second' ],
    'branch2.articles.filter() = [ first, second ]'
  )

  t.end()
})

test('array api - map', t => {
  const master = create({
    articles: {
      first: {
        name: 'first'
      },
      second: {
        name: 'second'
      }
    }
  })

  const branch1 = master.create()
  branch1.get('articles').set({
    third: {
      name: 'third'
    }
  })

  const branch2 = branch1.create({
    articles: {
      second: null
    }
  })

  t.same(
    master
      .get('articles')
      .map(item => item.get('name').compute()),
    [ 'first', 'second' ],
    'master.articles.map() = [ first, second ]'
  )
  t.same(
    branch1
      .get('articles')
      .map(item => item.get('name').compute()),
    [ 'third', 'first', 'second' ],
    'branch1.articles.map() = [ third, first, second ]'
  )
  t.same(
    branch2
      .get('articles')
      .map(item => item.get('name').compute()),
    [ 'third', 'first' ],
    'branch2.articles.map() = [ third, first ]'
  )

  t.end()
})

test('array api - find', t => {
  const master = create({
    first: {
      name: 'first',
      favourite: false
    },
    second: {
      name: 'second',
      favourite: true
    }
  })

  const branch1 = master.create({
    second: {
      favourite: false
    },
    third: {
      name: 'third',
      favourite: false
    }
  })

  const branch2 = branch1.create({
    first: {
      favourite: true
    }
  })

  t.equals(
    master.find(item => item.get('favourite').compute()).get('name').compute(),
    'second',
    'master.find() = second'
  )
  t.equals(
    branch1.find(item => item.get('name').compute() === 'third').get('name').compute(),
    'third',
    'branch1.find() = third'
  )
  t.equals(
    branch2.find(item => item.get('favourite').compute()).get('name').compute(),
    'first',
    'branch2.find() = first'
  )

  t.end()
})

test('array api - reduce', t => {
  const master = create({
    payments: {
      first: 5,
      second: 10
    }
  })

  const branch1 = master.create()
  branch1.get('payments').set({
    third: 15
  })

  const branch2 = branch1.create({
    payments: {
      first: 3,
      third: 7
    }
  })

  t.equals(
    master.get('payments').reduce((sum, amount) => sum + amount.compute(), 0),
    15,
    'master.payments.reduce() = 15'
  )
  t.equals(
    branch1.get('payments').reduce((sum, amount) => sum + amount.compute(), 5),
    35,
    'branch1.payments.reduce() = 35'
  )
  t.equals(
    branch2.get('payments').reduce((sum, amount) => sum + amount.compute(), 0),
    20,
    'branch2.payments.reduce() = 20'
  )

  t.end()
})
