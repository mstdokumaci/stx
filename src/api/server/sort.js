import { getByPath } from '../get'
import { compute } from '../compute'

const numberSortAsc = (branch, path) => (key1, key2) => {
  const leaf1 = branch.leaves[getByPath(branch, key1, path)]
  const leaf2 = branch.leaves[getByPath(branch, key2, path)]
  return (leaf1 && compute(branch, leaf1)) - (leaf2 && compute(branch, leaf2))
}

const numberSortDesc = (branch, path) => (key1, key2) => {
  const leaf1 = branch.leaves[getByPath(branch, key1, path)]
  const leaf2 = branch.leaves[getByPath(branch, key2, path)]
  return (leaf2 && compute(branch, leaf2)) - (leaf1 && compute(branch, leaf1))
}

const stringSortAsc = (branch, path) => (key1, key2) => {
  const leaf1 = branch.leaves[getByPath(branch, key1, path)]
  const leaf2 = branch.leaves[getByPath(branch, key2, path)]
  return String(leaf1 && compute(branch, leaf1))
    .localeCompare(String(leaf2 && compute(branch, leaf2)))
}

const stringSortDesc = (branch, path) => (key1, key2) => {
  const leaf1 = branch.leaves[getByPath(branch, key1, path)]
  const leaf2 = branch.leaves[getByPath(branch, key2, path)]
  return String(leaf2 && compute(branch, leaf2))
    .localeCompare(String(leaf1 && compute(branch, leaf1)))
}

export {
  numberSortAsc,
  numberSortDesc,
  stringSortAsc,
  stringSortDesc
}
