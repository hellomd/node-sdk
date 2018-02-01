const times = (n, fn) => Array.from(Array(n)).map((_, i) => fn(i))
const sample = arr => arr[randomInt(arr.length - 1)]
const randomInt = (max = 100) => Math.floor(Math.random() * Math.floor(max))

module.exports = {
  times,
  sample,
  randomInt,
}
