// NFTmint.tsx
// Upload an image → send it to backend (Pinata/IPFS) → mint Algorand NFT (ASA)
// Works in Vercel (via VITE_API_URL) and GitHub Codespaces (auto-detects -3001 host).

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { sha512_256 } from 'js-sha512'
import { useSnackbar } from 'notistack'
import React, { useRef, useState } from 'react'
import { AiOutlineCloudUpload, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface NFTMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

function resolveBackendBase(): string {
  // 1) Respect explicit env (Vercel or custom)
  const env = import.meta.env.VITE_API_URL?.trim()
  if (env) return env.replace(/\/$/, '')

  // 2) Codespaces: convert current host to port 3001
  // e.g. https://abc-5173.app.github.dev -> https://abc-3001.app.github.dev
  const host = window.location.host
  if (host.endsWith('.app.github.dev')) {
    const base = host.replace(/-\d+\.app\.github\.dev$/, '-3001.app.github.dev')
    return `https://${base}`
  }

  // 3) Plain local fallback
  return 'http://localhost:3001'
}

const NFTmint = ({ openModal, setModalState }: NFTMintProps) => {
  const LORA = 'https://lora.algokit.io/testnet'

  // UI state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('') 
  const [loading, setLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Wallet + notifications
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  // Algorand client (TestNet by default from Vite env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Handle file pick + preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  // Click on dropzone → open hidden file input
  const handleDivClick = () => fileInputRef.current?.click()

  // Main: upload → pin metadata → mint NFT
  const handleMintNFT = async () => {
    setLoading(true)

    // Guard: wallet must be connected
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    // Guard: must select an image
    if (!selectedFile) {
      enqueueSnackbar('Please select an image file to mint.', { variant: 'warning' })
      setLoading(false)
      return
    }

    enqueueSnackbar('Uploading and preparing NFT...', { variant: 'info' })
    let metadataUrl = ''

    try {
      // Build backend URL
      const backendBase = resolveBackendBase()
      const backendApiUrl = `${backendBase.replace(/\/$/, '')}/api/pin-image`
      console.log('Using backend URL:', backendApiUrl)

      // Send file → backend → Pinata/IPFS
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(backendApiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      metadataUrl = data.metadataUrl
      if (!metadataUrl) throw new Error('Backend did not return a valid metadata URL')
    } catch (e: any) {
      enqueueSnackbar('Error uploading to backend. If in Codespaces, make port 3001 Public.', { variant: 'error' })
      setLoading(false)
      return
    }

    try {
      // Mint ASA (NFT) on Algorand
      enqueueSnackbar('Minting NFT on Algorand...', { variant: 'info' })

      // Hash the metadata URL (demo shortcut). ARC-3 would hash JSON bytes instead.
      const metadataHash = new Uint8Array(Buffer.from(sha512_256.digest(metadataUrl)))

      const createNFTResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: 1n,                    // supply = 1 → NFT
        decimals: 0,                  // indivisible
        assetName: 'MasterPass Ticket', // customize
        unitName: 'MTK',                // customize
        url: metadataUrl,               // IPFS metadata
        metadataHash,
        defaultFrozen: false,
      })

      const id = createNFTResult

      enqueueSnackbar(`✅ Success! Asset ID: ${id.assetId}`, {
        variant: 'success',
        action: () =>
          id ? (
            <a
              href={`${LORA}/asset/${id.assetId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      // Reset form + close modal
      setSelectedFile(null)
      setPreviewUrl('')
      setTimeout(() => setModalState(false), 2000)
    } catch (e: any) {
      enqueueSnackbar(`Failed to mint NFT: ${e.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // UI
  return (
    <dialog id="nft_modal" className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
          <AiOutlineCloudUpload className="text-3xl" />
          Mint a MasterPass NFT
        </h3>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400">
            Select an image to mint
          </label>
          <div
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:border-cyan-500 transition-colors"
            onClick={handleDivClick}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="NFT preview" className="rounded-lg max-h-48 object-contain" />
            ) : (
              <div className="text-center">
                <AiOutlineCloudUpload className="mx-auto h-12 w-12 text-gray-500" />
                <p className="mt-2 text-sm text-gray-400">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="sr-only"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
            />
          </div>
        </div>

        <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="btn w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border-none text-gray-300 rounded-xl"
            onClick={() => setModalState(false)}
            disabled={loading}
          >
            Close
          </button>
          <button
            type="button"
            className={`
              btn w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white rounded-xl border-none font-semibold transition-all duration-300 transform active:scale-95
              ${selectedFile && !loading ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
            `}
            onClick={handleMintNFT}
            disabled={loading || !selectedFile}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Minting...
              </span>
            ) : (
              'Mint NFT'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default NFTmint
