"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Sparkles, Compass, Clock, MessageSquare, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [email, setEmail] = React.useState("")
  const [code, setCode] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [sandboxCode, setSandboxCode] = React.useState<string | null>(null)

  React.useEffect(() => {
    const root = window.document.documentElement
    const hadDark = root.classList.contains("dark")
    root.classList.remove("dark")
    root.classList.add("light")
    return () => {
      if (hadDark) {
        root.classList.remove("light")
        root.classList.add("dark")
      }
    }
  }, [])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Email tidak boleh kosong.")
      return
    }

    setLoading(true)
    setError(null)
    setSandboxCode(null)

    try {
      const res = await api.auth.forgotPassword(email)
      setSuccess(res.detail || "Kode verifikasi telah dikirim.")
      if (res.code_sandbox) {
        setSandboxCode(res.code_sandbox)
        setCode(res.code_sandbox) // Auto-fill for convenience
      }
      setStep(2)
    } catch (err: any) {
      setError(err.message || "Gagal mengirim kode verifikasi. Pastikan email Anda terdaftar.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !newPassword.trim()) {
      setError("Kode verifikasi dan password baru tidak boleh kosong.")
      return
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.resetPassword(email, code, newPassword)
      setSuccess(res.detail || "Password berhasil diubah.")
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Gagal mereset password. Pastikan kode verifikasi Anda benar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9FB] font-sans overflow-hidden relative">

      {/* Left promotional side panel - Hidden on Mobile */}
      <div className="hidden md:flex md:w-1/2 bg-[#060708] text-[#FAF9FB] flex-col justify-between p-16 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(198,181,191,0.15),transparent)] pointer-events-none" />
        
        <Link href="/" className="font-heading text-3xl font-black tracking-tight text-[#FAF9FB] hover:text-[#C6B5BF] transition-colors relative z-10">
          Belajara.
        </Link>
        
        <div className="space-y-8 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6B5BF]/10 border border-[#C6B5BF]/25 text-[#C6B5BF] text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-[#CF3A1F]" /> Keamanan Akun Mahasiswa & Instruktur
          </div>
          
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Kembalikan Akses Pembelajaran Anda
          </h2>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Pemulihan Akun Mandiri</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Gunakan alamat email terdaftar Anda untuk menerima kode verifikasi 6 digit secara instan untuk memperbarui kata sandi Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Proteksi Data Pengguna</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Semua transaksi perubahan sandi diproses menggunakan hashing berstandar industri demi menjaga privasi dan keamanan profil belajar Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 font-semibold relative z-10">
          &copy; {new Date().getFullYear()} Belajara. Platform Pembelajaran Interaktif Berbasis AI untuk Mahasiswa Indonesia.
        </p>
      </div>

      {/* Right form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden text-center space-y-1.5">
            <Link href="/" className="font-heading text-3xl font-black tracking-tight text-primary block">
              Belajara.
            </Link>
            <p className="text-xs text-muted-foreground font-semibold">
              Platform Pembelajaran Interaktif Berbasis AI
            </p>
          </div>
          
          <Card className="border border-border bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold font-heading text-primary">Lupa Password</CardTitle>
              <CardDescription className="text-xs">
                {step === 1 
                  ? "Masukkan alamat email Anda untuk menerima kode verifikasi pemulihan sandi."
                  : "Masukkan kode verifikasi yang Anda terima beserta password baru Anda."}
              </CardDescription>
            </CardHeader>
            
            {step === 1 ? (
              <form onSubmit={handleRequestCode}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-primary">Email Terdaftar</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan alamat email (cth: mhs@ui.ac.id)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border border-border focus:ring-accent rounded-lg text-xs"
                      disabled={loading}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-xs"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mengirim Kode...</span>
                      </>
                    ) : (
                      <span>Kirim Kode Verifikasi</span>
                    )}
                  </Button>

                  <div className="text-xs text-center text-muted-foreground mt-2 font-semibold flex items-center justify-center gap-1">
                    <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                    <Link href="/login" className="font-bold text-slate-800 hover:text-accent transition-colors">
                      Kembali ke Halaman Masuk
                    </Link>
                  </div>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-start gap-2 border border-emerald-200">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
                      <span>{success}</span>
                    </div>
                  )}

                  {sandboxCode && (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-900">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> Testing Sandbox Mode
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        Kode verifikasi Anda adalah: <strong className="font-mono text-xs text-amber-950 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200">{sandboxCode}</strong>.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-xs font-semibold text-primary">Kode Verifikasi (6 Digit)</Label>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="bg-white border border-border focus:ring-accent rounded-lg text-xs tracking-widest font-bold text-center"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold text-primary">Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white border border-border focus:ring-accent rounded-lg text-xs pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer border-0 bg-transparent p-0 flex items-center justify-center h-5 w-5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-xs"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mereset Password...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); setSuccess(null); }}
                    className="text-xs text-center text-muted-foreground hover:text-slate-800 transition-colors font-semibold bg-transparent border-0 cursor-pointer"
                  >
                    Kirim ulang kode verifikasi
                  </button>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
