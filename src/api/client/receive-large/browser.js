import maxSize from '../../server/max-size'

let blobArray = false

export default data => {
  if (!blobArray) blobArray = []
  blobArray.push(data)

  if (data.size < maxSize) {
    return Promise.all(blobArray.map(blob => new Promise((resolve, reject) => {
      const reader = new FileReader() // eslint-disable-line
      reader.addEventListener(
        'loadend',
        e => e.error ? reject(e.error) : resolve(reader.result),
        false
      )
      reader.readAsText(blob)
    })))
      .then(stringArray => {
        blobArray = false
        return stringArray.join('')
      })
  } else {
    return Promise.resolve()
  }
}
