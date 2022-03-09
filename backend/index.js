const { excel, general, pdf, googleService } = require('./src/helpers')
const { fileIdList } = require('./src/masters')

const getData = async (token, timestampName) => {
  const filename = await googleService.exportFile(token, 'MS Excel')
  const rawSheet = await excel.getJSON(filename, timestampName)
  const sheet = await excel.filterUrlToId(rawSheet)
  general.writeJSON(sheet, `${filename}.json`)
  excel.writeExcel(sheet, `${filename}.xlsx`)
  sheet.forEach((json) => {
    const d = json['วันที่สัมภาษณ์']
    const surveyDate = `${d.getFullYear()+543}-${("0" + (d.getMonth()+1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`
    const sc = json['ผู้สำรวจ']
    const business = json['ชื่อร้านค้า']
    pdf.exportPDF(json, `${surveyDate}_${sc}-${business}`)
  })
}

fileIdList.forEach((el) => {
  getData(el.fileId, el.timestampName)
})