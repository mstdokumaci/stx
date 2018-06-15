import maxSize from '../../server/max-size'

let bufferArray = false

export default data => new Promise(resolve => {
  if (!bufferArray) bufferArray = []
  bufferArray.push(Buffer.from(data).toString('utf8'))
  if (data.byteLength < maxSize) {
    resolve(bufferArray.join(''))
    bufferArray = false
  } else {
    resolve()
  }
})
