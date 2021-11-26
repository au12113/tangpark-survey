const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')
const { parseSerialDateTime } = require('./general')

const getTmpFilePath = (filename) => {
  return path.join(path.resolve('./tmp/'), filename)
}

const exportPDF = (json,pdfName) => {
  const doc = new PDFDocument({size: 'A4'})
  const writeStream = fs.createWriteStream(path.join(path.resolve('./output/'), `${pdfName}.pdf`), {encoding: 'utf8'})
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', calendar: 'buddhist'}
  const timestamp = parseSerialDateTime(json['ประทับเวลา'])
  const surveyDate = parseSerialDateTime(json['วันที่สัมภาษณ์'])
  doc.pipe(writeStream)
  doc.registerFont('Kanit', path.join(path.resolve('./src/fonts/'),'Kanit-Regular.ttf'))
  doc.font('Kanit').fontSize(14)
  doc.text(`Timestamp: ${timestamp.toLocaleDateString('th-TH', dateOptions)} : ${timestamp.toLocaleTimeString('th-TH')}`, 100, 20)
  doc.text(`ผู้สำรวจ: ${json['ผู้สำรวจ']}`)
  doc.text(`วันที่สัมภาษณ์: ${surveyDate.toLocaleDateString('th-TH', dateOptions)}`)
  doc.text(`ชื่อร้านค้า: ${json['ชื่อร้านค้า']}`)
  doc.text(`ประเภทธุรกิจ: ${json['ประเภทธุรกิจ']} - ${json['กลุ่มธุรกิจ']}`)
  doc.text(`ที่อยู่: ${json['ที่อยู่บ้านเลขที่']} ${json['หมู่ (ถ้าไม่มีหมู่ ให้ใช้สัญลักษณ์:  - )']} ${json['ถนน']}`)
  doc.text(`${json['ตำบล']} ${json['อำเภอ']} ${json['จังหวัด']}`)
  doc.text(`GPS: ${json['GPS(Lat,Long)_1']}`)
  doc.text(`เจ้าของกิจการ: ${json['ชื่อ-สกุลเจ้าของกิจการ']}`)
  doc.text(`เพศ: ${json['เพศ']}  อายุ: ${json['อายุ']}`)
  doc.text(`เบอร์มือถือ: ${json['เบอร์มือถือ (ไม่ต้องวรรคหรือขีด เช่น 0812345678)']}`)
  doc.text(`กลุ่มลูกค้า: ${json['กลุ่มลูกค้า']}`)
  doc.text(`จำนวนรถกระบะที่ใช้ในกิจการ: ${json['จำนวนรถที่ใช้ในกิจการ: จำนวนรถกระบะ(คัน)']}`)
  doc.text(`จำนวนรถบรรทุกที่ใช้ในกิจการ: ${json['จำนวนรถที่ใช้ในกิจการ: จำนวนรถบรรทุก(คัน)']}`)
  doc.text(`รถบรรทุกในครอบครอง [ISUZU]: ${json['รถบรรทุกในครอบครอง [ISUZU]']}`)
  doc.text(`รถบรรทุกในครอบครอง [HINO]: ${json['รถบรรทุกในครอบครอง [HINO]']}`)
  doc.text(`รถบรรทุกในครอบครอง [FUSO]: ${json['รถบรรทุกในครอบครอง [FUSO]']}`)
  doc.text(`รถบรรทุกในครอบครอง [UD]: ${json['รถบรรทุกในครอบครอง [UD]']}`)
  doc.text(`รถบรรทุกในครอบครอง [อื่นๆ]: ${json['รถบรรทุกในครอบครอง [อื่นๆ]']}`)
  doc.text(`คำอธิบายรถในครอบครอง: ${json['คำอธิบายรถในครอบครอง']}`)
  doc.text(`ท่านมีโครงการจะซื้อรถบรรทุกเพิ่มหรือไม่: ${json['ท่านมีโครงการจะซื้อรถบรรทุกเพิ่มหรือไม่']} - ${json['ระยะเวลาที่จะต้องการออกรถ']}`)
  doc.text(`รุ่นที่สนใจ: ${json['ยี่ห้อที่สนใจ']}-${json['รุ่นที่สนใจ']}`)
  doc.text(`เหตุผลที่สนใจ: ${json['เหตุผลที่ต้องการเพิ่มรถ']} - ${json['ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก']}`)
  doc.text(`แนวโน้มธุกิจของท่านในปัจจุบันเทียบกับปีที่ผ่านมา: ${json['แนวโน้มธุกิจของท่านในปัจจุบันเทียบกับปีที่ผ่านมา']}`)
  doc.text(`ญาติ/คนรู้จักที่ต้องการซื้อรถบรรทุก: ${json['ชื่อ เบอร์ติดต่อ']}`)
  doc.text('รูปออกเยี่ยม')
  doc.image(getTmpFilePath(`${json['GPS(Lat,Long)']}.jpg`), 400, 100, {
    fit: [200, 280],
    align: 'center',
    valign: 'center'
  })
  json['อัพโหลดรูปออกเยี่ยม'].forEach((el, index) => {
    doc.image(getTmpFilePath(`${el}.jpg`), 150+(index*200), 600, {
      fit: [180, 200],
      align: 'center',
      valign: 'center'
    })
  });
  doc.end()
}

module.exports = { exportPDF }