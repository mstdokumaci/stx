const test = require('tape')
const { Struct } = require('../../')

test('branches - forEach', t => {
  const master = new Struct({
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
      masterArray.push([id, propName, prop.compute()])
    })
  })

  const branch1Array = []
  branch1.get('articles').forEach((article, id) => {
    article.forEach((prop, propName) => {
      branch1Array.push([id, propName, prop.compute()])
    })
  })

  const branch2Array = []
  branch2.get('articles').forEach((article, id) => {
    article.forEach((prop, propName) => {
      branch2Array.push([id, propName, prop.compute()])
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

test('branches - map', t => {
  const master = new Struct({
    first: {
      name: 'first'
    },
    second: {
      name: 'second'
    }
  })

  const branch1 = master.create({
    third: {
      name: 'third'
    }
  })

  const branch2 = branch1.create({
    first: {
      name: 'first override'
    },
    third: {
      name: 'third override'
    }
  })

  t.same(
    master.map(item => item.get('name').compute()),
    [ 'first', 'second' ],
    'master.map() = [ first, second ]'
  )
  t.same(
    branch1.map(item => item.get('name').compute()),
    [ 'third', 'first', 'second' ],
    'branch1.map() = [ third, first, second ]'
  )
  t.same(
    branch2.map(item => item.get('name').compute()),
    [ 'third override', 'first override', 'second' ],
    'branch2.map() = [ third override, first override, second ]'
  )

  t.end()
})
