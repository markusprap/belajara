"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Sparkles, Compass, Clock, CheckCircle2, ArrowLeft } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [sandboxCode, setSandboxCode] = React.useState<string | null>(null)
  
  const [redirectUrl, setRedirectUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    const root = window.document.documentElement
    const hadDark = root.classList.contains("dark")
    root.classList.remove("dark")
    root.classList.add("light")
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get("email") || ""
      setEmail(emailParam)
      setRedirectUrl(params.get("redirect"))

      // Check for sandbox code in local storage
      if (emailParam) {
        const cachedSandbox = localStorage.getItem(`verify_code_sandbox_${emailParam}`)
        if (cachedSandbox) {
          setSandboxCode(cachedSandbox)
          setCode(cachedSandbox) // auto-fill for testing ease
        }
      }
    }

    return () => {
      if (hadDark) {
        root.classList.remove("light")
        root.classList.add("dark")
      }
    }
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Kode verifikasi tidak boleh kosong.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.verifyEmail(email, code)
      setSuccess(res.detail || "Email berhasil diverifikasi! Akun Anda kini aktif.")
      
      // Clean up sandbox code from local storage
      if (email) {
        localStorage.removeItem(`verify_code_sandbox_${email}`)
      }

      setTimeout(() => {
        router.push(redirectUrl ? `/login?redirect=${redirectUrl}` : "/login")
      }, 2500)
    } catch (err: any) {
      setError(err.message || "Verifikasi gagal. Pastikan kode yang dimasukkan sudah benar.")
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
            <Sparkles className="h-3.5 w-3.5 text-[#CF3A1F]" /> Aktivasi Akun Belajar Anda
          </div>
          
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Verifikasi Email Untuk Mulai Belajar
          </h2>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Langkah Terakhir Pendaftaran</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Masukkan kode verifikasi 6 digit yang dikirimkan ke email terdaftar Anda untuk mengonfirmasi bahwa email tersebut adalah milik Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Proses Instan & Aman</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Setelah terverifikasi, akun Anda akan langsung aktif sehingga Anda dapat masuk dan mengakses dasbor kurikulum serta kelas AI secara penuh.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 font-semibold relative z-10">
          &copy; {new Date().getFullYear()} Belajara. Platform Pembelajaran Interaktif Berbasis AI untuk Mahasiswa Indonesia.
        </p>
      </div>

      {/* Right panel */}
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
              <CardTitle className="text-2xl font-bold font-heading text-primary">Verifikasi Email</CardTitle>
              <CardDescription className="text-xs">
                Masukkan kode verifikasi 6 digit yang dikirimkan ke email <strong className="text-slate-800">{email}</strong>.
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleVerify}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-start gap-2 border border-emerald-200 animate-pulse">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{success}</span>
                  </div>
                )}

                {sandboxCode && (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-900">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Testing Sandbox Mode
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
                    disabled={loading || !!success}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-xs"
                  disabled={loading || !!success}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Verifikasi Akun</span>
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
          </Card>
        </div>
      </div>
    </div>
  )
}
