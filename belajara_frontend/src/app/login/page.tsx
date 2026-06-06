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
import { AlertCircle, Loader2, Sparkles, Compass, Clock, MessageSquare, Eye, EyeOff } from "lucide-react"

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
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

  React.useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: "1051932175490-ir0vmmo1bb290nk73n5kn6tvcvf29b6i.apps.googleusercontent.com",
          callback: async (response: any) => {
            setLoading(true);
            setError(null);
            try {
              const payload = decodeJwt(response.credential);
              if (payload) {
                const email = payload.email;
                const firstName = payload.given_name || "";
                const lastName = payload.family_name || "";
                const googleId = payload.sub || "";
                
                const res = await api.auth.googleLogin(email, firstName, lastName, googleId);
                const user = res?.user || api.auth.getUser();
                if (user && user.is_onboarded === false) {
                  router.push('/onboarding');
                } else if (user?.is_instructor) {
                  router.push('/instructor');
                } else {
                  router.push(redirectUrl ? `/${redirectUrl}` : '/dashboard');
                }
              }
            } catch (err: any) {
              setError(err.message || "Gagal masuk dengan Google.");
            } finally {
              setLoading(false);
            }
          }
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-button-target"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%", 
            shape: "pill",
            text: "signin_with",
            logo_alignment: "center"
          }
        );
      }
    };

    const timer = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [redirectUrl, router]);

  const handleGoogleLogin = async (email: string, firstName: string, lastName: string, roleParam?: string) => {
    setLoading(true)
    setError(null)
    setShowGoogleModal(false)
    setUseCustomGoogle(false)
    try {
      const resolvedRole = roleParam || (googleRole === "instruktur" ? "instructor" : "student");
      const res = await api.auth.googleLogin(email, firstName, lastName, "mock-google-id", resolvedRole)
      const user = res?.user || api.auth.getUser()
      if (user && user.is_onboarded === false) {
        router.push('/onboarding')
      } else if (user?.is_instructor) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login(username, password)
      const user = res?.user || api.auth.getUser()
      if (user && user.is_onboarded === false) {
        router.push('/onboarding')
      } else if (user?.is_instructor) {
        router.push('/instructor')
      } else {
        router.push(redirectUrl ? `/${redirectUrl}` : '/dashboard')
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa kembali username dan password Anda.")
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
            Tingkatkan Kompetensi Studi Mahasiswa Indonesia
          </h2>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Rekomendasi Rencana Studi</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Unggah silabus studi Anda di halaman eksplorasi dan biarkan model Gemini AI merekomendasikan susunan rencana studi yang terstruktur.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Evaluasi Pemahaman Interaktif</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Uji kompetensi Anda dengan evaluasi pembelajaran berdurasi. Kirim jawaban Anda untuk mendapatkan hasil evaluasi langsung berbasis standar akademik.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#C6B5BF]/10 border border-[#C6B5BF]/20 flex items-center justify-center text-[#C6B5BF] shrink-0 mt-0.5">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Forum Diskusi Terintegrasi</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                  Diskusikan topik-topik rumit langsung di dalam modul belajar menggunakan forum kelas dengan reply bertingkat.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-500 font-semibold relative z-10">
          &copy; {new Date().getFullYear()} Belajara. Platform Pembelajaran Interaktif Berbasis AI untuk Mahasiswa Indonesia.
        </p>
      </div>

      {/* Right Login form panel */}
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
              <CardTitle className="text-2xl font-bold font-heading text-primary">Masuk Akun</CardTitle>
              <CardDescription className="text-xs">
                Masukkan username dan password Anda untuk mengakses dashboard belajar.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-semibold text-primary">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username (cth: mahasiswa)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white border border-border focus:ring-accent rounded-lg text-xs"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-primary">Password</Label>
                    <Link
                      href="#"
                      className="text-xs text-accent hover:text-[#060708] font-semibold transition-colors"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-xs"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </Button>

                {/* Google Sign In Button */}
                <div className="relative flex py-1.5 items-center w-full">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">atau</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="w-full flex flex-col items-center">
                  <div id="google-signin-button-target" className="w-full flex justify-center min-h-[40px]" />
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="text-[10px] text-muted-foreground hover:text-primary transition underline font-semibold mt-1 cursor-pointer"
                  >
                    Gunakan Simulasi Login (Demo)
                  </button>
                </div>

                <div className="text-xs text-center text-muted-foreground mt-2 font-semibold">
                  Belum punya akun?{" "}
                  <Link
                    href={redirectUrl ? `/register?redirect=${redirectUrl}` : "/register"}
                    className="font-bold text-[#CF3A1F] hover:text-[#CF3A1F]/80 transition-colors"
                  >
                    Daftar Sekarang
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Info banner for Demo */}
          <div className="p-3 bg-secondary/50 rounded-xl border border-border text-[10px] text-muted-foreground font-semibold">
            <p className="font-bold text-primary flex items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-destructive" />
              Integrasi Backend Terhubung
            </p>
            <p className="mt-0.5 text-center leading-normal">
              Gunakan username <strong>mahasiswa</strong> (untuk Mahasiswa) atau <strong>pengajar</strong> (untuk Dosen / Pengajar) dengan password <strong>password123</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Google Login Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm border border-border bg-white shadow-2xl rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <GoogleIcon />
              </div>
              <h3 className="font-heading text-lg font-bold text-primary">Masuk dengan Google</h3>
              <p className="text-[11px] text-muted-foreground">
                Pilih akun Google untuk melanjutkan ke platform Belajara.
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
