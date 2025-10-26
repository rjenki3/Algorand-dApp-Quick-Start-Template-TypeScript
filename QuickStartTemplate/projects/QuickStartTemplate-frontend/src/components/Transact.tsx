// Transact.tsx
// Simple payment component: send 1 ALGO or 1 USDC from connected wallet → receiver address.
// Uses Algokit + wallet connector. Designed for TestNet demos.

import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const LORA = 'https://lora.algokit.io/testnet';

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO') // toggle between ALGO and USDC

  // Atomic transfer UI state
  const [groupLoading, setGroupLoading] = useState<boolean>(false)
  const [groupReceiverAddress, setGroupReceiverAddress] = useState<string>('')

  // Opt-in UI state
  const [optInLoading, setOptInLoading] = useState<boolean>(false)
  const [alreadyOpted, setAlreadyOpted] = useState<boolean>(false)

  // Algorand client setup (TestNet by default from env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Wallet + notifications
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  // USDC constants (TestNet ASA)
  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  // --- Pre-check: is wallet already opted in to USDC? (runs when modal opens or wallet changes)
  useEffect(() => {
    const checkOptIn = async () => {
      try {
        if (!openModal || !activeAddress) {
          setAlreadyOpted(false)
          return
        }
        const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
        const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []
        const opted = assets.some((a: any) => {
          const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
          if (rawId === undefined || rawId === null) return false
          try {
            return BigInt(rawId) === usdcAssetId
          } catch {
            return false
          }
        })
        setAlreadyOpted(opted)
      } catch (e) {
        console.error('Opt-in precheck failed:', e)
      }
    }
    checkOptIn()
  }, [openModal, activeAddress])

  // ------------------------------
  // Handle sending single payment
  // ------------------------------
  const handleSubmit = async () => {
    setLoading(true)

    // Guard: wallet must be connected
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar(`Sending ${assetType} transaction...`, { variant: 'info' })

      let txResult;
      let msg;

      if (assetType === 'ALGO') {
        txResult = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        });
        msg = '✅ 1 ALGO sent!';
      } else {
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals);
        txResult = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        });
        msg = '✅ 1 USDC sent!';
      }

      const txId = txResult?.txIds?.[0];

      enqueueSnackbar(`${msg} TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      });

      // Reset form
      setReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar(`Failed to send ${assetType}`, { variant: 'error' })
    }

    setLoading(false)
  }

  // ------------------------------
  // USDC Opt-in for CONNECTED wallet (fixed: safe BigInt handling)
  // ------------------------------
  const handleOptInUSDC = async () => {
    setOptInLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setOptInLoading(false)
      return
    }

    try {
      // Check if already opted in (defensive against missing/varied shapes)
      const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
      const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []

      const alreadyOptedNow = assets.some((a: any) => {
        // normalize possible keys: 'asset-id' (algod), 'assetId', or nested
        const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
        if (rawId === undefined || rawId === null) return false
        try {
          return BigInt(rawId) === usdcAssetId
        } catch {
          return false
        }
      })

      setAlreadyOpted(alreadyOptedNow)

      if (alreadyOptedNow) {
        enqueueSnackbar('Your wallet is already opted in to USDC.', { variant: 'info' })
        setOptInLoading(false)
        return
      }

      // Opt in to USDC ASA
      const res = await algorand.send.assetOptIn({
        signer: transactionSigner,
        sender: activeAddress,
        assetId: usdcAssetId,
      })

      const txId = res?.txIds?.[0]
      enqueueSnackbar(`✅ Opt-in complete for USDC. TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      // reflect that we're now opted in
      setAlreadyOpted(true)
    } catch (e) {
      console.error(e)
      enqueueSnackbar('USDC opt-in failed (maybe already opted in).', { variant: 'error' })
    }

    setOptInLoading(false)
  }

  // ------------------------------
  // Handle Atomic Group (2-in-1)
  // Sends: 1 ALGO + 1 USDC to the same receiver in one atomic group.
  // Note: Receiver must be opted-in to USDC (10458941).
  // ------------------------------
  const handleAtomicGroup = async () => {
    setGroupLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setGroupLoading(false)
      return
    }
    if (groupReceiverAddress.length !== 58) {
      enqueueSnackbar('Enter a valid Algorand address (58 chars).', { variant: 'warning' })
      setGroupLoading(false)
      return
    }

    try {
      enqueueSnackbar('Sending atomic transfer: 1 ALGO + 1 USDC...', { variant: 'info' })

      const group = algorand.newGroup()

      // Tx 1: 1 ALGO payment
      group.addPayment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        amount: algo(1),
      })

      // Tx 2: 1 USDC ASA transfer (receiver must be opted-in)
      const oneUSDC = 1n * 10n ** BigInt(usdcDecimals)
      group.addAssetTransfer({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        assetId: usdcAssetId,
        amount: oneUSDC,
      })

      const result = await group.send()
      const firstTx = result?.txIds?.[0]

      enqueueSnackbar(`✅ Atomic transfer complete! (1 ALGO + 1 USDC)`, {
        variant: 'success',
        action: () =>
          firstTx ? (
            <a
              href={`${LORA}/transaction/${firstTx}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View one tx on Lora ↗
            </a>
          ) : null,
      })

      setGroupReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar('Atomic transfer failed. Make sure the receiver is opted into USDC (10458941).', {
        variant: 'error',
      })
    }

    setGroupLoading(false)
  }

  // ------------------------------
  // Modal UI — Professional, solid theme + subtle loading animations
  // ------------------------------
  return (
    <dialog
      id="transact_modal"
      className={`modal modal-bottom sm:modal-middle ${openModal ? 'modal-open' : ''}`}
    >
      <div
        className={`
          modal-box max-w-xl rounded-2xl border border-slate-200
          bg-white text-slate-900 p-6 shadow-2xl
          ${loading || groupLoading || optInLoading ? 'ring-1 ring-indigo-200' : ''}
        `}
      >
        {/* Top loading bar */}
        {(loading || groupLoading || optInLoading) && (
          <div className="relative h-1 w-full mb-4 overflow-hidden rounded bg-slate-100">
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

        <h3 className="flex items-center gap-3 text-xl sm:text-2xl font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
            <AiOutlineSend className="text-xl text-indigo-600" />
          </span>
          Send a Payment
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Use a connected wallet to send 1 {assetType} to a receiver. TestNet demo.
        </p>

        {/* Receiver Address input (single send) */}
        <div className={`form-control mt-5 ${loading ? 'animate-pulse' : ''}`}>
          <label className="label py-1">
            <span className="label-text text-slate-700 font-medium">Receiver&apos;s Address</span>
          </label>
          <input
            type="text"
            data-test-id="receiver-address"
            className="
              input input-bordered w-full rounded-xl
              bg-white text-slate-900 placeholder:text-slate-400
              border-slate-300 focus:outline-none
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
              transition
            "
            placeholder="e.g., KPLX..."
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
          {/* Address length check for Algorand (58 chars) */}
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-slate-500">Amount: 1 {assetType}</span>
            <span
              className={`font-mono ${
                receiverAddress.length === 58 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {receiverAddress.length}/58
            </span>
          </div>
        </div>

        {/* Toggle ALGO ↔ USDC */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            className={`
              px-4 py-2 rounded-lg font-medium transition
              border ${assetType === 'ALGO'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}
            `}
            onClick={() => setAssetType('ALGO')}
          >
            ALGO
          </button>
          <button
            type="button"
            className={`
              px-4 py-2 rounded-lg font-medium transition
              border ${assetType === 'USDC'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'}
            `}
            onClick={() => setAssetType('USDC')}
          >
            USDC
          </button>
        </div>

        {/* Action buttons (single send) */}
        <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            data-test-id="send"
            type="button"
            className={`
              btn w-full sm:w-auto rounded-xl font-semibold
              transition-all duration-200
              ${receiverAddress.length === 58
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'}
            `}
            onClick={handleSubmit}
            disabled={loading || receiverAddress.length !== 58}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending…
              </span>
            ) : (
              `Send 1 ${assetType}`
            )}
          </button>
          <button
            type="button"
            className="
              btn w-full sm:w-auto rounded-xl
              bg-white hover:bg-slate-50 border border-slate-300 text-slate-700
            "
            onClick={() => setModalState(false)}
          >
            Close
          </button>
        </div>

        {/* -------------------------------------------------
            Atomic Transfer (Separate Demo Section)
            ------------------------------------------------- */}
        <div className={`mt-8 p-4 rounded-xl border border-slate-200 bg-slate-50 ${groupLoading ? 'animate-pulse' : ''}`}>
          <h4 className="text-base sm:text-lg font-semibold mb-1 text-slate-900">Atomic Transfer (2-in-1)</h4>
          <p className="text-sm text-slate-600 mb-3">
            Send <span className="font-semibold text-slate-900">1 ALGO</span> +{' '}
            <span className="font-semibold text-slate-900">1 USDC</span> together in one atomic group.
            <br />
            <span className="text-slate-500">Note: Receiver must be opted-in to USDC (ID: 10458941).</span>
          </p>

          {/* Opt-in button for connected wallet */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <button
              type="button"
              className={`
                btn rounded-xl w-full sm:w-auto
                ${alreadyOpted
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              `}
              onClick={handleOptInUSDC}
              disabled={optInLoading || !activeAddress || alreadyOpted}
            >
              {optInLoading ? (
                <span className="flex items-center gap-2">
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  Opting in…
                </span>
              ) : alreadyOpted ? (
                'Already Opted In'
              ) : (
                'Opt in USDC (my wallet)'
              )}
            </button>
          </div>

          {/* Receiver input (for atomic group) */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-slate-700 font-medium">Receiver&apos;s Address</span>
            </label>
            <input
              type="text"
              className="
                input input-bordered w-full rounded-xl
                bg-white text-slate-900 placeholder:text-slate-400
                border-slate-300 focus:outline-none
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                transition
              "
              placeholder="e.g., KPLX..."
              value={groupReceiverAddress}
              onChange={(e) => setGroupReceiverAddress(e.target.value)}
            />
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-slate-500">Bundle: 1 ALGO + 1 USDC</span>
              <span
                className={`font-mono ${
                  groupReceiverAddress.length === 58 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {groupReceiverAddress.length}/58
              </span>
            </div>
          </div>

          {/* Atomic send button */}
          <button
            type="button"
            className={`
              mt-4 btn w-full sm:w-auto rounded-xl font-semibold
              ${groupReceiverAddress.length === 58
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'}
            `}
            onClick={handleAtomicGroup}
            disabled={groupLoading || groupReceiverAddress.length !== 58}
          >
            {groupLoading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending Atomic…
              </span>
            ) : (
              'Send Atomic: 1 ALGO + 1 USDC'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default Transact
