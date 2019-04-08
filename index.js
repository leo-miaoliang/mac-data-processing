const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const clientInfo = require('./clientInfo')

const mac_csv = require('./mac_csv')

const INPUTBASEPATH = process.env.INPUT_BASE_PATH
const OUTPUTBASEPATH = process.env.OUTPUT_BASE_PATH
const CLIENTINFOBASEPATH = process.env.CLIENTINFO_BASE_PATH
const STARTDATE = process.env.START_DATE

const macAddrFile = path.join(__dirname, './mac.json')

function getMacMap (file) {
  const lines = fs.readFileSync(macAddrFile).toString().split('\n')
  const result = {}
  for (let l of lines) {
    if (l) {
      const tmp = JSON.parse(l)
      result[tmp.address.toUpperCase()] = tmp.company
    }
  }
  return result
}

const macAddresses = getMacMap(macAddrFile)

let clientInfos = []

function getCompany (mac) {
  if (mac) {
    const prefix = mac.substring(0, 8).replace(/:/g, '-').toUpperCase()
    return macAddresses[prefix] || null
  } else {
    return null
  }
}

function start (startDate) {
  const startDir = path.join(INPUTBASEPATH, startDate)
  const outputDir = path.join(OUTPUTBASEPATH, startDate)
  const outputFile = path.join(outputDir, 'es-json')
  const csvoutputFile = path.join(outputDir, 'mac.csv')

  clientInfos = clientInfo.getClientInfo(path.join(CLIENTINFOBASEPATH, startDate, 'client_info.csv'))
  console.log('output file >>>>', outputFile)
  if (!fs.existsSync(outputDir)) {
    mkdirp.sync(outputDir)
  }
  const csv = new mac_csv(csvoutputFile)
  const allFiles = getFiles(startDir)

  let fileIndex = 0
  for (let file of allFiles) {
    console.log('parse file start >>>', file)
    const jsons = parseFile(file)
    const esDatas = []
    for (let json of jsons) {
      esDatas.push(convertToESFormat(json, startDate.replace(/-/g, '.')))
      csv.convertToCsvFormat(json)
    }
    if (esDatas.length > 0) {
      fs.appendFileSync(outputFile + '-' + fileIndex, esDatas.join('\n'))
      fs.appendFileSync(outputFile + '-' + fileIndex, '\n')
      fileIndex++
    }
    console.log('parse file end >>>', file)
  }
  csv.writer.end()
}

function parseFile (file) {
  const result = []
  const lines = fs.readFileSync(file).toString().split('\n')
  for (let l of lines) {
    l && result.push(...parseLine(l, file))
  }

  return result
}
function getFiles (dir) {
  const result = []
  const files = fs.readdirSync(dir)
  for (let f of files) {
    const fullFileName = path.join(dir, f)
    const stats = fs.statSync(fullFileName)
    if (stats.isDirectory()) {
      result.push(...getFiles(fullFileName))
    } else {
      result.push(fullFileName)
    }
  }
  return result
}

function parseLine (line, filePath) {
  let info
  try {
    info = JSON.parse(line)
  } catch (error) {
    console.log(error)
    return []
  }
  const time = new Date(info.time)
  const result = []
  let geoPoint = null
  if (info.lat && info.lon) {
    geoPoint = `${info.lat},${info.lon}`
  }
  if(!info.data){
    return result
  }
  for (let item of info.data) {
    result.push(tagData({
      file_path: filePath,
      client_id: info.id,
      client_mmac: info.mmac,
      client_rate: info.rate,
      client_time: time.toISOString(),
      client_geo: geoPoint,
      mac_company: getCompany(item.mac),
      tmc_company: getCompany(item.tmc),
      ...item
    }))
  }
  return result
}

function tagData (info) {
  if (clientInfos.length === 0) {
    return info
  }
  const time = new Date(info.client_time)

  let find = clientInfos.find(t => t.client_id === info.client_id && t.client_time_start <= time && t.client_time_end >= time)
  if (!find) {
    return info
  }
  info.category = find.organization_type
  info.address_name = find.name
  info.is_valid_data = find.valid_data
  if (find.data_range === '0') {
    if (info.range) {
      try {
        info.range = parseFloat(info.range)
        info.is_in_range = info.range < 30
      } catch (e) { console.error('convert range failed', info) }
    }
  } else {
    info.is_in_range = true
  }
  return info
}

let indexId = 0

function getIndexId () {
  return `${STARTDATE}_${indexId++}`
}

function convertToESFormat (item, date) {
  const jsonInfo = JSON.stringify(item)
  const indexInfo = {
    index: {
      _index: `macaddr-${date}`,
      _type: 'log',
      _id: getIndexId()
    }
  }
  const output = `${trim(JSON.stringify(indexInfo))}\n${trim(jsonInfo)}`
  return output
}

function trim (str) {
  return str.replace(/\r\n/g, '').replace(/\n/g, '')
}

// const text = '{"id":"00de62a0","data":[{"mac":"0c:f4:d5:31:29:a8","rssi":"-59","rssi1":"-60","rssi2":"-60","rssi3":"-61","tmc":"60:83:34:b7:4d:a4","router":"MCD-ChinaNet","range":"5.9"},{"mac":"ac:cf:23:95:cd:9d","rssi":"-78","rssi1":"-79","router":"SNSS-ACCF2395CD9C","range":"30.3"},{"mac":"60:83:34:b7:4d:a4","rssi":"-52","rssi1":"-53","rssi2":"-52","rssi3":"-52","ts":"MCD-ChinaNet","tmc":"0c:f4:d5:31:29:a8","tc":"N","range":"3.3"},{"mac":"58:66:ba:68:1f:d3","rssi":"-89","tmc":"b0:e2:35:70:1e:df","router":"!MoDuWiFi","range":"77.4"},{"mac":"b8:37:65:65:7c:e7","rssi":"-48","rssi1":"-46","rssi2":"-48","rssi3":"-47","tmc":"14:6b:9c:de:62:b7","router":"myphone","range":"2.3"},{"mac":"00:1c:c2:2f:a5:3c","rssi":"-62","rssi1":"-60","router":"AP-A53C","range":"7.7"},{"mac":"00:1c:c2:2f:a5:4c","rssi":"-74","router":"AP-A54C","range":"21.5"},{"mac":"14:6b:9c:de:62:b7","rssi":"-46","ts":"myphone","tmc":"b8:37:65:65:7c:e7","tc":"Y","range":"1.9"},{"mac":"14:6b:9c:de:62:b6","rssi":"-43","router":"DataSky_de62b7","range":"1.5"},{"mac":"00:1c:c2:2f:a9:3c","rssi":"-70","router":"AP-A93C","range":"15.3"},{"mac":"d0:d7:83:cb:fd:bf","rssi":"-53","rssi1":"-52","tmc":"f4:f5:db:d7:65:37","router":"myphone","range":"3.5"},{"mac":"c4:ca:d9:7e:57:b3","rssi":"-90","tmc":"14:1f:78:94:f7:a4","range":"84.3"}],"mmac":"14:6b:9c:de:62:a0","rate":"2","time":"Mon Dec 10 18:20:52 2018","lat":"","lon":""}'

// const result = parseLine(text)

// console.log(convertToESFormat(result[0], '2018-12-21'.replace(/-/g, '.')))
start(STARTDATE)
// parseFile('/Users/beaulizhu/Documents/workspace/uuabc/mac-data-process/data/2018-12-21/000001')
