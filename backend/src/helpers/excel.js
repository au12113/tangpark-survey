const path = require('path')
const fs = require('fs')
const gm = require('gm')

const XLSX = require('xlsx')
const ExcelJS = require('exceljs')
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

const getImageSize = (imgPath) => {
  return new Promise((resolve, reject) => {
    gm(imgPath).size((err, size) => {
      if (err) {
        reject(err)
      } else {
        resolve(size)
      }
    })
  })
}

const filterUrlToId = async (jsonSheet) => {
  const dateColumn = ['Timestamp', 'วันที่สัมภาษณ์', 'วันที่ออกเยี่ยม']
  return await jsonSheet.reduce((prev, row, rowIndex) => {
    Object.keys(row).forEach(async (key) => {
      const { isKey, keyword } = await whichKeywordContain(key)
      if (dateColumn.indexOf(key) !== -1) {
        if (typeof row[key] === 'string') {
          const [month, day, year] = row[key].split('/').map(x => Number(x))
          parseDate = new Date(year + 2500, month - 1, day)
        } else {
          parseDate = parseSerialDateTime(row[key])
        }
        const normalized = normalizeYear(parseDate)
        row[key] = normalized
      } else if (key.trim() === 'GPS(Lat,Long)_1') {
        row[key] = await cleanGPS(row[key])
      } else if (typeof row[key] === 'string' || row[key] instanceof String) {
        if (row[key].includes('http')) {
          if (row[key].includes(',') || ["อัพโหลดรูปออกเยี่ยม", "GPS(Lat,Long)"].includes(key.trim())) {
            row[key] = row[key].split(',').map((value) => {
              return value.trim().split('=').pop()
            })
            await row[key].forEach(async (val) => {
              try {
                await downloadFile({ id: val, name: val })
              } catch (e) {
                console.log(`Promise to download multiple files: ${e}`)
              }
            })
          } else {
            row[key] = row[key].trim().split('=').pop()
            try {
              await downloadFile({ id: row[key], name: row[key] })
            } catch (e) {
              console.log(`Promise to download file: ${e}`)
            }
          }
        }
      } else if (isKey) {
        row[keyword] = row[key]
        delete row[key]
      }
    })
    prev.push(row)
    return prev
  }, [])
}

const getJSON = (filename, timestampName, sheetIndex=0) => {
  return new Promise((resolve, reject) => {
    try {
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
    } catch (e) {
      console.log(`Getting JSON: ${e}`)
      reject(e)
    }
  })
}

const addImageToExcel = async (filePath, ws_column, imgCol = [], savePath = './output/excel/output.xlsx') => {
  const imgColIndex = imgCol.map((val) => { return ws_column.indexOf(val) })
  let wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  let ws = wb.getWorksheet('Sheet1')
  let ws2 = wb.addWorksheet('Sheet2', { properties: { defaultColWidth: 17 }})
  return new Promise(async (resolve, reject) => {
    try {
      ws.eachRow(async (row, rowNumber) => {
        if (rowNumber !== 1) {
          let tmp = row.values
          ws2.addRow(tmp)
          const newRow = ws2.getRow(rowNumber)
          newRow.height = 70
          imgColIndex.forEach(async (col, lindex) => {
            const imgPath = `./tmp/img/${row.values[col + 1]}-sm.jpg`
            // const imgSize = await getImageSize(imgPath)
            const imgSize = { width: 128, height: 128 }
            await new Promise((imgResolve, imgReject) => {
              try {
                const img = wb.addImage({ filename: imgPath, extension: 'jpeg' })
                imgResolve(ws2.addImage(img, { tl: { col: ws.columnCount + lindex, row: rowNumber - 1 }, ext: { width: imgSize.width, height: imgSize.height } }))
              } catch (imgErr) {
                imgReject(imgErr)
              }
            })
          })
        } else {
          ws2.addRow(ws_column)
        }
      })
    } catch (e) {
      reject(e)
    } finally {
      wb.removeWorksheet('Sheet1')
      resolve(wb.xlsx.writeFile(savePath))
    }
  })
}

const writeExcel = async (jsonSheet, filename, subFolder=undefined) => {
  const wb = XLSX.utils.book_new()
  let ws_column
  if (__argv['mode'] == 'mapping') {
    ws_column = ["Timestamp", "ผู้สำรวจ", "วันที่สัมภาษณ์", "ชื่อร้านค้า",
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
  } else if (__argv['mode'] == 'potential') {
    ws_column = ["Timestamp","วันที่ออกเยี่ยม","สาขาที่ออกเยี่ยม","ชื่อscที่ออกเยี่ยม ","ชื่อลูกค้า ","เบอร์มือถือ","ลักษณะลูกค้า",
    "ชื่อกลุ่ม และ/หรือหัวหน้ากลุ่ม","ประเภทธุรกิจ","ประเภทสินค้าที่ขนส่ง เช่น ยางพารา","ลักษณะธุรกิจลูกค้า และการใช้งานรถ","ช่วงเดือนpeak(รับงานเยอะ) ของธุรกิจลูกค้า",
    "แนวโน้มธุรกิจลูกค้า","อธิบายปัจจัยที่ส่งผลกระทบต่อแนวโน้มธุรกิจลูกค้า","รถบรรทุกISUZUในครอบครองปัจจุบัน","รุ่นรถISUZUในครอบครอง [2T]","คำอธิบายรถ ISUZU",
    "ความพอใจต่อสินค้า/การบริการต่อตังปัก","คำแนะนำเพิ่มเติมจากลูกค้า","รถบรรทุกHINOในครอบครองปัจจุบัน","คำอธิบายรถ HINO","รถบรรทุกยี่ห้ออื่นๆในครอบครองปัจจุบัน",
    "หมายเหตุ และระบุยี่ห้อที่ลูกค้าซื้อ ","เหตุผลที่เลือกใช้ยี่ห้ออื่น","ท่านมีโครงการซื้อรถเพิ่มหรือไม่","หากมี โปรดระบุ","ระบุรุ่นที่สนใจ และจำนวนคัน","สื่อออนไลน์ที่ลูกค้าใช้",
    "ลูกค้าเคยเห็นโฆษณารถบรรทุกอีซูซุจากช่องทางไหน","ช่วงเวลาที่ลูกค้าเล่นSocial media ","เพจที่ลูกค้าติดตาม","อัพโหลดรูปออกเยี่ยม","อัพโหลดรูป GPS (Lat,Long)",
    "GPS(Lat,Long)"]
  }
  const ws_data = await jsonSheet.reduce((prevRecord, mem, rowIndex) => {
    let row = ws_column.reduce((pre, key, keyIndex) => {
      if(!(key in mem) || mem[key] === undefined) {
        pre[keyIndex] = ''
      } else if(key === 'GPS(Lat,Long)_1') {
        pre[keyIndex] = `${mem[key].lat}, ${mem[key].lon}`
      } else if(key === 'Timestamp') {
        pre[keyIndex] = mem[key]
      } else if(['วันที่สัมภาษณ์', 'วันที่ออกเยี่ยม'].includes(key)) {
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
  const folderPath = `./output/${subFolder}`
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  const savePath = path.resolve('./', `${folderPath}/${filename}`)
  let tmpPath = path.resolve('./', `tmp/excel/${filename}`)
  await XLSX.writeFile(wb, tmpPath)
  if (__argv['mode'] === 'potential') {
    await addImageToExcel(tmpPath, ws_column, ["อัพโหลดรูปออกเยี่ยม","อัพโหลดรูป GPS (Lat,Long)"], savePath)
  }
}

module.exports = { getJSON, filterUrlToId, writeExcel}