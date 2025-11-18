// Home.tsx - Professional Clean Light UI

import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import { AiOutlineDeploymentUnit, AiOutlineSend, AiOutlineStar, AiOutlineWallet } from 'react-icons/ai'
import { BsArrowUpRightCircle, BsWallet2 } from 'react-icons/bs'

// Frontend modals
import AppCalls from './components/AppCalls'
import ConnectWallet from './components/ConnectWallet'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'
import Transact from './components/Transact'

interface HomeProps {}

const cardBase = 'rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 bg-white'
const iconStyle = 'text-3xl text-gray-700'

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-inter">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-semibold">
            A
          </div>
          <div className="font-semibold text-gray-800 tracking-wide">Algorand dApp Template</div>
        </div>

        <button
          onClick={() => setOpenWalletModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <BsWallet2 className="text-white" />
          {activeAddress ? 'Wallet Linked' : 'Connect Wallet'}
        </button>
      </nav>

      {/* Hero */}
      <header className="flex flex-col items-center text-center py-16 px-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-4 py-1 text-sm font-medium mb-5">
          <AiOutlineWallet />
          <span>Algorand Universal Actions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Build Faster with a Universal dApp Surface
        </h1>
        <p className="text-gray-600 max-w-xl mb-8">
          Trigger common Algorand actions — payments, NFT minting, token creation, and contract calls — from a clean, unified interface.
        </p>

        {!activeAddress && (
          <button
            onClick={() => setOpenWalletModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-md transition"
          >
            Connect Wallet to Get Started
          </button>
        )}
      </header>

      {/* Features */}
      <main id="features" className="flex-1 flex flex-col items-center px-6 pb-16">
        {activeAddress ? (
          <div className="w-full max-w-5xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Available Actions</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                className={`${cardBase} flex flex-col items-start gap-3 p-5`}
                onClick={() => setOpenPaymentModal(true)}
              >
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700">
                  <AiOutlineSend className={iconStyle} />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">Send Payment</p>
                  <p className="text-sm text-gray-500">Transfer ALGO or assets.</p>
                </div>
              </button>

              <button
                className={`${cardBase} flex flex-col items-start gap-3 p-5`}
                onClick={() => setOpenMintModal(true)}
              >
                <div className="p-3 rounded-lg bg-pink-100 text-pink-700">
                  <AiOutlineStar className={iconStyle} />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">Mint NFT</p>
                  <p className="text-sm text-gray-500">Create a simple NFT collection.</p>
                </div>
              </button>

              <button
                className={`${cardBase} flex flex-col items-start gap-3 p-5`}
                onClick={() => setOpenTokenModal(true)}
              >
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
                  <BsArrowUpRightCircle className={iconStyle} />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">Create Token</p>
                  <p className="text-sm text-gray-500">Spin up a new ASA instantly.</p>
                </div>
              </button>

              <button
                className={`${cardBase} flex flex-col items-start gap-3 p-5`}
                onClick={() => setOpenAppCallsModal(true)}
              >
                <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
                  <AiOutlineDeploymentUnit className={iconStyle} />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">Contract Interactions</p>
                  <p className="text-sm text-gray-500">Call ARC-4 or app methods.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center mt-8 text-gray-600">
            <p>Connect your wallet to access all actions.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-5 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} Algorand Universal dApp Template. Built for clarity & speed.
      </footer>

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />
      <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
    </div>
  )
}

export default Home
