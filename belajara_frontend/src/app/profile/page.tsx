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
import { User, GraduationCap, AlertCircle, Loader2, ShieldCheck, Trophy, Sparkles, BookOpen, Crown } from "lucide-react"
import { getUser, getToken, api, BASE_URL } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Form states
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [nim, setNim] = React.useState("")
  const [jurusan, setJurusan] = React.useState("")
  const [universitas, setUniversitas] = React.useState("")
  const [semester, setSemester] = React.useState(1)
  
  const [nidn, setNidn] = React.useState("")
  const [bidangKeahlian, setBidangKeahlian] = React.useState("")

  // Dynamic profile states
  const [subData, setSubData] = React.useState<any>(null)
  const [dashData, setDashData] = React.useState<any>(null)
  const [loadingData, setLoadingData] = React.useState(false)

  const loadProfileData = async () => {
    setLoadingData(true)
    try {
      const sub = await api.payment.mySubscription()
      setSubData(sub)
    } catch (err) {
      console.warn("Failed to load subscription info", err)
    }

    try {
      const token = getToken()
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
      const res = await fetch(`${BASE_URL}/dashboard/`, { headers })
      if (res.ok) {
        const d = await res.json()
        setDashData(d)
      } else {
        // Dashboard endpoint unavailable — leave dashData as null for empty state
        console.warn("Dashboard endpoint returned non-OK response:", res.status)
      }
    } catch (err) {
      console.warn("Failed to load dashboard statistics", err)
    } finally {
      setLoadingData(false)
    }
  }

  React.useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setUser(u)
    setFirstName(u.first_name || "")
    setLastName(u.last_name || "")
    
    const isInst = u.is_instructor;
    if (isInst) {
      setNidn(u.instructor_profile?.nidn || u.nidn || "")
      setBidangKeahlian(u.instructor_profile?.bidang_keahlian || u.bidang_keahlian || "")
      setUniversitas(u.instructor_profile?.universitas || u.universitas || "")
    } else {
      setNim(u.mahasiswa_profile?.nim || u.nim || "")
      setJurusan(u.mahasiswa_profile?.jurusan || u.jurusan || "")
      setUniversitas(u.mahasiswa_profile?.universitas || u.universitas || "")
      setSemester(u.mahasiswa_profile?.semester || u.semester || 1)
      
      loadProfileData()
    }
  }, [router])

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setError(null)
    setSuccess(null)
    if (user) {
      setFirstName(user.first_name || "")
      setLastName(user.last_name || "")
      
      const isInst = user.is_instructor;
      if (isInst) {
        setNidn(user.instructor_profile?.nidn || user.nidn || "")
        setBidangKeahlian(user.instructor_profile?.bidang_keahlian || user.bidang_keahlian || "")
        setUniversitas(user.instructor_profile?.universitas || user.universitas || "")
      } else {
        setNim(user.mahasiswa_profile?.nim || user.nim || "")
        setJurusan(user.mahasiswa_profile?.jurusan || user.jurusan || "")
        setUniversitas(user.mahasiswa_profile?.universitas || user.universitas || "")
        setSemester(user.mahasiswa_profile?.semester || user.semester || 1)
      }
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
      }
      
      if (user.is_instructor) {
        payload.instructor_profile = {
          nidn: nidn,
          bidang_keahlian: bidangKeahlian,
          universitas: universitas
        }
        payload.nidn = nidn
        payload.bidang_keahlian = bidangKeahlian
        payload.universitas = universitas
      } else {
        payload.mahasiswa_profile = {
          nim: nim,
          jurusan: jurusan,
          universitas: universitas,
          semester: semester
        }
        payload.nim = nim
        payload.jurusan = jurusan
        payload.universitas = universitas
        payload.semester = semester
      }
      
      const updatedUser = await api.auth.updateProfile(payload)
      setUser(updatedUser)
      setIsEditMode(false)
      setSuccess("Profil berhasil diperbarui.")
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui profil.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">
            Profil Pengguna
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB]">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-[#060708]">Profil Saya</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Kelola informasi pribadi dan akademik Anda.
                </p>
              </div>
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button 
                      onClick={handleCancelEdit} 
                      variant="outline" 
                      className="cursor-pointer text-xs h-9 rounded-lg"
                      disabled={loading}
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleSaveProfile} 
                      className="bg-primary hover:bg-primary/95 text-white cursor-pointer text-xs h-9 rounded-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditMode(true)} 
                    className="bg-[#060708] hover:bg-[#060708]/90 text-white cursor-pointer text-xs h-9 rounded-lg"
                  >
                    Edit Profil
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-start gap-2 border border-green-200">
                <span className="font-bold">✓</span>
                <span>{success}</span>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Card Summary */}
              <Card className="md:col-span-1 bg-white border border-border shadow-sm flex flex-col items-center p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-[#C6B5BF]/25 flex items-center justify-center text-[#060708] font-heading font-bold text-3xl mb-4">
                  {user.first_name?.charAt(0) || user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3 className="font-heading font-bold text-xl text-[#060708] leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{user.email || "Tidak ada email"}</p>
                <div className="mt-4">
                  {user.is_premium ? (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-[#CF3A1F]/10 text-[#CF3A1F] border border-[#CF3A1F]/30">
                      Akses Premium
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-muted text-muted-foreground border">
                      Akun Gratis
                    </span>
                  )}
                </div>
              </Card>

              {/* Profile Details */}
              <Card className="md:col-span-2 bg-white border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                    <User className="h-5 w-5 text-accent animate-pulse" /> Detail Akun
                  </CardTitle>
                  <CardDescription className="text-xs">Informasi dasar akun masuk Anda di Belajara.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border pt-2 text-sm">
                  {isEditMode ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs font-semibold text-primary">Nama Depan</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs font-semibold text-primary">Nama Belakang</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Username:</span>
                        <span className="font-semibold text-[#060708]">{user.username}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-semibold text-[#060708]">{user.email || "-"}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Peran Pengguna:</span>
                        <span className="font-semibold text-accent">
                          {user.is_instructor ? "Dosen / Pengajar" : "Mahasiswa"}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Academic Section for Student */}
            {!user.is_instructor && (
              <div className="space-y-6">
                {/* Academic Profile Details */}
                <Card className="bg-white border border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-accent" /> Informasi Akademik Mahasiswa
                    </CardTitle>
                    <CardDescription className="text-xs">Informasi program studi dan semester aktif Anda.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-border pt-2 text-sm">
                    {isEditMode ? (
                      <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="nim" className="text-xs font-semibold text-primary">NIM (Nomor Induk Mahasiswa)</Label>
                          <Input
                            id="nim"
                            value={nim}
                            onChange={(e) => setNim(e.target.value)}
                            className="bg-white text-xs h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="jurusan" className="text-xs font-semibold text-primary">Program Studi / Jurusan</Label>
                          <Input
                            id="jurusan"
                            value={jurusan}
                            onChange={(e) => setJurusan(e.target.value)}
                            className="bg-white text-xs h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="universitas" className="text-xs font-semibold text-primary">Universitas / Kampus</Label>
                          <Input
                            id="universitas"
                            value={universitas}
                            onChange={(e) => setUniversitas(e.target.value)}
                            className="bg-white text-xs h-9 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="semester" className="text-xs font-semibold text-primary">Semester Aktif</Label>
                          <select
                            id="semester"
                            value={semester}
                            onChange={(e) => setSemester(parseInt(e.target.value))}
                            className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none cursor-pointer h-9"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between py-3">
                          <span className="text-muted-foreground">NIM (Nomor Induk Mahasiswa):</span>
                          <span className="font-semibold text-[#060708]">{user.mahasiswa_profile?.nim || user.nim || "2201010101"}</span>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="text-muted-foreground">Program Studi / Jurusan:</span>
                          <span className="font-semibold text-[#060708]">{user.mahasiswa_profile?.jurusan || user.jurusan || "Informatika"}</span>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="text-muted-foreground">Universitas / Kampus:</span>
                          <span className="font-semibold text-[#060708]">{user.mahasiswa_profile?.universitas || user.universitas || "Universitas Indonesia"}</span>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="text-muted-foreground">Semester Aktif:</span>
                          <span className="font-semibold text-[#060708]">Semester {user.mahasiswa_profile?.semester || user.semester || 3}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Membership / Subscription Details Card */}
                {(() => {
                  const isPremium = !!user.is_premium;
                  const tier = user.subscription_tier || (isPremium ? "scholar" : "free");
                  const isPro = tier === "pro";
                  const isScholar = tier === "scholar";

                  return (
                    <Card className="bg-white border border-border shadow-sm">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                          <Crown className="h-5 w-5 text-accent" /> Paket Berlangganan Saya
                        </CardTitle>
                        <CardDescription className="text-xs">Detail tipe keanggotaan aktif dan manfaat eksklusif Anda.</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div 
                          className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          style={{
                            borderColor: isPro ? "rgba(207, 58, 31, 0.3)" : isScholar ? "rgba(198, 181, 191, 0.6)" : "rgba(232, 229, 233, 1)",
                            background: isPro 
                              ? "linear-gradient(135deg, #FFF8F7 0%, #FDECEA 100%)" 
                              : isScholar 
                                ? "linear-gradient(135deg, #FAF9FB 0%, #F0EBF0 100%)" 
                                : "#FAF9FB"
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border"
                                style={{
                                  backgroundColor: isPro ? "#CF3A1F" : isScholar ? "#C6B5BF" : "#060708",
                                  color: "#ffffff",
                                  borderColor: isPro ? "#CF3A1F" : isScholar ? "#C6B5BF" : "#060708"
                                }}
                              >
                                {tier.toUpperCase()}
                              </span>
                              <span className="text-xs font-semibold text-[#060708]">
                                {isPro ? "Belajara Pro Premium" : isScholar ? "Belajara Scholar Premium" : "Akun Gratis"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {isPro 
                                ? "Akses AI Rekomendasi Tanpa Batas & Konsultasi Langsung" 
                                : isScholar 
                                  ? "Rekomendasi Rencana Studi AI & Sertifikat Terverifikasi" 
                                  : "Akses dasar ke kelas audit umum & silabus dasar"}
                            </p>
                          </div>
                          
                          {isPremium && subData?.subscription && (
                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-xs font-semibold block text-primary">
                                Status: {subData.subscription.status_display || "Aktif"}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                Sisa Masa Aktif: <strong className="text-primary">{subData.subscription.days_remaining} hari</strong>
                              </span>
                            </div>
                          )}

                          {!isPremium && (
                            <Button 
                              onClick={() => router.push("/pricing")} 
                              size="sm" 
                              className="bg-[#060708] hover:bg-[#060708]/90 text-white cursor-pointer h-8 rounded-lg self-start sm:self-center"
                            >
                              Upgrade Sekarang
                            </Button>
                          )}
                        </div>

                        {/* Benefits list */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Manfaat Keanggotaan Anda:</h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-primary">
                            {isPro ? (
                              <>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#CF3A1F] shrink-0" />
                                  <span>Semua modul premium terverifikasi</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#CF3A1F] shrink-0" />
                                  <span>AI Rekomendasi Kurikulum Tanpa Batas</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#CF3A1F] shrink-0" />
                                  <span>Unduh E-Sertifikat kelulusan gratis</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#CF3A1F] shrink-0" />
                                  <span>Mentoring 1-on-1 dengan Dosen</span>
                                </li>
                              </>
                            ) : isScholar ? (
                              <>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#C6B5BF] shrink-0" />
                                  <span>Semua modul premium terverifikasi</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#C6B5BF] shrink-0" />
                                  <span>AI Rekomendasi Kurikulum (5x/hari)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#C6B5BF] shrink-0" />
                                  <span>Unduh E-Sertifikat terverifikasi</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#C6B5BF] shrink-0" />
                                  <span>Prioritas diskusi di forum kelas</span>
                                </li>
                              </>
                            ) : (
                              <>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>Membaca materi umum</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>Akses forum diskusi dasar</span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span>Kuis evaluasi non-premium</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Academic summary stats (Active courses list & Quiz average) */}
                <Card className="bg-white border border-border shadow-sm">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-accent" /> Ringkasan Akademik & Kinerja
                    </CardTitle>
                    <CardDescription className="text-xs">Statistik evaluasi kuis dan pencapaian Anda.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {loadingData ? (
                      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat ringkasan akademik...
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-xl bg-[#FAF9FB]">
                            <span className="text-xs text-muted-foreground block">Skor Rata-Rata Kuis</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-3xl font-heading font-bold text-[#060708]">
                                {dashData?.stats?.average_quiz_score || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">/100</span>
                            </div>
                            <div className="w-full bg-[#E8E5E9] h-1.5 rounded-full mt-3 overflow-hidden">
                              <div 
                                className="bg-[#CF3A1F] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${dashData?.stats?.average_quiz_score || 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="p-4 border rounded-xl bg-[#FAF9FB]">
                            <span className="text-xs text-muted-foreground block">Kelas Diikuti</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-3xl font-heading font-bold text-[#060708]">
                                {dashData?.stats?.active_classes_count || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">Mata Kuliah</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
                              <BookOpen className="h-3.5 w-3.5 text-accent" />
                              <span>Aktif semester ini</span>
                            </div>
                          </div>

                          <div className="p-4 border rounded-xl bg-[#FAF9FB]">
                            <span className="text-xs text-muted-foreground block">Level Akademik</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-3xl font-heading font-bold text-[#060708]">
                                Level {dashData?.stats?.achievement_level || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
                              <Sparkles className="h-3.5 w-3.5 text-accent" />
                              <span>Peringkat Mahasiswa</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Academic Section for Instructor */}
            {user.is_instructor && (
              <Card className="bg-white border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-accent" /> Informasi Akademik Dosen
                  </CardTitle>
                  <CardDescription className="text-xs">Informasi jabatan pengajar dan institusi homebase Anda.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border pt-2 text-sm">
                  {isEditMode ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="nidn" className="text-xs font-semibold text-primary">NIDN (Nomor Induk Dosen Nasional)</Label>
                        <Input
                          id="nidn"
                          value={nidn}
                          onChange={(e) => setNidn(e.target.value)}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bidangKeahlian" className="text-xs font-semibold text-primary">Bidang Keahlian / Spesialisasi</Label>
                        <Input
                          id="bidangKeahlian"
                          value={bidangKeahlian}
                          onChange={(e) => setBidangKeahlian(e.target.value)}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="universitas" className="text-xs font-semibold text-primary">Universitas Homebase</Label>
                        <Input
                          id="universitas"
                          value={universitas}
                          onChange={(e) => setUniversitas(e.target.value)}
                          className="bg-white text-xs h-9 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">NIDN (Nomor Induk Dosen Nasional):</span>
                        <span className="font-semibold text-[#060708]">{user.instructor_profile?.nidn || user.nidn || "1001010101"}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Bidang Keahlian / Spesialisasi:</span>
                        <span className="font-semibold text-[#060708]">{user.instructor_profile?.bidang_keahlian || user.bidang_keahlian || "Kecerdasan Buatan"}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Universitas / Kampus Homebase:</span>
                        <span className="font-semibold text-[#060708]">{user.instructor_profile?.universitas || user.universitas || "Universitas Indonesia"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
