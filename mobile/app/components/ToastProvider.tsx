import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Toast } from './Toast'

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast])

  const value = useMemo(
    () => ({ toast, showToast, hideToast, showSuccess, showError, showInfo }),
    [toast, showToast, hideToast, showSuccess, showError, showInfo]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  )
}

type ToastContextValue = {
  toast: { visible: boolean; message: string; type: 'success' | 'error' | 'info' }
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
