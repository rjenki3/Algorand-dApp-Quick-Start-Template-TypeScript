// Tokenmint.tsx
// Create a standard fungible token (ASA) on Algorand TestNet.
// Users can set asset name, unit name, total supply, and decimals.

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineInfoCircle } from 'react-icons/ai'
import { BsCoin } from 'react-icons/bs'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint = ({ openModal, setModalState }: TokenMintProps) => {
  const LORA = 'https://lora.algokit.io/testnet'

  // 👇 Default placeholder values (safe customization points for learners)
  const [assetName, setAssetName] = useState<string>('MasterPass Token') // token name
  const [unitName, setUnitName] = useState<string>('MPT') // short ticker
  const [total, setTotal] = useState<string>('1000') // human-readable total
  const [decimals, setDecimals] = useState<string>('0') // 0 = whole tokens only

  const [loading, setLoading] = useState<boolean>(false)

  // Wallet + notifications
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  // Algorand client (TestNet from Vite env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  // ------------------------------
  // Handle Token Creation
  // ------------------------------
  const handleMintToken = async () => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }

    // Basic validation checks
    if (!assetName || !unitName) {
      enqueueSnackbar('Please enter an asset name and unit name.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(total)) {
      enqueueSnackbar('Total supply must be a whole number.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(decimals)) {
      enqueueSnackbar('Decimals must be a whole number.', { variant: 'warning' })
      return
    }

    try {
      setLoading(true)
      enqueueSnackbar('Creating token...', { variant: 'info' })

      const totalBig = BigInt(total)
      const decimalsBig = BigInt(decimals)

      // On-chain total supply = total × 10^decimals
      const onChainTotal = totalBig * 10n ** decimalsBig

      // 👇 Learners can customize all of these ASA parameters
      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimalsBig),
        assetName, // <— customize token name
        unitName, // <— customize unit/ticker
        defaultFrozen: false,
      })

      const id = createResult

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

      // Reset back to defaults after successful mint
      setAssetName('MasterPass Token')
      setUnitName('MPT')
      setTotal('1000')
      setDecimals('0')
    } catch (error) {
      console.error(error)
      enqueueSnackbar('Failed to create token', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------
  // Modal UI — Professional, clear, solid color theme + loading animations
  // ------------------------------
  return (
    <dialog
      id="token_modal"
      className={`modal modal-bottom sm:modal-middle ${openModal ? 'modal-open' : ''}`}
    >
      <div
        className={`
          modal-box w-full max-w-2xl rounded-2xl border border-gray-200
          bg-white text-slate-900 p-6 sm:p-7 shadow-2xl
        `}
      >
        {/* Top indeterminate loading bar */}
        {loading && (
          <div className="relative h-1 w-full -mt-2 mb-4 overflow-hidden rounded bg-gray-100">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-indigo-600" />
            <style>{`
              @keyframes loading {
                0%   { transform: translateX(-120%); }
                50%  { transform: translateX(60%); }
                100% { transform: translateX(220%); }
              }
            `}</style>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <BsCoin className="text-2xl text-indigo-600" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
                Create a MasterPass Token
              </h3>
              <p className="text-sm text-slate-500">Standard ASA creation on Algorand TestNet.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
            onClick={() => setModalState(false)}
          >
            Close
          </button>
        </div>

        {/* Form */}
        <div className={`mt-6 ${loading ? 'opacity-90' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Asset Name */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-slate-700 font-medium">Token Name</span>
              </label>
              <input
                type="text"
                className="
                  input input-bordered w-full rounded-xl
                  bg-white text-slate-900 placeholder:text-slate-400
                  border-gray-200 focus:outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                "
                placeholder="e.g., MasterPass Token"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>

            {/* Unit Name (Symbol) */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-slate-700 font-medium">Symbol</span>
              </label>
              <input
                type="text"
                className="
                  input input-bordered w-full rounded-xl
                  bg-white text-slate-900 placeholder:text-slate-400
                  border-gray-200 focus:outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                "
                placeholder="e.g., MPT"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
            </div>

            {/* Total Supply */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-slate-700 font-medium">Total Supply</span>
              </label>
              <input
                type="number"
                min={1}
                className="
                  input input-bordered w-full rounded-xl
                  bg-white text-slate-900 placeholder:text-slate-400
                  border-gray-200 focus:outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                "
                placeholder="e.g., 1000"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>

            {/* Decimals */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-slate-700 font-medium">Decimals</span>
              </label>
              <input
                type="number"
                min={0}
                max={19}
                className="
                  input input-bordered w-full rounded-xl
                  bg-white text-slate-900 placeholder:text-slate-400
                  border-gray-200 focus:outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                "
                placeholder="0 for whole tokens"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <AiOutlineInfoCircle />
                <p>
                  On-chain total = <code>total × 10^decimals</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            type="button"
            className={`
              btn w-full sm:w-auto rounded-xl font-semibold
              transition-all duration-200
              ${assetName && unitName && total
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'}
            `}
            onClick={handleMintToken}
            disabled={loading || !assetName || !unitName || !total}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Creating…
              </span>
            ) : (
              'Mint Token'
            )}
          </button>

          <button
            type="button"
            className="
              btn w-full sm:w-auto rounded-xl
              bg-white hover:bg-slate-50 border border-slate-200 text-slate-700
            "
            onClick={() => setModalState(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Tokenmint
