const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

const masterHelper = require('./master')
const { getDateString } = require('./general')

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDS_PATH,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ]
})

google.options({ auth })
const drive = google.drive('v3')

const exportFile = async (fileId, mimeName) => {
  const filename = `sheet_${getDateString()}`
  const destPath = path.join(path.resolve('./tmp/'), `${filename}.xlsx`)
  const dest = fs.createWriteStream(destPath)
  const mimeType = masterHelper("mimeType", mimeName)

  const res = await drive.files.export(
    { fileId, mimeType },
    { responseType: 'stream' }
  )
  await new Promise((resolve, reject) => {
    res.data
      .on('error', reject)
      .pipe(dest)
      .on('error', reject)
      .on('finish', resolve)
  })
  return filename
}

const downloadFile = (fileDetail) => {
  const { id, name } = fileDetail
  const destPath = path.join(path.resolve('./tmp/'), name)
  fs.access(`${destPath}.jpg`, fs.F_OK, (err) => {
    if (err) {
      console.log(`Need to download ${name}.jpg.`)
      const dest = fs.createWriteStream(destPath)
      drive.files.get(
        { fileId: id, alt: 'media' },
        { responseType: 'stream' },
        (err, res) => {
          if (err || res === undefined) {
            console.log(err)
            return 0
          }
          res.data
            .on('end', async() => {
              await fs.rename(destPath, `${destPath}.jpg`, (err) => {
                if (err) {
                  console.log(err)
                } else {
                  console.log(`${id} Done.`)
                }
              })
            })
            .on('error', (err) => {
              console.log(err)
              return 0
            })
            .pipe(dest)
        })
    } 
  })
}

module.exports = { exportFile, downloadFile }