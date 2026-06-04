"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, Bell, Info, ShieldAlert, KeyRound, CreditCard, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { getToken, api, getUser } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  
  // Password form states
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null)

  // Subscription & billing states
  const [subData, setSubData] = React.useState<any>(null)
  const [subLoading, setSubLoading] = React.useState(true)
  const [cancelLoading, setCancelLoading] = React.useState(false)
  const [billingError, setBillingError] = React.useState<string | null>(null)
  const [transactions, setTransactions] = React.useState<any[]>([])

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }
    
    const u = getUser()
    setUser(u)

    // Load billing status & transactions
    const fetchBillingData = async () => {
      try {
        setSubLoading(true)
        const billing = await api.payment.mySubscription()
        setSubData(billing)

        const txHistory = await api.payment.transactions()
        setTransactions(txHistory || [])
      } catch (err: any) {
        setBillingError("Gagal memuat informasi pembayaran.")
      } finally {
        setSubLoading(false)
      }
    }

    fetchBillingData()
  }, [router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua field kata sandi wajib diisi.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Sandi baru minimal 6 karakter.")
      return
    }

    try {
      setPasswordLoading(true)
      const res = await api.auth.changePassword(oldPassword, newPassword)
      setPasswordSuccess(res.detail || "Kata sandi Anda berhasil diperbarui.")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordError(err.message || "Gagal mengubah kata sandi.")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan perpanjangan otomatis langganan premium Anda?")) {
      return
    }

    try {
      setCancelLoading(true)
      setBillingError(null)
      const res = await api.payment.cancelSubscription()
      
      // Refresh sub status
      const updatedSub = await api.payment.mySubscription()
      setSubData(updatedSub)
      
      // Update local storage premium metadata (access remains active but renewal cancels)
      const u = getUser()
      if (u && updatedSub.subscription) {
        u.is_premium = updatedSub.subscription.is_active
        localStorage.setItem("user", JSON.stringify(u))
        setUser(u)
      }
      
      alert(res.detail || "Langganan berhasil dibatalkan. Akses tetap aktif hingga akhir periode.")
    } catch (err: any) {
      setBillingError(err.message || "Gagal memproses pembatalan.")
    } finally {
      setCancelLoading(false)
    }
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "-"
    return new Date(isoStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  }

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">
            Pengaturan Akun & Aplikasi
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB] overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-black text-[#060708] tracking-tight">Pengaturan</h1>
              <p className="text-xs text-[#7E7C82] mt-1 leading-relaxed">
                Kelola keamanan, paket pembayaran, notifikasi, dan preferensi akun Belajara Anda.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Localisation & Notification Settings */}
              <div className="md:col-span-1 space-y-6">
                <Card className="bg-white border border-[#E8E5E9] shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#F3F1F4] bg-[#FAF9FB]/50">
                    <CardTitle className="font-heading text-sm text-[#060708] flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#CF3A1F]" /> Lokalisasi & Tampilan
                    </CardTitle>
                    <CardDescription className="text-[10px] text-[#7E7C82]">Atur preferensi bahasa dan tema.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[#060708]">Bahasa Sistem</Label>
                      <select className="text-xs border border-[#E8E5E9] rounded-xl p-2 bg-white w-full focus:outline-hidden" defaultValue="id">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English (US)</option>
                      </select>
                    </div>

                    <div className="space-y-1 pt-2">
                      <Label className="text-xs font-bold text-[#060708]">Tema Aplikasi</Label>
                      <select className="text-xs border border-[#E8E5E9] rounded-xl p-2 bg-white w-full focus:outline-hidden" defaultValue="light">
                        <option value="light">Terang (Qurtuba Light)</option>
                        <option value="dark" disabled>Gelap (Segera Hadir)</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-[#E8E5E9] shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#F3F1F4] bg-[#FAF9FB]/50">
                    <CardTitle className="font-heading text-sm text-[#060708] flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#CF3A1F]" /> Preferensi Notifikasi
                    </CardTitle>
                    <CardDescription className="text-[10px] text-[#7E7C82]">Kelola saluran pemberitahuan.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-[#060708]">Notifikasi Email</Label>
                        <p className="text-[9px] text-[#7E7C82] leading-tight">Terima email rangkuman modul baru & ulasan kuis.</p>
                      </div>
                      <input type="checkbox" className="h-4 w-4 accent-[#060708] mt-0.5 cursor-pointer" defaultChecked />
                    </div>

                    <div className="flex items-start gap-2 justify-between pt-2 border-t border-[#F3F1F4]">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-[#060708]">Rekomendasi AI</Label>
                        <p className="text-[9px] text-[#7E7C82] leading-tight">Notifikasi instan ketika analisis dokumen silabus selesai.</p>
                      </div>
                      <input type="checkbox" className="h-4 w-4 accent-[#060708] mt-0.5 cursor-pointer" defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Security and Billing Settings */}
              <div className="md:col-span-2 space-y-6">
                {/* Change Password Card */}
                <Card className="bg-white border border-[#E8E5E9] shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#F3F1F4] bg-[#FAF9FB]/50">
                    <CardTitle className="font-heading text-sm text-[#060708] flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#CF3A1F]" /> Keamanan Akun
                    </CardTitle>
                    <CardDescription className="text-[10px] text-[#7E7C82]">Perbarui kata sandi akun masuk Anda secara rutin.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-[#CF3A1F] text-xs rounded-xl flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{passwordError}</span>
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>{passwordSuccess}</span>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[#060708]">Sandi Lama</Label>
                          <Input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Sandi lama Anda"
                            className="bg-white text-xs h-9 rounded-xl border-[#E8E5E9]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[#060708]">Sandi Baru</Label>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 karakter"
                            className="bg-white text-xs h-9 rounded-xl border-[#E8E5E9]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[#060708]">Konfirmasi Sandi Baru</Label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi sandi baru"
                            className="bg-white text-xs h-9 rounded-xl border-[#E8E5E9]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={passwordLoading}
                          className="bg-[#060708] hover:bg-[#060708]/90 text-white cursor-pointer text-xs h-9 px-4 rounded-xl"
                        >
                          {passwordLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                              Memproses...
                            </>
                          ) : (
                            "Perbarui Kata Sandi"
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Billing & Subscription Card */}
                {!user.is_instructor && (
                  <Card className="bg-white border border-[#E8E5E9] shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-[#F3F1F4] bg-[#FAF9FB]/50">
                      <CardTitle className="font-heading text-sm text-[#060708] flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#CF3A1F]" /> Langganan & Detail Billing
                      </CardTitle>
                      <CardDescription className="text-[10px] text-[#7E7C82]">Kelola tagihan, tier keanggotaan, dan unduh riwayat kuitansi.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-6">
                      {billingError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-[#CF3A1F] text-xs rounded-xl flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{billingError}</span>
                        </div>
                      )}

                      {subLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-[#CF3A1F]" />
                          <span className="text-xs">Memuat billing...</span>
                        </div>
                      ) : (
                        <>
                          {/* Plan Status Overview */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#FAF9FB] rounded-2xl border border-[#E8E5E9] gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-sm text-[#060708]">
                                  {subData?.has_subscription
                                    ? `Belajara ${subData.subscription.tier === "pro" ? "Pro" : "Scholar"}`
                                    : "Paket Gratis (Free)"}
                                </span>
                                <Badge
                                  className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border-0 hover:bg-transparent ${
                                    subData?.has_subscription
                                      ? subData.subscription.status === "active"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-amber-50 text-amber-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {subData?.has_subscription
                                    ? subData.subscription.status === "active"
                                      ? "Aktif"
                                      : "Dibatalkan (Menunggu Kedaluwarsa)"
                                    : "Masa Aktif Selamanya"}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-[#7E7C82]">
                                {subData?.has_subscription
                                  ? subData.subscription.status === "active"
                                    ? `Pembaruan otomatis berikutnya sebesar ${formatIDR(subData.subscription.monthly_price)} pada ${formatDate(subData.subscription.current_period_end)}.`
                                    : `Akses premium Scholar/Pro tetap aktif hingga ${formatDate(subData.subscription.current_period_end)}.`
                                  : "Fasilitas gratis terbatas. Upgrade untuk akses rekomendasi AI instan tanpa batas."}
                              </p>
                            </div>

                            {subData?.has_subscription && subData.subscription.status === "active" && (
                              <Button
                                onClick={handleCancelSubscription}
                                disabled={cancelLoading}
                                variant="outline"
                                className="border-[#CF3A1F]/30 hover:bg-[#CF3A1F]/5 text-[#CF3A1F] text-xs h-9 px-4 rounded-xl cursor-pointer shrink-0"
                              >
                                {cancelLoading ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                    Menyimpan...
                                  </>
                                ) : (
                                  "Batalkan Perpanjangan"
                                )}
                              </Button>
                            )}

                            {!subData?.has_subscription && (
                              <Button
                                onClick={() => router.push("/pricing")}
                                className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white text-xs h-9 px-4 rounded-xl cursor-pointer shrink-0"
                              >
                                Upgrade Sekarang
                              </Button>
                            )}
                          </div>

                          {/* Billing Invoice History Table */}
                          <div className="space-y-3">
                            <h4 className="font-heading font-bold text-xs text-[#060708]">Riwayat Transaksi Pembayaran</h4>
                            <div className="border border-[#E8E5E9] rounded-2xl overflow-hidden bg-white shadow-3xs">
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                  <thead>
                                    <tr className="bg-[#FAF9FB] border-b border-[#E8E5E9] text-[#7E7C82] font-heading font-bold">
                                      <th className="p-3">Order ID</th>
                                      <th className="p-3">Tipe Pembayaran</th>
                                      <th className="p-3">Nominal</th>
                                      <th className="p-3">Tanggal</th>
                                      <th className="p-3">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F3F1F4]">
                                    {transactions.length === 0 ? (
                                      <tr>
                                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                          Belum ada riwayat transaksi pembayaran.
                                        </td>
                                      </tr>
                                    ) : (
                                      transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[#FAF9FB]/50 transition-colors">
                                          <td className="p-3 font-semibold text-[#060708]">{tx.order_id}</td>
                                          <td className="p-3 text-[#7E7C82]">{tx.transaction_type_display || tx.transaction_type}</td>
                                          <td className="p-3 font-medium text-[#060708]">{formatIDR(parseFloat(tx.amount))}</td>
                                          <td className="p-3 text-[#7E7C82]">{formatDate(tx.created_at)}</td>
                                          <td className="p-3">
                                            <Badge
                                              className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border-0 hover:bg-transparent ${
                                                tx.status === "success"
                                                  ? "bg-green-50 text-green-700"
                                                  : tx.status === "pending"
                                                  ? "bg-amber-50 text-amber-700"
                                                  : "bg-red-50 text-red-700"
                                              }`}
                                            >
                                              {tx.status_display || tx.status}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center mt-8">
              <Info className="h-3.5 w-3.5" /> Belajara v1.0.0 &bull; Secure Payments by Midtrans Snap API &bull; JWT Signed
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
