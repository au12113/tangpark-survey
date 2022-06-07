const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

const sharp = require('sharp')
const { fromBuffer } = require('pdf2pic')

const masterHelper = require('./master')
const { getDateString } = require('./general')

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDS_PATH,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ]
})

google.options({ auth })
const drive = google.drive('v3')

const normalizeImage = async (buffer, id) => {
  return await sharp(buffer)
    .rotate()
    .resize({width: 640})
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(__basedir, `/tmp/img/${id}.jpg`))
}

const convertPDFtoImage = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    return await fromBuffer(buffer, { quality: 100, format: 'jpg'})(page= 0, true)
  } else {
    return buffer
  }
}

const getFileName = async (fileId) => {
  const res = await drive.files.get({ fileId })
  return res.data.name.split('(')[0].trim().replace('/', '-')
}

const exportFile = async (fileId, mimeName) => {
  const name = await getFileName(fileId)
  const filename = `${name}_${getDateString()}`
  const dir = './tmp/dirty-excel/'
  if (!fs.existsSync(dir)) {
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
  new Promise(async (resolve, reject) => {
    const { id } = fileDetail
    const dir = './tmp/img/'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const destPath = path.join(path.resolve(dir), id)
    fs.access(`${destPath}.jpg`, fs.F_OK, async (err) => {
      if (err) {
        console.log(`Need to download ${id}.jpg.`)
        try {
          const resp = drive.files.get({ fileId: id, fields: 'name, mimeType, fileExtension' })
            .then((res, err) => {
              if(err) {
                console.log(err)
              }
              // console.log(res.data)
              return res.data
            })
          const { name, mimeType, fileExtension } = resp
          let buff = []
          drive.files.get(
            { fileId: id, alt: 'media' },
            { responseType: 'stream' },
            (gderr, res) => {
              if (gderr || res === undefined) {
                reject(console.log(gderr))
              }
              res.data
                .on('end', async () => {
                  const buffer = Buffer.concat(buff)
                  const downloaded = await convertPDFtoImage(buffer, mimeType)
                  const image = await normalizeImage(downloaded, id)
                  resolve(image)
                })
                .on('data', (chunk) => {
                  buff.push(chunk)
                })
                .on('error', (cverr) => {
                  reject(console.log(cverr))
                })
            })
        } catch (dlerr) {
          reject(console.log(dlerr))
        }
      }
    })
  })
}

module.exports = { exportFile, downloadFile }