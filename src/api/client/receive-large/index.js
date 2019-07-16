import maxSize from '../../server/max-size'

const bufferArray = []

export default data => new Promise(resolve => {
  bufferArray.push(Buffer.from(data).toString('utf8'))
  if (data.byteLength < maxSize) {
    resolve(bufferArray.splice(0).join(''))
  } else {
    resolve()
  }
})
