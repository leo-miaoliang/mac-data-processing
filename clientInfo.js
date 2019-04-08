const parse = require('csv-parse/lib/sync')
const fs = require('fs')

function getClientInfo (file) {
  const data = fs.readFileSync(file).toString()
  const records = parse(data, {
    columns: true,
    skip_empty_lines: true,
    cast: function (value, context) {
      if (typeof context.column === 'number') {
        return value.toLowerCase().trim().replace(/\s/g, '_')
      } else {
        if (context.column === 'apparatus_link') {
          return value === '是'
        } else if (context.column === 'valid_data') {
          return value === '1'
        } else if (context.column === 'client_time_start') {
          return new Date(value)
        } else if (context.column === 'client_time_end') {
          return new Date(value)
        }
        return value
      }
    }
  })
  return records
}

// const list = getClientInfo(__dirname + '/data/client_info.csv')
// const time = new Date('2018-12-20T07:10:00.000Z')
// let find = list.find(t => t.client_id === '00de62b2' && t.client_time_start <= time && t.client_time_end >= time)

// if(find){
//   console.log(find)
// }else{
//   console.log('not')
// }

module.exports = {
  getClientInfo
}
