const path = require('path')
const XLSX = require('xlsx')

const { isPageNum, parseSerialDateTime, normalizeYear } = require('./general')
const { downloadFile } = require('./googleService')
const cleanGPS = require('./cleanGPS')

const keywordList = ['ตำบล']
const whichKeywordContain = async (columnName) => {
  let keyword = null
  await keywordList.forEach((key) => {
    if (columnName.includes(key)) {
      keyword = key
    }
  })
  if (keyword !== null) {
    return { isKey: true, keyword }
  } else {
    return { isKey: false, keyword }
  }
}

const filterUrlToId = async (jsonSheet) => {
  const dateColumn = ['Timestamp', 'วันที่สัมภาษณ์']
  return await jsonSheet.reduce((prev, row, rowIndex) => {
    Object.keys(row).forEach(async(key)=> {
      const { isKey, keyword } = await whichKeywordContain(key) 
      if (dateColumn.indexOf(key)!==-1) {
        if(typeof row[key] === 'string') {
          const [ month, day, year ] = row[key].split('/').map(x => Number(x))
          parseDate = new Date(year+2500, month-1, day)
        } else {
          parseDate = parseSerialDateTime(row[key])
        }
        const normalized = normalizeYear(parseDate)
        row[key] = normalized
      } else if (key.trim()==='GPS(Lat,Long)_1') {
        row[key] = await cleanGPS(row[key])
      } else if (typeof row[key] === 'string' || row[key] instanceof String) {
        if (row[key].includes('http')) {
          if (row[key].includes(',') || ["อัพโหลดรูปออกเยี่ยม", "GPS(Lat,Long)"].includes(key.trim())) {
            row[key] = row[key].split(',').map((value) => {
              return value.trim().split('=').pop()
            })
            new Promise((resolve, reject) => row[key].forEach(async(val) => {
              resolve(downloadFile({ id: val, name: val }))
            }))
          } else {
            row[key] = row[key].trim().split('=').pop()
            new Promise((resolve, reject) => resolve(downloadFile({ id: row[key], name: row[key] })))
          }
        } else if (isKey) {
          row[keyword] = row[key]
          delete row[key]
        }
      }
    })
    prev.push(row)
    return prev
  }, [])
}

const getJSON = (filename, timestampName, sheetIndex=0) => {
  return new Promise((resolve, reject) => {
    const workbook = XLSX.readFile(path.join('./', `/tmp/dirty-excel/${filename}.xlsx`))
    let sheetName = null
    if (isPageNum(sheetIndex)) {
      const sheetList = workbook.SheetNames
      sheetName = sheetList[sheetIndex]
    } else {
      sheetName = sheetIndex
    }
    let sheet = workbook.Sheets[sheetName]
    if (timestampName !== 'Timestamp') {
      sheet['A1'] = { t: 's', v: 'Timestamp', r: '<t>Timestamp</t>', h: 'Timestamp', w: 'Timestamp' }
    }
    return resolve(XLSX.utils.sheet_to_json(sheet))
  })
}

const writeExcel = async (jsonSheet, filename) => {
  const wb = XLSX.utils.book_new()
  const ws_column = ["Timestamp", "ผู้สำรวจ", "วันที่สัมภาษณ์", "ชื่อร้านค้า",
    "ชื่อ-สกุลเจ้าของกิจการ", "เพศ", "อายุ", "กลุ่มลูกค้า", "ประเภทธุรกิจ", "กลุ่มธุรกิจ",
    "เบอร์มือถือ (ไม่ต้องวรรคหรือขีด เช่น 0812345678)", "เบอร์บ้าน (ไม่ต้องวรรคหรือขีด เช่น 045123456)", "LINE_id",
    "แนวโน้มธุกิจของท่านในปัจจุบันเทียบกับปีที่ผ่านมา", "จำนวนรถที่ใช้ในกิจการ: จำนวนรถกระบะ(คัน)",
    "จำนวนรถที่ใช้ในกิจการ: จำนวนรถบรรทุก(คัน)", "รถบรรทุกในครอบครอง [ISUZU]", "รถบรรทุกในครอบครอง [HINO]",
    "รถบรรทุกในครอบครอง [FUSO]", "รถบรรทุกในครอบครอง [UD]", "รถบรรทุกในครอบครอง [อื่นๆ]",
    "คำอธิบายรถในครอบครอง ", "ท่านมีโครงการจะซื้อรถบรรทุกเพิ่มหรือไม่", "ระยะเวลาที่จะต้องการออกรถ", "รุ่นที่สนใจ",
    "ยี่ห้อที่สนใจ", "เหตุผลที่ต้องการเพิ่มรถ", "ปัจจัยหลัก 3 ประการที่จะทำให้เลือกซื้อรถบรรทุก",
    "ท่านมีญาติ/คนรู้จักที่มีโครงการซื้อรถบรรทุก (ถ้ามีโปรดระบุชื่อ และเบอร์โทร)", "ชื่อ เบอร์ติดต่อ",
    "จังหวัด", "อำเภอ", "ตำบล", "ถนน", "หมู่ (ถ้าไม่มีหมู่ ให้ใช้สัญลักษณ์:  - )",
    "ที่อยู่บ้านเลขที่", "อัพโหลดรูปออกเยี่ยม","GPS(Lat,Long)","GPS(Lat,Long)_1"]
  const ws_data = await jsonSheet.reduce((prevRecord, mem, rowIndex) => {
    let row = ws_column.reduce((pre, key, keyIndex) => {
      if(!(key in mem) || mem[key] === undefined) {
        pre[keyIndex] = ''
      } else if(key === 'GPS(Lat,Long)_1') {
        pre[keyIndex] = `${mem[key].lat}, ${mem[key].lon}`
      } else if(key === 'Timestamp') {
        pre[keyIndex] = mem[key]
      } else if(key === 'วันที่สัมภาษณ์') {
        pre[keyIndex] = `${mem[key].getFullYear()}/${mem[key].getMonth()+1}/${mem[key].getDate()}`
      } else {
        pre[keyIndex] = mem[key]
      }
      return pre
    }, [])
    prevRecord[rowIndex+1] = row
    return prevRecord
  }, [ ws_column ])
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data, { dateNF: 'YYYY/MM/DD-HH:mm:ss' }), 'Sheet1')
  await XLSX.writeFile(wb, path.resolve('./', `tmp/excel/${filename}`))
}

module.exports = { getJSON, filterUrlToId, writeExcel}