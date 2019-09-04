export default class ExtendableSet extends Set {
  constructor (inherits) {
    super()
    this.extenders = new Set()
    if (inherits) {
      this.inherits = inherits
      this.inherits.extenders.add(this)
    }
  }

  has (value) {
    return super.has(value) || (this.inherits && this.inherits.has(value))
  }

  deleteFromExtenders (value) {
    this.extenders.forEach(extender => {
      if (!extender.delete(value)) {
        extender.deleteFromExtenders(value)
      }
    })
  }

  add (value) {
    if (!this.has(value)) {
      super.add(value)
      if (this.extenders.size) {
        this.deleteFromExtenders(value)
      }
    }
  }

  // keep this out until buble can handle
  // * [Symbol.iterator] () {
  //   if (this.inherits) {
  //     yield * this.inherits
  //   }
  //   yield * super[Symbol.iterator]()
  // }

  forEach (cb) {
    if (this.inherits) {
      this.inherits.forEach(cb)
    }
    super.forEach(cb)
  }

  updateInheritance (inherits) {
    super.forEach(item => {
      if (inherits.has(item)) {
        super.delete(item)
      }
    })
    if (this.inherits) {
      this.inherits.extenders.delete(this)
    }
    this.inherits = inherits
    inherits.extenders.add(this)
  }
}
