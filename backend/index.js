const { excel, general, pdf, googleService } = require('./src/helpers')
const { fileIdList } = require('./src/masters')

global.__basedir = __dirname

global.__argv = require('yargs/yargs')(process.argv.slice(2))
  .alias('m', 'mode')
  .describe('m', 'choose type of survey')
  .choices('m', ['potential', 'mapping'])
  .alias('d', 'date')
  .describe('d', 'specify date to make report')
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
        return `[${branch}]${group.trim().replace(/[\\\/]/gi, '')}`
      } else if('ชื่อกลุ่ม และ/หรือหัวหน้ากลุ่ม' in json) {
        const group = json['ชื่อกลุ่ม และ/หรือหัวหน้ากลุ่ม'].trim()
        const name = json['ชื่อลูกค้า '].trim()
        return `[${branch}](${group.replace(/[\\\/]/gi, '')})${name.replace(/[\\\/]/gi, '')}`
      } else {
        const name = json['ชื่อลูกค้า '].trim()
        return `[${branch}]()${name.replace(/[\\\/]/gi, '')}`
      }
    case 'mapping':
      const d = json['วันที่สัมภาษณ์']
      const surveyDate = `${d.getFullYear()+543}-${("0" + (d.getMonth()+1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`
      const sc = json['ผู้สำรวจ']
      const business = json['ชื่อร้านค้า']
      const customer = json['ชื่อ-สกุลเจ้าของกิจการ']
      return `${surveyDate}_${sc}-${business}-${customer}`
    default:
      console.log("available options is [ 'potential', 'mapping' ]")
  }
}

const getData = async (token, timestampName) => {
  const filename = await googleService.exportFile(token, 'MS Excel')
  const rawSheet = await excel.getJSON(filename, timestampName)
  if (rawSheet) {
    const jsonSheet = await excel.filterUrlToId(rawSheet)
    if (__argv['debug']) {
      await general.writeJSON(jsonSheet, `${filename}.json`)
      await excel.writeExcel(jsonSheet, `${filename}.xlsx`)
    }
    if (__argv['mode'] === 'potential') {
      const splited = await general.splitJsonSheet(jsonSheet)
      Object.keys(splited).forEach((branch) => {
        Object.keys(splited[branch]).forEach(async(date) => {
          await excel.writeExcel(splited[branch][date], `${branch}_${date}_${__argv['mode']}.xlsx`, 'potentialExcel')
        })
      })
      // await jsonSheet.forEach(async(json) => {
      //   const surveyDate = json['วันที่ออกเยี่ยม']
      //   const surveyMonth = `${surveyDate.getFullYear()+543}-${("0" + (surveyDate.getMonth()+1)).slice(-2)}`
      //   pdf.exportSimplePDF(json, getPDFName(json), `${filename}/${surveyMonth}`)
      // })
    } else if (__argv['mode'] === 'mapping') {
      await jsonSheet.forEach((json) => {
        const surveyDate = json['วันที่สัมภาษณ์']
        const surveyMonth = `${surveyDate.getFullYear()+543}-${("0" + (surveyDate.getMonth()+1)).slice(-2)}`
        pdf.exportPDF(json, getPDFName(json), `mapping/${surveyMonth}/${filename}`)
      })
    }
  }
}

fileIdList[__argv['mode']].forEach((el) => {
  getData(el.fileId, el.timestampName)
})