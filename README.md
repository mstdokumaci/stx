# brisky
<!-- VDOC.badges travis; standard; npm; coveralls -->
<!-- DON'T EDIT THIS SECTION (including comments), INSTEAD RE-RUN `vdoc` TO UPDATE -->
[![Build Status](https://travis-ci.org/vigour-io/brisky.svg?branch=master)](https://travis-ci.org/vigour-io/brisky)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/brisky.svg)](https://badge.fury.io/js/brisky)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/brisky/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/brisky?branch=master)

<!-- VDOC END -->
Brisky is a lightning fast universal JS library for building state driven user interfaces.

It consist of multiple sub-modules, each module adding specific funcitonality
- [brisky-events](https://github.com/vigour-io/brisky-events)
- [brisky-class](https://github.com/vigour-io/brisky-class)
- [brisky-style](https://github.com/vigour-io/brisky-style)
- [brisky-props](https://github.com/vigour-io/brisky-props)
- [brisky-focus](https://github.com/vigour-io/brisky-focus)
- [brisky-core](https://github.com/vigour-io/brisky-core)

Find and create functional examples in [our example repo](https://github.com/vigour-io/brisky-examples).

## Examples

#### Simple

First, let's start by displaying two DOM elements with `hello` and `world` as their content:

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({})

const element = {
  container1: {
    text: 'Hello'
  },
  container2: {
    text: 'World!'
  }
}

document.body.appendChild(render(element, state))
```

Notice that the object containing the content can be named anything, as long as you camelCase it, just like a normal JavaScript object. In this example `container1` and `container2` is used.

---

#### State driven

Here we are setting the state `object`, containing `hello` and `world`.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  object: {
    hello: 'Hello',
    world: 'World!'
  }
})

const element = {
  $: 'object',
  container1: {
    text: {
      $: 'hello'
    }
  },
  container2: {
    text: {
      $: 'world'
    }
  }
}

document.body.appendChild(render(element, state))
```

Notice the `$:` notation. In the above example, we subscribe to `object`. This means that whenever `object` changes, our two DOM-elements are updated with the new content.

Also notice the nested nature of subscriptions. The two containers inside are scoped from within `object`, allowing them to grab `hello` and `world` directly.

---

#### `tag`

The tag field allows you to render normal DOM elements. By default, every object you render to the DOM is a `div`. You change this by defining a `tag` type, e.g. `tag: 'section'`.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({})

const element = {
  title: {
    tag: 'h1',
    text: 'I am a title'
  },
  paragraph: {
    tag: 'p',
    text: 'I am a paragraph'
  },
  canvas: {
    tag: 'canvas',
    text: 'I am a canvas',
    props: {
      id: 'canvas',
      width: '150',
      height: '150'
    }
  }
}

document.body.appendChild(render(element, state))
```

---

#### `props`

Extending from the example above, we have props. These allow you to set and manipulate the different attributes in a tag.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  canvas: {
    width: 150,
    height: 150
  }
})

const element = {
  canvas: {
    $: 'canvas',
    tag: 'canvas',
    text: 'I am a canvas',
    props: {
      id: 'canvas',
      width: { $: 'width' },
      height: { $: 'height' }
    }
  }
}

document.body.appendChild(render(element, state))
```

---

#### Modifying state

In this example we have an input field that overwrites state when enter is pressed. We are using [brisky-events](https://github.com/vigour-io/brisky-events) to make this happen.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  username: 'John Doe'
})

const element = {
  input: {
    tag: 'input',
    props: { placeholder: 'Enter username' },
    on: {
      enter: (e, stamp) => {
        e.state.root.set({ username: e.target.value }, stamp)
        e.target.value = '' // Reset input field
      }
    }
  }
}

document.body.appendChild(render(element, state))
```

---

#### Using normal JavaScript inside Brisky

In this example we have a DOM element with a 'current-time' class, displaying the time when in hours and minutes. Notice that a function can be hoisted outside the scope - this is just normal JS.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({})

const element = {
  currentTime: {
    class: 'current-time',
    text: {
      $transform: data => {
        const time = new Date().getTime();
        const hours = formatTime(time.getHours())
        const minutes = formatTime(time.getMinutes())

        return `${hours}:${minutes}`
      }
    }
  }
}

function formatTime (value) {
  return (value < 10 ? `0${value}` : value)
}

document.body.appendChild(render(element, state))
```

---

#### `$transform`

Using transform, you are able to take something from state, and manipulate your element based on it. In this example we have a counter that displays amount of todos left, counting the amount of todos in our state.

This is inherited from [vigour-observable](https://github.com/vigour-io/brisky-observable).

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  todos: [
    { text: 'Finish todo' },
    { text: 'Rule the world' },
  ]
})

const element = {
  $: 'todos',
  counter: {
    text: {
      $: true,
      $transform: state => {
        var count = 0
        state.each(item => {
          count++
        })
        return `${count} items left`
      }
    }
  }
}

document.body.appendChild(render(element, state))
```

---

#### `test`

Good practice entails not rendering something that isn't needed for the user. Brisky facilitates this by giving you the `test` field.

Here we only render `donaldsSecretBunker` if the username is `Donald`

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  username: 'Donald'
})

const element = {
  $: '$test',
  $test: state => {
    const username = state.root.username.compute()
    if (username === 'Donald') {
      return true
    }
    return false
  },
  donaldsSecretBunker: {
    contentInsideBobsBunker: {
      text: 'Secret message for Donald'
    }
  }
}

document.body.appendChild(render(element, state))
```

To extend from this, you can subscribe to test multiple things in the state. A normal use-case could be when you subscribe to something specific, like we do here with `username`:

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  username: 'Donald',
  defconWarningLevel: '3'
})

const element = {
  donaldsSecretBunker: {
    $: 'username.$test',
    $test: {
      val: state => {
        const username = state.root.username.compute()
        if (username === 'Donald') {
          return true
        }
        return false
      },
      $: {
        $root: { defconWarningLevel: true }
      }
    },
    contentInsideBobsBunker: {
      text: 'Secret message for Donald'
    }
  }
}

document.body.appendChild(render(element, state))
```

---

#### `switch`

The switch simply switches content based on the value it is subscribing to. You can use the switch to change content within a component or on an application level, switching out whole pages.

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({
  current: 'home'
})

const element = {
  $: 'current.$switch',
  $switch: state => state.compute() ? 'home' : 'profile',
  properties: {
    home,
    profile
  }
}

const home = {
  text: 'This is the default page'
}

const profile = {
  text: 'This is the profile page'
}

document.body.appendChild(render(element, state))
```

---

#### `fragment`

The fragment resembles the behavior of [DocumentFragment](https://developer.mozilla.org/en/docs/Web/API/DocumentFragment). For an comparative example of document fragment implementation, see [JavaScript DocumentFragment](https://davidwalsh.name/documentfragment).

> Using DocumentFragments is faster than repeated single DOM node injection and allows developers to perform DOM node operations (like adding events) on new elements instead of mass-injection via innerHTML.  Keep DocumentFragment close by when performing lots of DOM operations -- it could speed up your app considerably!

```js
const render = require('brisky/render')
const s = require('vigour-state/s')

const state = s({})

const element = {
  container: {
    tag: 'fragment'
  }
}

document.body.appendChild(render(element, state))
```
