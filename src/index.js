import { create, Leaf } from './leaf'
import { defineApi, define, bulkSet } from './api'
import { createStamp } from './stamp'

defineApi(Leaf.prototype)

export {
  create,
  createStamp,
  define,
  bulkSet
}
