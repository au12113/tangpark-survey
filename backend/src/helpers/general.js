const fs = require('fs')

const isPageNum = (value) => {
  return /^\d+$/.test(value)
}

const writeJSON = async (json, name) => {
  await fs.promises.writeFile(`tmp/json/${name}`, JSON.stringify(json, null, 2))
}

const getDateString = () => {
  const dateOb = new Date(Date.now())
  const dateStr = dateOb.getFullYear() + '-' + ('0' + (dateOb.getMonth() + 1)).slice(-2)
    + '-' + ('0' + dateOb.getDate()).slice(-2)
  return dateStr
}

const parseSerialDateTime = (serial) => {
  const utc_days  = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  const date_info = new Date(utc_value * 1000)

  const fractional_day = serial - Math.floor(serial) + 0.0000001

  let total_seconds = Math.floor(86400 * fractional_day)

  const seconds = total_seconds % 60

  total_seconds -= seconds

  const hours = Math.floor(total_seconds / (60 * 60))
  const minutes = Math.floor(total_seconds / 60) % 60
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds)
}

const normalizeYear = (date) => {
  let year = date.getFullYear()
  if(year > 2500) {
    year -= 543
  }
  date.setFullYear(year)
  return date
}

const potentialSeq = (date) => {
  const dateStr = (date.getFullYear()+543) + '-' + (Math.ceil((date.getMonth()+1)/2))
  return dateStr
}

const assign = (obj, keyPath, val) => {
  const lastKey = keyPath.pop()
  let lastObj = keyPath.reduce((obj, key) => obj[val[key]] = !obj[val[key]] ? {} : obj[val[key]], obj)
  lastObj[lastKey] = !lastObj[lastKey] ? [val] : [...lastObj[lastKey], val]
  return obj
}

const splitJsonSheet = async (jsonSheet) => {
  return jsonSheet.reduce(async(prevPromise, row) => {
    const acc = await prevPromise
    const pSeq = potentialSeq(row['วันที่ออกเยี่ยม'])
    return Promise.resolve(assign(acc, ['สาขาที่ออกเยี่ยม', pSeq], row))
  }, Promise.resolve({}))
}

module.exports = {
  isPageNum,
  writeJSON,
  getDateString,
  parseSerialDateTime,
  normalizeYear,
  splitJsonSheet
}