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

const normalizeImage = async (buffer, id, customWidth=undefined) => {
  const width = customWidth ? customWidth : 640
  return await sharp(buffer, { failOnError: false })
    .rotate()
    .resize({width: width})
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(__basedir, `/tmp/img/${id}.jpg`))
}

const convertPDFtoImage = async (buffer, mimeType, id='tmp') => {
  if (mimeType === "application/pdf") {
    const tmpPath = await fromBuffer(buffer, {
      quality: 90,
      width: 648,
      height: 720,
      format: 'jpeg',
      savePath: './tmp/img',
      saveFilename: `${id}-raw`
    })(page=1, toBase64=false)
    const imgBuffer = await fs.promises.readFile(tmpPath.path)
    return imgBuffer
  } else {
    return buffer
  }
}

const getFileName = async (fileId) => {
  const res = await drive.files.get({ fileId })
  return res.data.name.split('(')[0].trim().replace('/', '-')
}

const exportFile = async (fileId, mimeName) => {
  const filename = await getFileName(fileId)
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

const downloadFile = async (fileDetail) => {
  const { id } = fileDetail
  const dir = './tmp/img/'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const destPath = path.join(path.resolve(dir), id)
  if (!fs.existsSync(`${destPath}.jpg`)) {
    console.log(`Need to download ${id}.jpg.`)
    try {
      const resp = await drive.files.get({ fileId: id, fields: 'name, mimeType, fileExtension' })
        .then((res, err) => {
          if (err) {
            console.log(err)
          }
          return res.data
        })
      const { name, mimeType, fileExtension } = resp
      let buff = []
      await drive.files.get(
        { fileId: id, alt: 'media' },
        { responseType: 'stream' },
        async (gderr, res) => {
          if (gderr || res === undefined) {
            console.log(`Try to get file: ${gderr}`)
          }
          await res.data
            .on('end', async () => {
              const downloaded = await convertPDFtoImage(Buffer.concat(buff), mimeType, id)
              await normalizeImage(downloaded, id)
              await normalizeImage(downloaded, id+'-sm', 128)
            })
            .on('data', (chunk) => {
              buff.push(chunk)
            })
            .on('error', (cverr) => {
              console.log(`Try to convert file: ${cverr}`)
            })
        })
    } catch (dlerr) {
      console.log(`Try to download file: ${dlerr}`)
    }
  }
}

module.exports = { exportFile, downloadFile }