const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')

const getTmpFilePath = (filename) => {
  return path.join(path.resolve('./tmp/'), filename)
}

const getOutputText = (data, ifUndefined = '', prefixData = '') => {
  if (data !== undefined) {
    return prefixData + data
  } else {
    return ifUndefined
  }
}

const exportPDF = (json,pdfName) => {
  const doc = new PDFDocument({size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 210}})
  const writeStream = fs.createWriteStream(path.join(path.resolve('./output/'), `${pdfName}.pdf`), {encoding: 'utf8'})
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', calendar: 'buddhist'}
  const contOptions = { continued: true, baseline: 'alphabetic' }
  doc.pipe(writeStream)
  doc.registerFont('Kanit', path.join(path.resolve('./src/fonts/'),'Kanit-Regular.ttf'))
  doc.font('Kanit')
  doc.fontSize(10).text('Timestamp: ', 70, 20, contOptions).fontSize(12).text(`${json['ประทับเวลา'].toLocaleDateString('th-TH', dateOptions)} - ${json['ประทับเวลา'].toLocaleTimeString('th-TH')} น.`, { baseline: 'alphabetic'})
  doc.fontSize(10).text('ผู้สำรวจ: ', contOptions).fontSize(12).text(json['ผู้สำรวจ'])
  doc.fontSize(10).text('วันที่สัมภาษณ์: ', contOptions).fontSize(12).text(json['วันที่สัมภาษณ์'].toLocaleDateString('th-TH', dateOptions))
  doc.moveDown(0.5)
  doc.fontSize(10).text('ชื่อร้านค้า: ', contOptions).fontSize(12).text(json['ชื่อร้านค้า'])
  doc.fontSize(10).text('ประเภทธุรกิจ: ', contOptions).fontSize(12).text(`${json['ประเภทธุรกิจ']} - ${json['กลุ่มธุรกิจ']}`)
  doc.fontSize(10).text('แนวโน้มธุกิจของท่านในปัจจุบันเทียบกับปีที่ผ่านมา: ', contOptions).fontSize(12).text(json['แนวโน้มธุกิจของท่านในปัจจุบันเทียบกับปีที่ผ่านมา'])
  doc.fontSize(10).text('ที่อยู่: ', contOptions).fontSize(12).text( getOutputText(json['ที่อยู่บ้านเลขที่']), contOptions)
    .text(getOutputText(json['หมู่ (ถ้าไม่มีหมู่ ให้ใช้สัญลักษณ์:  - )'], '', ' หมู่ '), contOptions)
    .text(getOutputText(json['ถนน'], '', ' ถนน '))
  doc.fontSize(12).text(getOutputText(json['ตำบล']), contOptions) 
    .text(getOutputText(json['อำเภอ'], '', ' '), contOptions) 
    .text(getOutputText(json['จังหวัด'], '', ' '))
  doc.fontSize(10).text('GPS: ', contOptions).fontSize(12).text(getOutputText(json['GPS(Lat,Long)_1']))
  doc.moveDown(0.5)
  doc.fontSize(10).text('เจ้าของกิจการ: ', contOptions).fontSize(12).text(getOutputText(json['ชื่อ-สกุลเจ้าของกิจการ']))
  doc.fontSize(10).text('เพศ: ', contOptions).fontSize(12).text(json['เพศ'], contOptions)
    .fontSize(10).text('  อายุ: ', contOptions).fontSize(12).text(json['อายุ'])
  doc.fontSize(10).text('เบอร์มือถือ: ', contOptions).fontSize(12).text(json['เบอร์มือถือ (ไม่ต้องวรรคหรือขีด เช่น 0812345678)'])
  doc.fontSize(10).text('กลุ่มลูกค้า: ', contOptions).fontSize(12).text(json['กลุ่มลูกค้า'])
  doc.fontSize(10).text('จำนวนรถกระบะที่ใช้ในกิจการ: ', contOptions).fontSize(12).text(json['จำนวนรถที่ใช้ในกิจการ: จำนวนรถกระบะ(คัน)'])
  doc.fontSize(10).text('จำนวนรถบรรทุกที่ใช้ในกิจการ: ', contOptions).fontSize(12).text(json['จำนวนรถที่ใช้ในกิจการ: จำนวนรถบรรทุก(คัน)'])
  doc.fontSize(10).text('รถบรรทุกในครอบครอง [ISUZU]: ', contOptions).fontSize(12).text(getOutputText(json['รถบรรทุกในครอบครอง [ISUZU]'],'-'))
  doc.fontSize(10).text('รถบรรทุกในครอบครอง [HINO]: ', contOptions).fontSize(12).text(getOutputText(json['รถบรรทุกในครอบครอง [HINO]'], '-'))
  doc.fontSize(10).text('รถบรรทุกในครอบครอง [FUSO]: ', contOptions).fontSize(12).text(getOutputText(json['รถบรรทุกในครอบครอง [FUSO]'], '-'))
  doc.fontSize(10).text('รถบรรทุกในครอบครอง [UD]: ', contOptions).fontSize(12).text(getOutputText(json['รถบรรทุกในครอบครอง [UD]'], '-'))
  doc.fontSize(10).text('รถบรรทุกในครอบครอง [อื่นๆ]: ', contOptions).fontSize(12).text(getOutputText(json['รถบรรทุกในครอบครอง [อื่นๆ]'], '-'))
  doc.fontSize(10).text('คำอธิบายรถในครอบครอง: ', contOptions).fontSize(12).text(getOutputText(json['คำอธิบายรถในครอบครอง ']))
  if (json['ท่านมีโครงการจะซื้อรถบรรทุกเพิ่มหรือไม่'] === 'มี (ระบุรุ่นที่สนใจในข้อถัดไป)') {
    doc.moveDown(0.5)
    doc.fontSize(12).text('มีโครงการจะซื้อรถบรรทุกเพิ่ม', { baseline: 'alphabetic' })
    doc.fontSize(10).text('ระยะเวลาที่จะต้องการออกรถ: ', contOptions).fontSize(12).text(json['ระยะเวลาที่จะต้องการออกรถ'])
    doc.fontSize(10).text('รุ่นที่สนใจ: ', contOptions).fontSize(12).text(json['รุ่นที่สนใจ'])
    doc.fontSize(10).text('ยี่ห้อที่สนใจซ ', contOptions).fontSize(12).text(json['ยี่ห้อที่สนใจ'])
    doc.fontSize(10).text('เหตุผลที่ต้องการเพิ่มรถ: ', contOptions).fontSize(12).text(json['เหตุผลที่ต้องการเพิ่มรถ'])
    if (json['ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก'] !== undefined) 
      doc.fontSize(10).text('ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก: ', contOptions).fontSize(12).text(json['ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก'])
    if (json['ท่านมีญาติ/คนรู้จักที่มีโครงการซื้อรถบรรทุก (ถ้ามีโปรดระบุชื่อ และเบอร์โทร)'] === 'มี') {
      if(json['ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก'] !== undefined) doc.moveDown(0.5)
      doc.fontSize(10).text('ท่านมีญาติ/คนรู้จักที่มีโครงการซื้อรถบรรทุก: ', contOptions).fontSize(12).text(getOutputText(json['ชื่อ เบอร์ติดต่อ']))
    }
  }
  doc.image(getTmpFilePath(`${json['GPS(Lat,Long)']}.jpg`), 360, 40, {
    fit: [200, 280],
    align: 'center',
    valign: 'center'
  })
  if (json['ท่านมีโครงการจะซื้อรถบรรทุกเพิ่มหรือไม่'] === 'มี (ระบุรุ่นที่สนใจในข้อถัดไป)') {
    doc.addPage({size: 'A4', margins: { top: 50, bottom: 50, left: 50 }})
    doc.fontSize(12).text('รูปออกเยี่ยม', { baseline: 'alphabetic' })
    json['อัพโหลดรูปออกเยี่ยม'].forEach((el, index) => {
      doc.image(getTmpFilePath(`${el}.jpg`), 70+((index%2)*250), 70+(Math.floor(index/2)*240), {
        fit: [220, 180],
        align: 'center',
        valign: 'top'
      })
    });
  } else {
    doc.moveDown(1)
    doc.fontSize(12).text('รูปออกเยี่ยม', { baseline: 'alphabetic' })
    json['อัพโหลดรูปออกเยี่ยม'].forEach((el, index) => {
      doc.image(getTmpFilePath(`${el}.jpg`), 70+((index%2)*250), 420+(Math.floor(index/2)*190), {
        fit: [220, 180],
        align: 'center',
        valign: 'top'
      })
    });
  }
  doc.end()
}

module.exports = { exportPDF }