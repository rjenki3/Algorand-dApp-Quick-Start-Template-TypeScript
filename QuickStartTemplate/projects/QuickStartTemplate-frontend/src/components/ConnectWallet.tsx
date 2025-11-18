// ConnectWallet.tsx
// Modal for selecting and connecting a wallet provider (Pera, Defly, KMD, etc).
// Uses @txnlab/use-wallet-react to manage multiple wallet options.
// 🔹 UI-only redesign — logic, props, and handlers unchanged.

import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import { BsWallet2, BsCheckCircleFill } from 'react-icons/bs'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  // Detect KMD (LocalNet dev wallet) since it has no icon
  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <dialog
      id="connect_wallet_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box max-w-lg bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BsWallet2 className="text-lg" />
            </span>
            Select wallet provider
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition text-sm"
            onClick={closeModal}
            aria-label="Close wallet modal"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Choose the wallet you want to connect. Supported: Pera, Defly, LocalNet (KMD), and others.
        </p>

        <div className="space-y-4">
          {activeAddress && (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <Account />
              </div>
              <div className="h-px bg-gray-200 my-2" />
            </>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white border border-gray-200
                  hover:border-indigo-200 hover:bg-indigo-50/50 transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-200
                `}
                key={`provider-${wallet.id}`}
                onClick={() => {
                  return wallet.connect()
                }}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    className="w-9 h-9 object-contain rounded-md border border-gray-100 bg-white"
                  />
                )}
                <span className="font-medium text-sm text-left flex-1 text-gray-900">
                  {isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}
                </span>
                {wallet.isActive && (
                  <BsCheckCircleFill className="text-lg text-emerald-500" />
                )}
              </button>
            ))}
        </div>

        <div className="modal-action mt-6 flex gap-3">
          <button
            data-test-id="close-wallet-modal"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 transition"
            onClick={() => {
              closeModal()
            }}
          >
            Close
          </button>

          {activeAddress && (
            <button
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default ConnectWallet
