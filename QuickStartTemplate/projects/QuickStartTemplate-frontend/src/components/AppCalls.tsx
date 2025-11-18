import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import {
  AiOutlineDeploymentUnit,
  AiOutlineLoading3Quarters,
  AiOutlineWarning,
} from 'react-icons/ai'
import { HelloWorldFactory } from '../contracts/HelloWorld'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [contractInput, setContractInput] = useState<string>('')
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })
  algorand.setDefaultSigner(transactionSigner)

  const sendAppCall = async () => {
    setLoading(true)

    const factory = new HelloWorldFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    })

    const deployResult = await factory
      .deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })
      .catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return undefined
      })

    if (!deployResult) return

    const { appClient } = deployResult

    const response = await appClient.send
      .hello({ args: { name: contractInput } })
      .catch((e: Error) => {
        enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return undefined
      })

    if (!response) return

    enqueueSnackbar(`Response from the contract: ${response.return}`, { variant: 'success' })
    setLoading(false)
  }

  return (
    <dialog
      id="appcalls_modal"
      className={`modal modal-bottom sm:modal-middle ${openModal ? 'modal-open' : ''}`}
    >
      <div
        className={`
          modal-box w-full max-w-lg rounded-2xl border border-gray-200
          bg-white text-slate-900 p-6 sm:p-7 shadow-2xl
        `}
      >
        {/* Top loading bar */}
        {loading && (
          <div className="relative h-1 w-full -mt-2 mb-4 overflow-hidden rounded bg-gray-100">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-indigo-500" />
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
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <AiOutlineDeploymentUnit className="text-2xl text-indigo-600" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
                Smart Contract Interaction
              </h3>
              <p className="text-sm text-slate-500">Deploy + call demo (frontend example).</p>
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

        {/* Warning note */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
          <p className="flex items-start gap-2 text-sm text-amber-700">
            <AiOutlineWarning className="text-lg flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> This demo deploys the contract directly in the frontend.
              In production, deployment should happen server-side and be referenced by ID.
            </span>
          </p>
        </div>

        {/* Input field */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-slate-700 font-medium">
              Input for <code>hello</code> function
            </span>
          </label>
          <input
            type="text"
            className="
              input input-bordered w-full rounded-xl
              bg-white text-slate-900 placeholder:text-slate-400
              border-gray-200 focus:outline-none
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
            "
            placeholder="e.g., world!"
            value={contractInput}
            onChange={(e) => setContractInput(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="modal-action mt-7 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            type="button"
            className={`
              btn w-full sm:w-auto rounded-xl font-semibold
              ${contractInput
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'}
            `}
            onClick={sendAppCall}
            disabled={loading || !contractInput}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending…
              </span>
            ) : (
              'Send Application Call'
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

export default AppCalls
