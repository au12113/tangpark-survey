const path = require('path')
const XLSX = require('xlsx')

const { isPageNum, parseSerialDateTime, normalizeYear } = require('./general')
const { downloadFile } = require('./googleService')

const keywordList = ['ตำบล']
const dateColumn = ['ประทับเวลา', 'วันที่สัมภาษณ์']
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
  let sheet = []
  await jsonSheet.forEach(async(row) => {
    await Object.keys(row).forEach(async(key)=> {
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
      } else if (typeof row[key] === 'string' || row[key] instanceof String) {
        if (row[key].includes('http')) {
          if (row[key].includes(',')) {
            row[key] = row[key].split(',').map((value) => {
              return value.trim().split('=').pop()
            })
            row[key].forEach(async(val) => {
              await downloadFile({ id: val, name: val })
            })
          } else {
            row[key] = row[key].trim().split('=').pop()
            await downloadFile({ id: row[key], name: row[key] })
          }
        } else if (isKey) {
          row[keyword] = row[key]
          delete row[key]
        }
      }
    })
    sheet.push(row)
  })
  return sheet
}

const getJSON = (filename, sheetIndex=0) => {
  const workbook = XLSX.readFile(path.join('./', `/tmp/${filename}.xlsx`))
  let sheetName = null
  if (isPageNum(sheetIndex)) {
    const sheetList = workbook.SheetNames
    sheetName = sheetList[sheetIndex]
  } else {
    sheetName = sheetIndex
  }
  let sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(sheet)
}

module.exports = { getJSON, filterUrlToId }