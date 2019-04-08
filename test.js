const fs = require('fs')
const path = '/Users/beaulizhu/Desktop/es-json-rg'

const lines = fs.readFileSync(path).toString().split('\n')
let index = 0
for (let l of lines) {
  try {
    if (l) {
      const tmp = JSON.parse(l)
    }
  } catch (ex) {
    console.error(index, l)
    throw ex
  }

  index++
}

console.log('OK')
