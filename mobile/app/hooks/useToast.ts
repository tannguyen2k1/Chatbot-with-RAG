import { useState, useCallback } from 'react'

interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type,
    })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }))
  }, [])

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const showError = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info')
  }, [showToast])

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
  }
}
