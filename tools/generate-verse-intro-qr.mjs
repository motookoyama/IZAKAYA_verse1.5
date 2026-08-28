import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

const targetUrl = 'https://motookoyama.github.io/IZAKAYA_verse1.5/#/verse'
const outputPaths = [
  path.resolve('public/assets/izakaya/qr_verse_intro.png'),
]

for (const outputPath of outputPaths) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await QRCode.toFile(outputPath, targetUrl, {
    type: 'png',
    width: 720,
    margin: 3,
    errorCorrectionLevel: 'H',
    color: { dark: '#0b1230', light: '#ffffff' },
  })
}

console.log(`${outputPaths.join('\n')}\n${targetUrl}`)
