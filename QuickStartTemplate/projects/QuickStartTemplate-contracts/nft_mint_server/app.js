// Shared Express app (no .listen here)
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import pinataSDK from '@pinata/sdk'
import dotenv from 'dotenv'
import { Readable } from 'stream'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

// Allow local + prod (comma-separated in env), or * by default for dev
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // same-origin or curl
    if (allowedOrigins.includes('*')) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)

    // ✅ Extra: allow any frontend on vercel.app (great for student forks)
    try {
      const host = new URL(origin).hostname
      if (host.endsWith('.vercel.app')) return cb(null, true)
    } catch (_) {}

    return cb(null, false)
  },
  credentials: false,
}))

app.use(express.json())


// Pinata client
const pinata = process.env.PINATA_JWT
  ? new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT })
  : new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET)

// Optional: test credentials at cold start
;(async () => {
  try {
    const auth = await pinata.testAuthentication?.()
    console.log('Pinata auth OK:', auth || 'ok')
  } catch (e) {
    console.error('Pinata authentication FAILED. Check env vars.', e)
  }
})()

// health
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ ok: true, ts: Date.now() })
})

// uploads
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/pin-image', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const stream = Readable.from(file.buffer)
    // @ts-ignore give Pinata a filename
    stream.path = file.originalname || 'upload'

    const imageOptions = { pinataMetadata: { name: file.originalname || 'MasterPass Ticket Image' } }
    const imageResult = await pinata.pinFileToIPFS(stream, imageOptions)
    const imageUrl = `ipfs://${imageResult.IpfsHash}`

    const metadata = {
      name: 'NFT Example',
      description: 'This is an unchangeable NFT',
      image: imageUrl,
      properties: {},
    }
    const jsonOptions = { pinataMetadata: { name: 'MasterPass Ticket Metadata' } }
    const jsonResult = await pinata.pinJSONToIPFS(metadata, jsonOptions)
    const metadataUrl = `ipfs://${jsonResult.IpfsHash}`

    res.status(200).json({ metadataUrl })
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data ||
      error?.message ||
      'Failed to pin to IPFS.'
    res.status(500).json({ error: msg })
  }
})

export default app
