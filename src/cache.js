const arrays = {}
const strings = {}

const addToArrays = (id, arr) => {
  if (arrays[id]) {
    return true
  } else {
    arrays[id] = arr
  }
}

const getArray = id => {
  return arrays[id]
}

const addToStrings = (id, str) => {
  if (!strings[id]) {
    strings[id] = str
  }
}

const getString = id => {
  return strings[id]
}

export { addToArrays, getArray, addToStrings, getString }
