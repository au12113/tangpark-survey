const path = require('path')
const XLSX = require('xlsx')

const { concatColumn } = require('../forms/general')
const { isPageNum } = require('./general')
const { downloadFile } = require('./googleService')

const keywordList = ["ตำบล"]

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
  await jsonSheet.forEach(row => {
    Object.keys(row).forEach(async(key)=> {
      const { isKey, keyword } = await whichKeywordContain(key)
      if (typeof row[key] === 'string' || row[key] instanceof String) {
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

const getJSON = (filename, sheet=null) => {
  const workbook = XLSX.readFile(path.join('./', `/tmp/${filename}.xlsx`))
  let sheetName = null
  if (!sheet || isPageNum(sheet)) {
    sheet = 0
    const sheetList = workbook.SheetNames
    sheetName = sheetList[sheet]
  } else {
    sheetName = sheet
  }
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
}

module.exports = { getJSON, filterUrlToId }