const convertToDegree = (dirty) => {
  const [ deg, dirtyMinSec ] = dirty.split('°')
  const [ min, dirtySec ] = dirtyMinSec.split('\'')
  const sec = dirtySec?dirtySec.replace('\"', ''):0
  return (Number(deg) + ( Number(min) / 60 ) + ( Number(sec) / 3600 )).toFixed(6)
}

module.exports = async (dirty) => {
  dirty = String(dirty).trim().replace(/[()NS]/g, '').trim().replace(/[ ]+[EW][ ]+|(?!([0-9]))[ ]+/g, ',')
  const dirtyLat = dirty.split(',')[0]
  const dirtyLon = dirty.split(',').pop()
  const lat = dirtyLat ? (dirtyLat.trim().includes('°') ? convertToDegree(dirtyLat.trim()) : Number(dirtyLat.trim()).toFixed(6)):0
  const lon = dirtyLon ? (dirtyLon.trim().includes('°') ? convertToDegree(dirtyLon.trim()) : Number(dirtyLon.trim()).toFixed(6)):0
  console.log(`${dirty}: ${lat}, ${lon}`)
  return `${lat}, ${lon}`
}