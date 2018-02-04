export default function (obj, key, val) {
  Object.defineProperty(obj, key, { value: val, configurable: true })
}
