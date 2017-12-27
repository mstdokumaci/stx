const test = require('tape')
const { create } = require('../dist/index')

test('references', t => {
  const master = create()

  master.set({
    deep: {
      real: 'thing'
    },
    pointers: {
      pointer1: [ '@', 'deep' ],
      pointer2: [ '@', 'deep', 'real' ]
    }
  })

  const branch1 = master.create()

  branch1.set({
    deep: {
      real2: 'thing2'
    },
    pointers: {
      pointer3: [ '@', 'deep', 'real' ],
      pointer4: [ '@', 'deep', 'real2' ],
      pointer5: master.get([ 'pointers', 'pointer1' ])
    }
  })

  t.equals(
    branch1.get([ 'deep', 'real' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.deep.real = master.deep.real'
  )
  t.equals(
    branch1.get([ 'deep', 'real2' ]).compute(),
    'thing2',
    'branch1.deep.real2.compute() = thing2'
  )
  t.equals(
    master.get([ 'deep', 'real2' ]),
    void 0,
    'master.deep.real2 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    master.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    'branch1.pointers.pointer1.real.compute() = master.pointers.pointer1.real.compute()'
  )
  t.equals(
    branch1.get([ 'pointers', 'pointer2' ]).compute(),
    master.get([ 'pointers', 'pointer2' ]).compute(),
    'branch1.pointers.pointer2.compute() = master.pointers.pointer2.compute()'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer3' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.pointers.pointer3 = master.deep.real'
  )
  t.equals(
    master.get([ 'pointers', 'pointer3' ]),
    void 0,
    'master.pointers.pointer3 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer4' ]).compute(),
    'thing2',
    'branch1.pointers.pointer4.compute() = thing2'
  )
  t.equals(
    master.get([ 'pointers', 'pointer4' ]),
    void 0,
    'master.pointers.pointer4 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer5', 'real' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.pointers.pointer5.real.compute() = master.deep.real'
  )
  t.equals(
    master.get([ 'pointers', 'pointer5' ]),
    void 0,
    'master.pointers.pointer5 = void 0'
  )

  const branch2 = branch1.create({
    deep: {
      real: 'override'
    },
    pointers: {
      pointer1: {
        real: 'reference-override'
      }
    }
  })

  t.equals(
    master.get([ 'deep', 'real' ]).compute(),
    'thing',
    'master.deep.real.compute() = thing'
  )
  t.equals(
    branch1.get([ 'deep', 'real' ]).compute(),
    'thing',
    'branch1.deep.real.compute() = thing'
  )
  t.equals(
    branch2.get([ 'deep', 'real' ]).compute(),
    'override',
    'branch2.deep.real.compute() = override'
  )
  t.equals(
    branch2.get([ 'deep', 'real2' ]).compute(),
    'thing2',
    'branch2.deep.real2.compute() = thing2'
  )

  t.equals(
    branch2.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    'reference-override',
    'branch2.pointers.pointer1.real.compute() = reference-override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer2' ]).compute(),
    'override',
    'branch2.pointers.pointer2.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer3' ]).compute(),
    'override',
    'branch2.pointers.pointer3.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer4' ]).compute(),
    'thing2',
    'branch2.pointers.pointer4.compute() = thing2'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5', 'real2' ]).compute(),
    'thing2',
    'branch2.pointers.pointer5.real2.compute() = thing2'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).get('real2').compute(),
    'thing2',
    'branch2.pointers.pointer5.real2.compute() = thing2'
  )

  branch1.set({
    pointers: {
      pointer1: 'override'
    }
  })

  t.equals(
    branch2.get([ 'pointers', 'pointer5', 'real' ]).compute(),
    'reference-override',
    'branch2.pointers.pointer5.real = reference-override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer1', 'real2' ]),
    void 0,
    'branch2.pointers.pointer1.real2 = undefined'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).get('real2'),
    void 0,
    'branch2.pointers.pointer5.real2 = undefined'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer1' ]).compute(),
    'override',
    'branch2.pointers.pointer1.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).compute(),
    'override',
    'branch2.pointers.pointer5.compute() = override'
  )

  t.end()
})

test('references - merge', t => {
  const master = create({
    id: 'master',
    real: {
      rA: { name: 'A' },
      rB: { name: 'B' }
    },
    pointer: {
      p1: [ '@', 'real', 'rA' ],
      p2: [ '@', 'real', 'rB' ]
    }
  })

  const branch1 = master.create({
    id: 'branch1',
    real: { rA: { field: 1 } },
    pointer: { p1: { pField: 11 } }
  })

  const branch2 = master.create({
    id: 'branch2',
    real: { rB: { field: 2 } },
    pointer: { p2: { pField: 22 } }
  })

  const branch3 = branch1.create({
    id: 'branch3',
    real: { rB: { field: 3 } },
    pointer: { p2: { pField: false } }
  })

  const branch4 = branch2.create({
    id: 'branch4',
    real: { rA: { field: 4 } },
    pointer: { p1: { pField: true } }
  })

  master.set({
    pointer: {
      p1: [ '@', 'real', 'rB' ],
      p2: [ '@', 'real', 'rA' ]
    }
  })

  t.equals(
    branch3.get([ 'pointer', 'p2', 'pField' ]).compute(), false,
    'branch3 p2 pField is correct'
  )
  t.equals(
    branch3.get([ 'pointer', 'p2', 'field' ]).compute(), 1,
    'branch3 p2 field is correct'
  )
  t.equals(
    branch4.get([ 'pointer', 'p1', 'pField' ]).compute(), true,
    'branch4 p1 pField is correct'
  )
  t.equals(
    branch4.get([ 'pointer', 'p1', 'field' ]).compute(), 2,
    'branch4 p1 field is correct'
  )

  t.end()
})

