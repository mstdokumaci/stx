import { Struct } from './index'

const create = (val, stamp, source) => {
  const branch = new Struct(val, stamp, source)
  source.branches.push(branch)
}

export { create }
