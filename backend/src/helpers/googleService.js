const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

const piexif = require('piexifjs')
const jo = require('jpeg-autorotate')

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

const deleteThumbnailFromExif = async (path) => {
  let imgBuffer = await fs.promises.readFile(path, { encoding: 'binary' })
  let exifObj = piexif.load(imgBuffer)
  delete exifObj['thumbnail']
  delete exifObj['1st']
  const exifBytes = piexif.dump(exifObj)
  return Buffer.from(piexif.insert(exifBytes, imgBuffer), 'binary')
}

const getFileName = async (fileId) => {
  const res = await drive.files.get({fileId})
  return res.data.name.split('(')[0].trim().replace('/', '-')
}

const exportFile = async (fileId, mimeName) => {
  const name = await getFileName(fileId)
  const filename = `${name}_${getDateString()}`
  const dir = './tmp/dirty-excel/'
  if(!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const destPath = path.join(path.resolve(dir), `${filename}.xlsx`)
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
  new Promise((resolve, reject) => {
    const { id, name } = fileDetail
    const dir = './tmp/img/'
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const destPath = path.join(path.resolve(dir), name)
    fs.access(`${destPath}.jpg`, fs.F_OK, (err) => {
      if (err) {
        console.log(`Need to download ${name}.jpg.`)
        const dest = fs.createWriteStream(destPath)
        drive.files.get(
          { fileId: id, alt: 'media' },
          { responseType: 'stream' },
          (err, res) => {
            if (err || res === undefined) {
              reject(console.log(err))
            }
            res.data
              .on('end', async () => {
                await fs.promises.rename(destPath, `${destPath}.jpg`)
                deleteThumbnailFromExif(`${destPath}.jpg`)
                jo.rotate(`${destPath}.jpg`, { quality: 60 }, (error, buffer) => {
                  if (!error.code === jo.errors.correct_orientation && !error.code === jo.errors.no_orientation) {
                    console.log('An error occurred when rotating the file: ' + error.message)
                  }
                  resolve(fs.writeFile(`${destPath}.jpg`, buffer, (err) => {
                    if (err) {
                      reject(console.log('write file'+err))
                    } else {
                      console.log(`${id} done.`)
                    }
                  }))
                })
              })
              .on('error', (err) => {
                console.log(err)
              })
              .pipe(dest)
          })
      } 
    })
  })
}

module.exports = { exportFile, downloadFile }