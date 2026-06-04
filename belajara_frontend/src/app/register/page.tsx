"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle, Sparkles, Compass, Clock, MessageSquare } from "lucide-react"

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student", // "student" | "instructor"
    nim: "",
    jurusan: "Informatika",
    universitas: "Universitas Indonesia",
    semester: "3",
    nidn: "",
    bidang_keahlian: ""
  })
  
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Google OAuth Simulation states
  const [showGoogleModal, setShowGoogleModal] = React.useState(false)
  const [googleEmail, setGoogleEmail] = React.useState("")
  const [googleFirstName, setGoogleFirstName] = React.useState("")
  const [googleLastName, setGoogleLastName] = React.useState("")
  const [googleRole, setGoogleRole] = React.useState("mahasiswa")
  const [useCustomGoogle, setUseCustomGoogle] = React.useState(false)

  const [redirectUrl, setRedirectUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setRedirectUrl(params.get("redirect"))
    }
  }, [])

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

  const handleGoogleLogin = async (email: string, firstName: string, lastName: string, roleParam?: string) => {
    setLoading(true)
    setError(null)
    setShowGoogleModal(false)
    setUseCustomGoogle(false)
    try {
      const resolvedRole = roleParam || (googleRole === "instruktur" ? "instructor" : "student");
      const res = await api.auth.googleLogin(email, firstName, lastName, "mock-google-id", resolvedRole)
      const user = res?.user || api.auth.getUser()
      if (user?.is_instructor) {
        router.push('/instructor')
      } else {
        router.push(redirectUrl ? `/${redirectUrl}` : '/dashboard')
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validations based on role
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Kolom Username, Email, dan Password wajib diisi.")
      return
    }

    if (formData.role === "student" && !formData.nim.trim()) {
      setError("Kolom NIM wajib diisi untuk registrasi mahasiswa.")
      return
    }

    if (formData.role === "instructor" && !formData.nidn.trim()) {
      setError("Kolom NIDN wajib diisi untuk registrasi Dosen / Pengajar.")
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal harus terdiri dari 6 karakter.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        universitas: formData.universitas,
      }

      if (formData.role === "student") {
        payload.nim = formData.nim
        payload.jurusan = formData.jurusan
        payload.semester = parseInt(formData.semester)
      } else {
        payload.nidn = formData.nidn
        payload.bidang_keahlian = formData.bidang_keahlian
      }

      await api.auth.register(payload)
      setSuccess(true)
      setTimeout(() => {
        router.push(redirectUrl ? `/login?redirect=${redirectUrl}` : "/login")
      }, 2500)
    } catch (err: any) {
      setError(err.message || "Registrasi gagal. Username, NIM, atau NIDN mungkin sudah terdaftar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9FB] font-sans overflow-hidden relative">

      {/* Left promotional side panel - Hidden on Mobile */}
      <div className="hidden md:flex md:w-1/2 bg-[#060708] text-[#FAF9FB] flex-col justify-between p-16 relative overflow-hidden select-none">
        {/* Decorative elements / gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(198,181,191,0.15),transparent)] pointer-events-none" />
        
        {/* Brand */}
        <Link href="/" className="font-heading text-3xl font-black tracking-tight text-[#FAF9FB] hover:text-[#C6B5BF] transition-colors relative z-10">
          Belajara.
        </Link>
        
        {/* Features / Copy */}
        <div className="space-y-8 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6B5BF]/10 border border-[#C6B5BF]/25 text-[#C6B5BF] text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-[#CF3A1F]" /> Platform Rekomendasi Rencana Studi & Kelas Interaktif
          </div>
          
          <h2 className="font-heading text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Gabung Belajara & Rintis Masa Depan Akademikmu
          </h2>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Rencana Studi Berbasis AI</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Sistem kami akan merekomendasikan mata kuliah terbaik berdasarkan kurikulum yang Anda unggah.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Evaluasi Pembelajaran Berbasis AI</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Uji pemahaman Anda pada setiap bab dengan evaluasi pembelajaran berdurasi dan ketahui hasil Anda seketika.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Kolaborasi Diskusi Kelas</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Diskusikan pertanyaan Anda dengan rekan kelas dan dosen pengampu secara interaktif.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-500 font-semibold relative z-10">
          &copy; {new Date().getFullYear()} Belajara. Platform Terintegrasi Midtrans & AI untuk Perguruan Tinggi.
        </p>
      </div>

      {/* Right Register form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6">
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
              <CardTitle className="text-2xl font-bold font-heading text-primary">
                {formData.role === "student" ? "Registrasi Mahasiswa" : "Registrasi Dosen / Pengajar"}
              </CardTitle>
              <CardDescription className="text-xs">
                {formData.role === "student" 
                  ? "Isi data akademik Anda dengan lengkap untuk sinkronisasi kurikulum AI." 
                  : "Daftar sebagai Dosen / Pengajar untuk mengelola kelas dan modul belajar."}
              </CardDescription>
            </CardHeader>
          
          {success ? (
            <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-12 w-12 bg-accent/20 border border-accent/40 text-primary rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary">Registrasi Berhasil!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Akun Anda berhasil didaftarkan. Mengalihkan Anda ke halaman login...
              </p>
              <Loader2 className="h-5 w-5 text-accent animate-spin mt-2" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Segmented Control Role Selector */}
                <div className="space-y-1.5 pb-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daftar Sebagai</Label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-border select-none">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: "student" }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                        formData.role === "student"
                          ? "bg-white text-primary shadow-xs"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Mahasiswa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: "instructor" }))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                        formData.role === "instructor"
                          ? "bg-white text-primary shadow-xs"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Dosen / Pengajar
                    </button>
                  </div>
                </div>

                {/* Section: Akun Utama */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b pb-1">Detail Kredensial</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-semibold text-primary">Username *</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username_kamu"
                        value={formData.username}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-primary">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-primary">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-white border border-border rounded-lg"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name" className="text-xs font-semibold text-primary">Nama Depan</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        placeholder="Budi"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="last_name" className="text-xs font-semibold text-primary">Nama Belakang</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        placeholder="Santoso"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Data Akademik */}
                {formData.role === "student" && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b pb-1">Informasi Akademik</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="nim" className="text-xs font-semibold text-primary">NIM (Nomor Induk Mahasiswa) *</Label>
                        <Input
                          id="nim"
                          name="nim"
                          type="text"
                          placeholder="2201010101"
                          value={formData.nim}
                          onChange={handleChange}
                          className="bg-white border border-border rounded-lg"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="semester" className="text-xs font-semibold text-primary">Semester Saat Ini</Label>
                        <select
                          id="semester"
                          name="semester"
                          value={formData.semester}
                          onChange={handleChange}
                          className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
                          disabled={loading}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="jurusan" className="text-xs font-semibold text-primary">Jurusan / Program Studi</Label>
                      <select
                        id="jurusan"
                        name="jurusan"
                        value={formData.jurusan}
                        onChange={handleChange}
                        className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
                        disabled={loading}
                      >
                        <option value="Informatika">Informatika</option>
                        <option value="Sistem Informasi">Sistem Informasi</option>
                        <option value="Teknik Komputer">Teknik Komputer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="universitas" className="text-xs font-semibold text-primary">Universitas / Perguruan Tinggi</Label>
                      <Input
                        id="universitas"
                        name="universitas"
                        type="text"
                        placeholder="Universitas Indonesia"
                        value={formData.universitas}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Section: Data Pengajar */}
                {formData.role === "instructor" && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b pb-1">Informasi Dosen / Pengajar</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="nidn" className="text-xs font-semibold text-primary">NIDN (Nomor Induk Dosen) *</Label>
                        <Input
                          id="nidn"
                          name="nidn"
                          type="text"
                          placeholder="9876543210"
                          value={formData.nidn}
                          onChange={handleChange}
                          className="bg-white border border-border rounded-lg"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bidang_keahlian" className="text-xs font-semibold text-primary">Bidang Keahlian *</Label>
                        <Input
                          id="bidang_keahlian"
                          name="bidang_keahlian"
                          type="text"
                          placeholder="cth: Kecerdasan Buatan"
                          value={formData.bidang_keahlian}
                          onChange={handleChange}
                          className="bg-white border border-border rounded-lg"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="universitas" className="text-xs font-semibold text-primary">Universitas / Perguruan Tinggi</Label>
                      <Input
                        id="universitas"
                        name="universitas"
                        type="text"
                        placeholder="Universitas Indonesia"
                        value={formData.universitas}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-xs"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <span>Daftar Sekarang</span>
                  )}
                </Button>

                {/* Google Sign In Button */}
                <div className="relative flex py-1 items-center w-full">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">atau</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full bg-white hover:bg-slate-50 border border-border text-[#060708] font-bold text-xs h-9 rounded-lg shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  Daftar dengan Google
                </Button>

                <div className="text-xs text-center text-muted-foreground mt-2 font-semibold">
                  Sudah memiliki akun?{" "}
                  <Link
                    href={redirectUrl ? `/login?redirect=${redirectUrl}` : "/login"}
                    className="font-bold text-[#CF3A1F] hover:text-[#CF3A1F]/80 transition-colors"
                  >
                    Masuk di sini
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
      </div>

      {/* Google Login/Register Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm border border-border bg-white shadow-2xl rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <GoogleIcon />
              </div>
              <h3 className="font-heading text-lg font-bold text-primary">Daftar dengan Google</h3>
              <p className="text-[11px] text-muted-foreground">
                Pilih akun Google untuk melanjutkan pendaftaran ke Belajara.
              </p>
            </div>

            {!useCustomGoogle ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("budi@gmail.com", "Budi", "Santoso", "student")}
                  className="w-full p-2.5 rounded-xl border border-border hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#060708] text-white flex items-center justify-center font-bold text-xs select-none shrink-0">
                    BS
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">Budi Santoso</p>
                    <p className="text-[10px] text-muted-foreground truncate">budi@gmail.com (Mahasiswa)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleLogin("ahmad@gmail.com", "Ahmad", "Yani", "instructor")}
                  className="w-full p-2.5 rounded-xl border border-border hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C6B5BF] text-white flex items-center justify-center font-bold text-xs select-none shrink-0">
                    AY
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">Dr. Ir. Ahmad Yani</p>
                    <p className="text-[10px] text-muted-foreground truncate">ahmad@gmail.com (Dosen / Pengajar)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUseCustomGoogle(true)}
                  className="w-full p-2.5 rounded-xl border border-dashed border-border hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs font-semibold text-accent"
                >
                  Gunakan akun lain...
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="googleEmail" className="text-[10px] font-bold text-primary">Email Google</Label>
                  <Input
                    id="googleEmail"
                    type="email"
                    placeholder="nama@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="h-8 text-xs rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="googleFirstName" className="text-[10px] font-bold text-primary">Nama Depan</Label>
                    <Input
                      id="googleFirstName"
                      type="text"
                      placeholder="Joko"
                      value={googleFirstName}
                      onChange={(e) => setGoogleFirstName(e.target.value)}
                      className="h-8 text-xs rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="googleLastName" className="text-[10px] font-bold text-primary">Nama Belakang</Label>
                    <Input
                      id="googleLastName"
                      type="text"
                      placeholder="Susilo"
                      value={googleLastName}
                      onChange={(e) => setGoogleLastName(e.target.value)}
                      className="h-8 text-xs rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="googleRole" className="text-[10px] font-bold text-primary">Daftar Sebagai (Role)</Label>
                  <select
                    id="googleRole"
                    value={googleRole}
                    onChange={(e) => setGoogleRole(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-2 py-1 text-xs text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="instruktur">Dosen / Pengajar</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUseCustomGoogle(false)}
                    className="flex-1 h-8 text-xs rounded-lg cursor-pointer"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!googleEmail.trim()) return;
                      const emailSuffix = googleRole === "instruktur" ? "+instructor" : "";
                      const emailParts = googleEmail.split("@");
                      const customEmail = `${emailParts[0]}${emailSuffix}@${emailParts[1] || "gmail.com"}`;
                      handleGoogleLogin(customEmail, googleFirstName, googleLastName);
                    }}
                    className="flex-1 h-8 text-xs bg-primary text-white hover:bg-primary/95 rounded-lg cursor-pointer"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowGoogleModal(false);
                  setUseCustomGoogle(false);
                }}
                className="text-xs h-7 text-muted-foreground hover:text-primary cursor-pointer"
              >
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
