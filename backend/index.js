const { excel, general, pdf, googleService } = require('./src/helpers')

const getData = async (token) => {
  const filename = await googleService.exportFile(token, 'MS Excel')
  const rawSheet = await excel.getJSON(filename)
  const sheet = await excel.filterUrlToId(rawSheet)
  general.writeJSON(sheet, `${filename}.json`)
  sheet.forEach((json) => {
    const sc = json['ผู้สำรวจ']
    const business = json['ชื่อร้านค้า']
    pdf.exportPDF(json, `${filename}_${sc}-${business}`)
  })
}

getData('1w-NqCbRhMnaKs_phNEMt3ia8w8KAp563TFX3Q89VRtQ')