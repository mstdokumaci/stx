import { create, createPersist, Leaf } from './leaf'
import { defineApi } from './api'
import { createStamp } from './stamp'

defineApi(Leaf.prototype)

export {
  create,
  createPersist,
  createStamp
}
