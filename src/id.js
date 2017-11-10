const root = 5381

const keyToId = (key, id = root) => {
  if (isFinite(key)) {
    key = parseFloat(key)
    const hash2 = (((id % root) + 127) * 11) ^ key
    id = id * 33 ^ key
    return (id >>> 0) * 4096 + (hash2 >>> 0)
  }
  let i = key.length
  let hash2 = (id % root) + 127
  while (i--) {
    const char = key.charCodeAt(i)
    id = (id * 33) ^ char
    hash2 = (hash2 * 11) ^ char
  }
  return (id >>> 0) * 4096 + (hash2 >>> 0)
}

const arrayToId = (arr) => {
  let hash1 = 127
  let hash2 = 709
  let i = arr.length
  while (i--) {
    hash1 = (hash1 * 33) ^ (arr[i] / 11 - 1)
    hash2 = (hash2 * 11) ^ (arr[i] / 33 - 1)
  }
  return (hash1 >>> 0) * 4096 + (hash2 >>> 0)
}

const pathToIds = (path, id = root) =>
  path.map(key => id = keyToId(key, id))

export { root, keyToId, arrayToId, pathToIds }
