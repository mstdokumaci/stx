import { create, Leaf } from './leaf'
import { defineApi } from './api'
import { createStamp } from './stamp'

defineApi(Leaf.prototype)

export { create, createStamp }
