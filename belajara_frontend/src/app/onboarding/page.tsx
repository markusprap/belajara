"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { api, getToken, getUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Award, Loader2, Sparkles, AlertCircle } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [role, setRole] = React.useState<"student" | "instructor" | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Student profile fields
  const [nim, setNim] = React.useState("")
  const [jurusan, setJurusan] = React.useState("")
  const [universitas, setUniversitas] = React.useState("")
  const [semester, setSemester] = React.useState(1)

  // Instructor profile fields
  const [nidn, setNidn] = React.useState("")
  const [bidangKeahlian, setBidangKeahlian] = React.useState("")

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const user = getUser()
    // If user has already onboarded, redirect to dashboard
    if (user && user.is_onboarded === true) {
      if (user.is_instructor) {
        router.push("/instructor")
      } else {
        router.push("/dashboard")
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError("Silakan pilih peran Anda terlebih dahulu.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const payload: any = { role }

      if (role === "student") {
        if (!nim.trim() || !jurusan.trim() || !universitas.trim()) {
          throw new Error("Semua kolom profil mahasiswa harus diisi.")
        }
        payload.nim = nim
        payload.jurusan = jurusan
        payload.universitas = universitas
        payload.semester = Number(semester)
      } else {
        if (!nidn.trim() || !bidangKeahlian.trim() || !universitas.trim()) {
          throw new Error("Semua kolom profil instruktur harus diisi.")
        }
        payload.nidn = nidn
        payload.bidang_keahlian = bidangKeahlian
        payload.universitas = universitas
      }

      await api.auth.updateProfile(payload)
      
      // Get updated user details
      const user = getUser()
      if (user?.is_instructor) {
        router.push("/instructor")
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data profil.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF9FB] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#060708] text-white shadow-md mb-2">
            <GraduationCap className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-[#060708]">
            Selamat Datang di Belajara<span className="text-[#CF3A1F]">.</span>
          </h1>
          <p className="text-sm text-[#7E7C82] max-w-md mx-auto">
            Selesaikan detail profil Anda untuk mulai menikmati rekomendasi rencana studi berbasis kecerdasan buatan.
          </p>
        </div>

        <Card className="border border-[#E8E5E9] shadow-md bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#F3F1F4] bg-[#FAF9FB]/50 p-6 md:p-8">
            <CardTitle className="font-heading text-xl md:text-2xl text-[#060708]">
              Lengkapi Data Profil
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-[#7E7C82]">
              Silakan pilih peran dan masukkan informasi akademik Anda.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs md:text-sm rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Role Selection */}
              <div className="space-y-3">
                <Label className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#7E7C82]">
                  Pilih Peran Anda
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Student Card */}
                  <div
                    onClick={() => {
                      setRole("student")
                      setError(null)
                    }}
                    className={`border-2 rounded-2xl p-6 cursor-pointer flex flex-col items-center text-center transition-all duration-300 ${
                      role === "student"
                        ? "border-[#060708] bg-[#060708]/5 shadow-xs scale-[1.02]"
                        : "border-[#E8E5E9] hover:border-[#C6B5BF] bg-white hover:bg-[#FAF9FB]"
                    }`}
                  >
                    <div className={`p-3 rounded-2xl mb-4 transition-colors duration-300 ${
                      role === "student" ? "bg-[#060708] text-white" : "bg-[#FAF9FB] text-[#7E7C82]"
                    }`}>
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-[#060708] mb-1">
                      Saya Mahasiswa
                    </h3>
                    <p className="text-xs text-[#7E7C82] leading-relaxed">
                      Belajar kelas interaktif dan dapatkan rekomendasi KRS cerdas.
                    </p>
                  </div>

                  {/* Instructor Card */}
                  <div
                    onClick={() => {
                      setRole("instructor")
                      setError(null)
                    }}
                    className={`border-2 rounded-2xl p-6 cursor-pointer flex flex-col items-center text-center transition-all duration-300 ${
                      role === "instructor"
                        ? "border-[#060708] bg-[#060708]/5 shadow-xs scale-[1.02]"
                        : "border-[#E8E5E9] hover:border-[#C6B5BF] bg-white hover:bg-[#FAF9FB]"
                    }`}
                  >
                    <div className={`p-3 rounded-2xl mb-4 transition-colors duration-300 ${
                      role === "instructor" ? "bg-[#060708] text-white" : "bg-[#FAF9FB] text-[#7E7C82]"
                    }`}>
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-[#060708] mb-1">
                      Saya Dosen / Instruktur
                    </h3>
                    <p className="text-xs text-[#7E7C82] leading-relaxed">
                      Kelola mata kuliah, buat modul, kuis AI, dan bimbing mahasiswa.
                    </p>
                  </div>

                </div>
              </div>

              {/* Step 2: Form Fields */}
              {role && (
                <div className="space-y-4 pt-4 border-t border-[#F3F1F4] animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Common Field: Universitas */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="universitas" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                        Asal Universitas
                      </Label>
                      <Input
                        id="universitas"
                        placeholder="contoh: Universitas Indonesia"
                        value={universitas}
                        onChange={(e) => setUniversitas(e.target.value)}
                        className="rounded-xl border-[#E8E5E9] focus:border-[#C6B5BF] focus:ring-0"
                        required
                      />
                    </div>

                    {/* Student Fields */}
                    {role === "student" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="nim" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                            Nomor Induk Mahasiswa (NIM)
                          </Label>
                          <Input
                            id="nim"
                            placeholder="contoh: 2201010202"
                            value={nim}
                            onChange={(e) => setNim(e.target.value)}
                            className="rounded-xl border-[#E8E5E9] focus:border-[#C6B5BF] focus:ring-0"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jurusan" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                            Jurusan / Program Studi
                          </Label>
                          <Input
                            id="jurusan"
                            placeholder="contoh: Teknik Informatika"
                            value={jurusan}
                            onChange={(e) => setJurusan(e.target.value)}
                            className="rounded-xl border-[#E8E5E9] focus:border-[#C6B5BF] focus:ring-0"
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="semester" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                            Semester Aktif ({semester})
                          </Label>
                          <input
                            type="range"
                            id="semester"
                            min="1"
                            max="8"
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value))}
                            className="w-full h-1.5 bg-[#E8E5E9] rounded-lg appearance-none cursor-pointer accent-[#CF3A1F]"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-[#7E7C82]">
                            <span>Sem. 1</span>
                            <span>Sem. 2</span>
                            <span>Sem. 3</span>
                            <span>Sem. 4</span>
                            <span>Sem. 5</span>
                            <span>Sem. 6</span>
                            <span>Sem. 7</span>
                            <span>Sem. 8</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Instructor Fields */}
                    {role === "instructor" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="nidn" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                            Nomor Induk Dosen Nasional (NIDN)
                          </Label>
                          <Input
                            id="nidn"
                            placeholder="contoh: 1002030405"
                            value={nidn}
                            onChange={(e) => setNidn(e.target.value)}
                            className="rounded-xl border-[#E8E5E9] focus:border-[#C6B5BF] focus:ring-0"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bidang_keahlian" className="text-xs font-bold text-[#060708] uppercase tracking-wider">
                            Bidang Keahlian Utama
                          </Label>
                          <Input
                            id="bidang_keahlian"
                            placeholder="contoh: Data Science / Machine Learning"
                            value={bidangKeahlian}
                            onChange={(e) => setBidangKeahlian(e.target.value)}
                            className="rounded-xl border-[#E8E5E9] focus:border-[#C6B5BF] focus:ring-0"
                            required
                          />
                        </div>
                      </>
                    )}

                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-[#060708] hover:bg-[#060708]/90 text-white font-bold py-3 rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-[#CF3A1F]" />
                        Simpan &amp; Lanjutkan ke Dashboard
                      </>
                    )}
                  </Button>
                </div>
              )}

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
