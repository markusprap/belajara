"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface AlertConfig {
  title: string
  message: string
  isOpen: boolean
}

interface ConfirmConfig {
  title: string
  message: string
  isOpen: boolean
  onConfirm: () => void
  onCancel?: () => void
  isDestructive?: boolean
}

interface ModalContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void
  showAlert: (title: string, message: string) => void
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    isDestructive?: boolean
  ) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: "",
    message: "",
    isOpen: false,
  })
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    title: "",
    message: "",
    isOpen: false,
    onConfirm: () => {},
    isDestructive: false
  })

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message, isOpen: true })
  }

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    isDestructive: boolean = false
  ) => {
    setConfirmConfig({
      title,
      message,
      isOpen: true,
      onConfirm: () => {
        onConfirm()
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      },
      onCancel: () => {
        if (onCancel) onCancel()
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      },
      isDestructive
    })
  }

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1))
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ModalContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white transform transition-all duration-300 animate-slide-in-right ${
              t.type === "success"
                ? "border-emerald-100"
                : t.type === "error"
                ? "border-rose-100"
                : "border-slate-100"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertTriangle className="h-5 w-5 text-[#CF3A1F] shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="h-5 w-5 text-[#C6B5BF] shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs font-semibold text-[#060708] leading-relaxed">
              {t.message}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-[#060708] transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Alert Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF9FB] border border-slate-200/80 rounded-2xl p-6 shadow-2xl animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#060708]" />
            <h3 className="font-heading text-lg font-black text-[#060708] tracking-tight">{alertConfig.title}</h3>
            <p className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">{alertConfig.message}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                className="bg-[#060708] hover:bg-slate-800 text-white font-bold text-xs h-9 px-6 rounded-xl shadow-md transition-all border-none cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF9FB] border border-slate-200/80 rounded-2xl p-6 shadow-2xl animate-scale-up relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${confirmConfig.isDestructive ? "bg-[#CF3A1F]" : "bg-[#060708]"}`} />
            <h3 className="font-heading text-lg font-black text-[#060708] tracking-tight">{confirmConfig.title}</h3>
            <p className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">{confirmConfig.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={confirmConfig.onCancel}
                className="bg-transparent hover:bg-slate-100 text-[#060708] border border-slate-200 font-bold text-xs h-9 px-5 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`text-white font-bold text-xs h-9 px-6 rounded-xl shadow-md transition-all border-none cursor-pointer ${
                  confirmConfig.isDestructive ? "bg-[#CF3A1F] hover:bg-[#CF3A1F]/90" : "bg-[#060708] hover:bg-slate-800"
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
