const { excel, general, pdf, googleService } = require('./src/helpers')
const { fileIdList } = require('./src/masters')

const argv = require('yargs/yargs')(process.argv.slice(2))
  .alias('m', 'mode')
  .describe('m', 'choose type of survey')
  .choices('m', ['potential', 'mapping'])
  .help('help')
  .argv

const getPDFName = (json) => {
  const mode = argv['mode']
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
  try {
    const filename = await googleService.exportFile(token, 'MS Excel')
    const rawSheet = await excel.getJSON(filename, timestampName)
    if(rawSheet) {
      const sheet = await excel.filterUrlToId(rawSheet)
      await general.writeJSON(sheet, `${filename}.json`)
      await excel.writeExcel(sheet, `${filename}.xlsx`)
      if(argv['mode'] === 'potential') {
        sheet.forEach((json) => {
          pdf.exportSimplePDF(json, getPDFName(json), filename)
        })
      } else if(argv['mode'] === 'mapping') {
        sheet.forEach((json) => {
          pdf.exportPDF(json, getPDFName(json), filename)
        })    
      }
    }
  } catch (e) {
    console.log(e)
  }
}

fileIdList[argv['mode']].forEach((el) => {
  getData(el.fileId, el.timestampName)
})