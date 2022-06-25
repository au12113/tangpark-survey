const { excel, general, pdf, googleService } = require('./src/helpers')
const { fileIdList } = require('./src/masters')

global.__basedir = __dirname

global.__argv = require('yargs/yargs')(process.argv.slice(2))
  .alias('m', 'mode')
  .describe('m', 'choose type of survey')
  .choices('m', ['potential', 'mapping'])
  .alias('s', 'separate')
  .describe('s', 'choose separate by file or by month')
  .choices('s', ['file', 'month'])
  .alias('t', 'datetag')
  .describe('t', 'add date in report name')
  .boolean('t')
  .alias('d', 'debug')
  .describe('d', 'write processing data to tmp folder.')
  .boolean('d')
  .help('help')
  .argv

const getPDFName = (json) => {
  const mode = __argv['mode']
  switch(mode) {
    case 'potential':
      const branch = json['สาขาที่ออกเยี่ยม']
      if('ชื่อบริษัท' in json) {
        const group = json['คำนำหน้าบริษัท'].trim()+json['ชื่อบริษัท'].trim()
        return `[${branch}]${group}`
      } else if('ชื่อกลุ่ม และ/หรือหัวหน้ากลุ่ม' in json) {
        const group = json['ชื่อกลุ่ม และ/หรือหัวหน้ากลุ่ม'].trim()
        const name = json['ชื่อลูกค้า '].trim()
        return `[${branch}](${group})${name}`
      } else {
        const name = json['ชื่อลูกค้า ']
        return `[${branch}]()${name}`
      }
    case 'mapping':
      const d = json['วันที่สัมภาษณ์']
      const surveyDate = `${d.getFullYear()+543}-${("0" + (d.getMonth()+1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`
      const sc = json['ผู้สำรวจ']
      const business = json['ชื่อร้านค้า']
      return `${surveyDate}_${sc}-${business}`
    default:
      console.log("available options is [ 'potential', 'mapping' ]")
  }
}

const getData = async (token, timestampName) => {
  const filename = await googleService.exportFile(token, 'MS Excel')
  const rawSheet = await excel.getJSON(filename, timestampName)
  if (rawSheet) {
    const sheet = await excel.filterUrlToId(rawSheet)
    if (__argv['debug']) {
      await general.writeJSON(sheet, `${filename}.json`)
      await excel.writeExcel(sheet, `${filename}.xlsx`)
    }
    if (__argv['mode'] === 'potential') {
      await excel.writeExcel(sheet, `${filename}.xlsx`, 'potentialExcel')
      await sheet.forEach(async(json) => {
        pdf.exportSimplePDF(json, getPDFName(json), `potentialPDF/${filename}`)
      })
    } else if (__argv['mode'] === 'mapping') {
      await sheet.forEach((json) => {
        pdf.exportPDF(json, getPDFName(json), `mapping/${filename}`)
      })
    }
  }
}

fileIdList[__argv['mode']].forEach((el) => {
  getData(el.fileId, el.timestampName)
})