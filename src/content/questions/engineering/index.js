const docs = require.context('./', false, /\.md$/)

const map = {}
docs.keys().forEach((key) => {
  map[key.slice(2, -3)] = docs(key)
})

export default map