test('references - key swapping', t => {
  const master = create({
    id: 'master',
    movieC: {
      year: 1998,
      imdb: 7.7,
      title: 'Run Lola Run'
    },
    movies: {
      0: [ '@', 'movieC' ]
    }
  })

  const branch1 = master.create({
    id: 'branch1',
    movieC: {
      favourite: true
    }
  })

  master.set({
    movieB: {
      year: 2003,
      imdb: 7.7,
      title: 'Good Bye Lenin'
    },
    movies: {
      0: [ '@', 'movieB' ],
      1: [ '@', 'movieC' ]
    }
  })

  branch1.set({
    movieC: {
      progress: 0.2
    }
  })

  t.same(
    master.get('movies').serialize(),
    { 0: [ '@', 'movieB' ], 1: [ '@', 'movieC' ] },
    'list of movies is corect on master'
  )
  t.same(
    branch1.get('movies').serialize(),
    { 0: [ '@', 'movieB' ], 1: [ '@', 'movieC' ] },
    'list of movies is corect on branch1'
  )

  const branch2 = branch1.create({
    id: 'branch2',
    movieB: {
      favourite: true
    }
  })

  const branch3 = branch1.create({
    id: 'branch3',
    movieC: {
      progress: 0.3
    }
  })

  const branch4 = branch3.create({
    id: 'branch4',
    movieB: {
      favourite: false
    }
  })

  master.set({
    movieA: {
      year: 2004,
      imdb: 7.5,
      title: 'The Edukators'
    },
    movies: {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    }
  })

  branch1.set({
    movieB: {
      progress: 0.1
    }
  })

  branch2.set({
    movieC: {
      progress: 0.4
    }
  })

  branch3.set({
    movieA: {
      favourite: true
    }
  })

  t.same(
    master.get('movies').serialize(),
    {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    },
    'list of movies is corect on master'
  )
  t.same(
    branch1.get('movies').serialize(),
    {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    },
    'list of movies is corect on branch1'
  )
  t.same(
    branch2.get('movies').serialize(),
    {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    },
    'list of movies is corect on branch2'
  )
  t.same(
    branch3.get('movies').serialize(),
    {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    },
    'list of movies is corect on branch3'
  )
  t.same(
    branch4.get('movies').serialize(),
    {
      0: [ '@', 'movieA' ],
      1: [ '@', 'movieB' ],
      2: [ '@', 'movieC' ]
    },
    'list of movies is corect on branch4'
  )

  t.equals(
    branch1.get([ 'movies', '0', 'favourite' ]), void 0,
    'branch1 movieA favourite undefined'
  )
  t.equals(
    branch1.get([ 'movies', '1', 'progress' ]).compute(), 0.1,
    'branch1 movieB progress 0.1'
  )
  t.equals(
    branch1.get([ 'movies', '2', 'progress' ]).compute(), 0.2,
    'branch1 movieC progress 0.2'
  )
  t.equals(
    branch2.get([ 'movies', '0', 'favourite' ]), void 0,
    'branch2 movieA favourite undefined'
  )
  t.equals(
    branch2.get([ 'movies', '1', 'favourite' ]).compute(), true,
    'branch2 movieB favourite true'
  )
  t.equals(
    branch2.get([ 'movies', '2', 'favourite' ]).compute(), true,
    'branch2 movieC favourite true'
  )
  t.equals(
    branch2.get([ 'movies', '2', 'progress' ]).compute(), 0.4,
    'branch2 movieC progress 0.4'
  )
  t.equals(
    branch3.get([ 'movies', '0', 'favourite' ]).compute(), true,
    'branch3 movieA favourite true'
  )
  t.equals(
    branch3.get([ 'movies', '1', 'progress' ]).compute(), 0.1,
    'branch3 movieB progress 0.1'
  )
  t.equals(
    branch3.get([ 'movies', '1', 'favourite' ]), void 0,
    'branch3 movieB favourite undefined'
  )
  t.equals(
    branch3.get([ 'movies', '2', 'progress' ]).compute(), 0.3,
    'branch3 movieC progress 0.3'
  )
  t.equals(
    branch3.get([ 'movies', '2', 'favourite' ]).compute(), true,
    'branch3 movieC favourite true'
  )
  t.equals(
    branch4.get([ 'movies', '0', 'favourite' ]).compute(), true,
    'branch4 movieA favourite true'
  )
  t.equals(
    branch4.get([ 'movies', '1', 'favourite' ]).compute(), false,
    'branch4 movieB favourite false'
  )
  t.equals(
    branch4.get([ 'movies', '2', 'progress' ]).compute(), 0.3,
    'branch4 movieC progress 0.3'
  )

  t.end()
})

test('reference from another branch', t => {
  const master1 = create({
    deep: {
      real: 'thing'
    }
  })

  try {
    const master2 = create()

    master2.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  const branch1 = master1.create({
    deep: null
  })

  try {
    const branch2 = branch1.create()

    branch2.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  t.end()
})

test('ignore same reference in branch', t => {
  const master = create({
    real1: 'thing1',
    real2: 'thing2',
    pointer: [ '@', 'real1' ]
  })

  const branch1 = master.create({
    pointer: [ '@', 'real1' ]
  })

  master.get('pointer').set([ '@', 'real2' ])

  t.equals(
    branch1.get('pointer').compute(),
    'thing2',
    'branch1.pointer.compute() = thing2'
  )

  t.end()
})
