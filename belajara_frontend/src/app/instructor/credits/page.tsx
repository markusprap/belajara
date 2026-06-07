"use client"

import React, { useEffect, useState } from "react"
import { Sparkles, Coins, ArrowRight, CreditCard, Lock, Calendar, DollarSign, FileText, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface CreditTransaction {
  id: number
  amount: number
  description: string
  reference_id: string | null
  created_at: string
}

export default function InstructorCreditsPage() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.instructor.getCredits()
      if (response) {
        setCredits(response.ai_credits)
        setTransactions(response.transactions || [])
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data kredit AI.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Load Midtrans snap.js dynamically on mount
    const scriptId = "midtrans-snap"
    let script = document.getElementById(scriptId) as HTMLScriptElement
    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js"
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
      )
      document.body.appendChild(script)
    }
  }, [])

  const handleCheckout = async (packageId: "package_10" | "package_50" | "package_100") => {
    setIsCheckoutLoading(packageId)
    setError(null)
    try {
      const response = await api.payment.checkoutCredits(packageId)
      if (response && response.snap_token) {
        const token = response.snap_token
        if (token.startsWith("mock-")) {
          // Simulate payment checkout for tests / mock-mode
          showToast("info", "Menyimulasikan transaksi Snap...")
          setTimeout(async () => {
            try {
              await api.payment.verify(response.order_id, "success")
              showToast("success", "Top-up Kredit AI berhasil! (Simulasi)")
              fetchData()
            } catch (e) {
              console.error(e)
            }
            setIsCheckoutLoading(null)
          }, 1500)
        } else {
          // Launch real sandbox checkout
          // Launch real checkout
          const isSandbox = response.snap_url ? response.snap_url.includes("sandbox") : true;
          const snapSrc = isSandbox
            ? "https://app.sandbox.midtrans.com/snap/snap.js"
            : "https://app.midtrans.com/snap/snap.js";

          let snapScript = document.getElementById("midtrans-snap") as HTMLScriptElement | null;
          if (snapScript && snapScript.src !== snapSrc) {
            snapScript.remove();
            snapScript = null;
          }

          const triggerSnap = () => {
            if ((window as any).snap) {
              (window as any).snap.pay(token, {
                onSuccess: async (result: any) => {
                  const targetOrderId = response.order_id || result?.order_id
                  try {
                    await api.payment.verify(targetOrderId, "success")
                    showToast("success", "Top-up Kredit AI berhasil! Kredit Anda telah ditambahkan.")
                    fetchData()
                  } catch (e) {
                    console.error(e)
                  }
                  setIsCheckoutLoading(null)
                },
                onPending: () => {
                  showToast("info", "Pembayaran tertunda. Silakan selesaikan pembayaran Anda.")
                  setIsCheckoutLoading(null)
                },
                onError: async () => {
                  setError("Pembayaran gagal. Silakan coba lagi.")
                  setIsCheckoutLoading(null)
                  try {
                    await api.payment.cancelTransaction(response.order_id)
                  } catch (e) {
                    console.warn(e)
                  }
                },
                onClose: async () => {
                  setIsCheckoutLoading(null)
                  try {
                    await api.payment.cancelTransaction(response.order_id)
                  } catch (e) {
                    console.warn(e)
                  }
                },
              })
            }
          };

          if (!snapScript) {
            const script = document.createElement("script");
            script.id = "midtrans-snap";
            script.src = snapSrc;
            script.setAttribute(
              "data-client-key",
              process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""
            );
            document.body.appendChild(script);
            script.onload = triggerSnap;
          } else {
            triggerSnap();
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal memproses pembayaran. Coba lagi.")
      setIsCheckoutLoading(null)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const packages = [
    {
      id: "package_10" as const,
      name: "Starter Pack",
      tokens: 10,
      price: 50000,
      tagline: "Cocok untuk mencoba asisten AI",
      badge: null,
      bg: "bg-white",
      borderColor: "border-[#E8E5E9]",
      btnStyle: "bg-transparent border-[#060708] text-[#060708] hover:bg-[#FAF9FB]",
    },
    {
      id: "package_50" as const,
      name: "Medium Pack",
      tokens: 50,
      price: 200000,
      tagline: "Paling populer untuk dosen aktif",
      badge: "BEST VALUE",
      bg: "bg-[#FAF9FB]",
      borderColor: "border-[#C6B5BF] border-2",
      btnStyle: "bg-[#060708] text-white hover:bg-[#060708]/90",
    },
    {
      id: "package_100" as const,
      name: "Professional Pack",
      tokens: 100,
      price: 350000,
      tagline: "Untuk kurikulum skala besar",
      badge: "PREMIUM",
      bg: "bg-[#060708] text-white",
      borderColor: "border-[#060708]",
      btnStyle: "bg-white text-[#060708] hover:bg-slate-100",
    },
  ]

  const pageContent = (
    <div className="credits-page max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : toast.type === "error"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hero / Header Balance Section */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <div className="flex-1 p-6 md:p-8 rounded-3xl border border-[#E8E5E9] bg-white shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#CF3A1F]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-[#FAF9FB] border border-[#E8E5E9] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#7E7C82]">
              <Sparkles size={11} className="text-[#CF3A1F]" />
              Sistem Kredit AI Instruktur
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-[#060708] leading-tight">
              Susun dan Rancang Kelas Anda<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#060708] to-[#CF3A1F]">Lebih Cepat</span> dengan AI
            </h1>
            <p className="text-xs text-[#7E7C82] leading-relaxed max-w-xl">
              Gunakan kredit AI Anda untuk memproses asisten AI dalam membuat draf materi, menyusun quiz interaktif secara otomatis, atau menganalisis silabus kurikulum.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-[#F3F1F4] pt-6 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FAF9FB] border border-[#E8E5E9] flex items-center justify-center text-[#7E7C82]">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7E7C82]">Saldo Token AI Anda</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-[#060708]">
                    {loading ? "..." : (credits !== null ? credits : "0")}
                  </span>
                  <span className="text-xs font-bold text-[#7E7C82]">Token</span>
                </div>
              </div>
            </div>
            
            {credits !== null && credits === 0 && (
              <Badge className="bg-[#CF3A1F]/10 border border-[#CF3A1F]/20 text-[#CF3A1F] hover:bg-[#CF3A1F]/20 font-extrabold text-[9px] tracking-wider py-1 px-2.5 rounded-lg">
                KREDIT HABIS
              </Badge>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="w-full md:w-80 p-6 rounded-3xl border border-[#E8E5E9] bg-[#FAF9FB] flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#060708]">Ketentuan Pemakaian</h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CF3A1F] mt-1.5 shrink-0" />
                <p className="text-[11px] text-[#7E7C82] leading-relaxed">
                  Pendaftaran akun baru otomatis mendapatkan <strong>20 free token</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CF3A1F] mt-1.5 shrink-0" />
                <p className="text-[11px] text-[#7E7C82] leading-relaxed">
                  Setiap pemakaian asisten AI (buat materi/kuis/kurikulum) memotong <strong>1 token</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CF3A1F] mt-1.5 shrink-0" />
                <p className="text-[11px] text-[#7E7C82] leading-relaxed">
                  Kredit habis dapat langsung diisi ulang melalui paket top-up di bawah.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white rounded-xl border border-[#E8E5E9] flex items-center justify-between text-[10px] text-[#7E7C82] font-semibold">
            <span>Powered by Midtrans Snap</span>
            <Lock size={12} className="text-[#C6B5BF]" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Top-up Packages Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-black text-[#060708] tracking-tight">Pilih Paket Top-up Kredit</h2>
          <p className="text-[11px] text-[#7E7C82]">Pembayaran instan, otomatis diproses setelah pembayaran sukses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isLoading = isCheckoutLoading === pkg.id
            const isDark = pkg.bg.includes("bg-[#060708]")
            return (
              <div 
                key={pkg.id} 
                className={`p-6 rounded-2xl border ${pkg.borderColor} ${pkg.bg} flex flex-col justify-between relative group hover:shadow-sm transition-all duration-300`}
              >
                {pkg.badge && (
                  <span className={`absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider ${
                    isDark ? "bg-[#CF3A1F] text-white" : "bg-[#060708] text-white"
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className={`font-heading font-black text-sm uppercase tracking-wide ${isDark ? "text-slate-300" : "text-[#7E7C82]"}`}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black tracking-tight">{pkg.tokens}</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-[#7E7C82]"}`}>Token</span>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-[#7E7C82]"}`}>
                    {pkg.tagline}
                  </p>

                  <div className="border-t border-current opacity-10 pt-4" />

                  <div className="flex items-baseline gap-1">
                    <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-[#7E7C82]"}`}>Harga:</span>
                    <span className="text-lg font-black">{formatRupiah(pkg.price)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(pkg.id)}
                  disabled={isCheckoutLoading !== null}
                  className={`mt-6 w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${pkg.btnStyle}`}
                >
                  {isLoading ? (
                    "Memproses..."
                  ) : (
                    <>
                      Beli Sekarang
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-black text-[#060708] tracking-tight">Riwayat Kredit AI</h2>
          <p className="text-[11px] text-[#7E7C82]">Riwayat pemakaian asisten AI dan transaksi top-up koin.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E5E9] overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#7E7C82] font-medium">
              Memuat riwayat transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7E7C82] font-medium">
              Belum ada riwayat transaksi kredit AI.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E5E9] bg-[#FAF9FB]">
                    <th className="p-4 font-bold uppercase tracking-wider text-[9px] text-[#7E7C82]">Tanggal</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[9px] text-[#7E7C82]">Deskripsi</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[9px] text-[#7E7C82]">Order ID</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[9px] text-[#7E7C82] text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0
                    const dateFormatted = new Date(tx.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })

                    return (
                      <tr key={tx.id} className="border-b border-[#F3F1F4] hover:bg-[#FAF9FB]/30 transition-colors">
                        <td className="p-4 text-slate-600 font-medium">{dateFormatted}</td>
                        <td className="p-4 font-semibold text-[#060708]">{tx.description}</td>
                        <td className="p-4 text-[#7E7C82] font-mono">{tx.reference_id || "-"}</td>
                        <td className={`p-4 text-right font-black ${
                          isPositive ? "text-emerald-600" : "text-[#CF3A1F]"
                        }`}>
                          {isPositive ? `+${tx.amount}` : tx.amount} Token
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">
            Kredit AI Instruktur
          </div>
        </header>
        <div className="flex-1 bg-[#FAF9FB] overflow-y-auto">
          {pageContent}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
