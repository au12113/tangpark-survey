const masterList = require('../masters')

module.exports = (masterFile, x) => {
  return masterList[masterFile].find(({ name }) => name.toLowerCase() === x.toLowerCase()).value
}