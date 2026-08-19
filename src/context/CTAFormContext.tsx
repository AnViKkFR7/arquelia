import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CTAModal } from '../components/forms/CTAModal'
import { CTAForm } from '../components/forms/CTAForm'

interface CTAFormContextValue {
  openForm: () => void
  closeForm: () => void
}

const CTAFormContext = createContext<CTAFormContextValue | null>(null)

export function CTAFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openForm = useCallback(() => setIsOpen(true), [])
  const closeForm = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ openForm, closeForm }), [openForm, closeForm])

  return (
    <CTAFormContext.Provider value={value}>
      {children}
      <CTAModal isOpen={isOpen} onClose={closeForm}>
        <CTAForm onDone={closeForm} />
      </CTAModal>
    </CTAFormContext.Provider>
  )
}

export function useCTAForm() {
  const ctx = useContext(CTAFormContext)
  if (!ctx) throw new Error('useCTAForm debe usarse dentro de CTAFormProvider')
  return ctx
}
