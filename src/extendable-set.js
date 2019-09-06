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

  * [Symbol.iterator] () {
    if (this.inherits) {
      yield * this.inherits
    }
    yield * super[Symbol.iterator]()
  }

  forEach (cb) {
    if (this.inherits) {
      this.inherits.forEach(cb)
    }
    super.forEach(cb)
  }

  updateInheritance (inherits) {
    if (this.inherits) {
      this.inherits.extenders.delete(this)
    }
    if (inherits) {
      inherits.forEach(value => {
        if (!super.delete(value) && this.extenders.size) {
          this.deleteFromExtenders(value)
        }
      })
      inherits.extenders.add(this)
    }
    this.inherits = inherits
  }
}
