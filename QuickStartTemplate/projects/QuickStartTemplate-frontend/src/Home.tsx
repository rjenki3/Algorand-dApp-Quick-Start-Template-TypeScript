// Home.tsx - Cyberpunk Redesign

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

const neonBorder = "border border-[#00fff7]"
const glassBg = "bg-[#181824]/90 backdrop-blur"
const glowText = "text-[#00fff7] font-bold"
const iconStyle = "text-2xl text-[#ff00cc]"

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className={`min-h-screen ${glassBg} flex flex-col items-center justify-between font-mono`}>
      {/* Navbar */}
      <nav className={`w-full flex items-center justify-between px-4 py-3 ${neonBorder}`}>
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 flex items-center justify-center rounded-full bg-[#ff00cc] text-[#181824] font-bold border border-[#00fff7]">A</span>
          <span className={`${glowText} text-lg tracking-widest`}>Algorand CyberdApp</span>
        </div>
        <button
          className={`flex items-center gap-2 px-3 py-1 rounded ${neonBorder} text-xs ${glowText}`}
          onClick={() => setOpenWalletModal(true)}
        >
          <BsWallet2 className="text-[#00fff7]" />
          {activeAddress ? 'Wallet Linked' : 'Connect'}
        </button>
      </nav>

      {/* Hero */}
      <header className="w-full flex flex-col items-center py-10">
        <div className="flex items-center gap-2 mb-2">
          <AiOutlineWallet className={iconStyle} />
          <span className={`${glowText} text-xs`}>Neon Network</span>
        </div>
        <h2 className={`${glowText} text-3xl text-center mb-2`}>Minimal Cyberpunk dApp</h2>
        <p className="text-[#e0e0ff] text-sm text-center max-w-md mb-4">
          Connect your wallet, send payments, mint NFTs, create tokens, and interact with contracts.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenWalletModal(true)}
            className={`px-4 py-2 rounded ${neonBorder} ${glowText} text-xs`}
          >
            {activeAddress ? 'Manage Wallet' : 'Connect Wallet'}
          </button>
          <a
            href="#features"
            className={`px-4 py-2 rounded ${neonBorder} ${glowText} text-xs`}
          >
            Features
          </a>
        </div>
      </header>

      {/* Features */}
      <main id="features" className="w-full flex-1 flex flex-col items-center">
        {activeAddress ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            <button
              className={`flex flex-col items-center gap-2 p-4 rounded ${glassBg} ${neonBorder} hover:bg-[#23234a]`}
              onClick={() => setOpenPaymentModal(true)}
            >
              <AiOutlineSend className={iconStyle} />
              <span className={`${glowText} text-sm`}>Send Payment</span>
            </button>
            <button
              className={`flex flex-col items-center gap-2 p-4 rounded ${glassBg} ${neonBorder} hover:bg-[#23234a]`}
              onClick={() => setOpenMintModal(true)}
            >
              <AiOutlineStar className={iconStyle} />
              <span className={`${glowText} text-sm`}>Mint NFT</span>
            </button>
            <button
              className={`flex flex-col items-center gap-2 p-4 rounded ${glassBg} ${neonBorder} hover:bg-[#23234a]`}
              onClick={() => setOpenTokenModal(true)}
            >
              <BsArrowUpRightCircle className={iconStyle} />
              <span className={`${glowText} text-sm`}>Create Token</span>
            </button>
            <button
              className={`flex flex-col items-center gap-2 p-4 rounded ${glassBg} ${neonBorder} hover:bg-[#23234a]`}
              onClick={() => setOpenAppCallsModal(true)}
            >
              <AiOutlineDeploymentUnit className={iconStyle} />
              <span className={`${glowText} text-sm`}>Contract Interactions</span>
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center py-10">
            <p className="text-[#e0e0ff] text-base mb-4 text-center">
              ⚡ Connect your wallet to unlock neon features.
            </p>
            <button
              className={`px-6 py-3 rounded ${neonBorder} ${glowText} text-sm`}
              onClick={() => setOpenWalletModal(true)}
            >
              Connect Wallet
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#00fff7] font-bold border-t border-[#00fff7]">
        Minimal cyberpunk dApp template.
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
