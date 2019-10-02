const concatUint8Arrays = (uInt8ArrayArray) => {
  const totalLength = uInt8ArrayArray.reduce((total, uInt8Array) => total + uInt8Array.length, 0)
  const bigUint8Array = new Uint8Array(totalLength)
  let offset = 0
  uInt8ArrayArray.forEach(uInt8Array => {
    bigUint8Array.set(uInt8Array, offset)
    offset += uInt8Array.length
  })
  return bigUint8Array
}

export {
  concatUint8Arrays
}
