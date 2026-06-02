"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, getToken, clearToken, getUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import {
  Sparkles,
  Clock,
  MessageSquare,
  CreditCard,
  ArrowRight,
  Check,
  Compass,
  Trophy,
  ArrowUpRight,
  LogOut,
  User,
  GraduationCap,
  Search,
  SlidersHorizontal,
  BookOpen,
  AlertCircle,
  X,
  Loader2
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [courses, setCourses] = React.useState<any[]>([])
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [catalogLoading, setCatalogLoading] = React.useState<boolean>(true)
  const [catalogError, setCatalogError] = React.useState<string | null>(null)

  // Fetch student active courses to check enrollment status
  const fetchActiveCourses = React.useCallback(() => {
    const token = getToken()
    if (!token) return
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
    fetch("http://localhost:8001/api/dashboard/", { headers })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error()
      })
      .then((data: any) => {
        if (data && data.active_courses) {
          setActiveCourseCodes(data.active_courses.map((c: any) => c.code))
        }
      })
      .catch(() => {})
  }, [])

  const fetchFeaturedCourses = React.useCallback(() => {
    setCatalogLoading(true)
    setCatalogError(null)
    
    fetch(`http://localhost:8001/api/courses/`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil daftar mata kuliah")
        return res.json()
      })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.results || [])
        // Limit to top 3 featured courses
        setCourses(list.slice(0, 3))
        setCatalogLoading(false)
      })
      .catch((err) => {
        setCatalogError(err.message || "Gagal menghubungi server backend.")
        setCatalogLoading(false)
      })
  }, [])

  React.useEffect(() => {
    const token = getToken()
    if (token) {
      setIsLoggedIn(true)
      const u = getUser()
      setCurrentUser(u)
      fetchActiveCourses()
    }
    fetchFeaturedCourses()
  }, [fetchActiveCourses, fetchFeaturedCourses])

  const handleLogout = () => {
    clearToken()
    setIsLoggedIn(false)
    setCurrentUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#060708] flex flex-col font-sans selection:bg-[#C6B5BF]/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF9FB]/80 border-b border-[#E8E5E9] px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-[#060708]">
              Belajara.
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#fitur" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-[#060708] transition-colors">
                Fitur
              </a>
              <a href="#harga" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-[#060708] transition-colors">
                Harga
              </a>
              <Link href="/catalog" className="text-xs uppercase tracking-wider font-bold text-[#CF3A1F] hover:text-[#CF3A1F]/80 transition-colors">
                Katalog Kelas
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (currentUser?.is_instructor) {
                      router.push("/instructor")
                    } else {
                      router.push("/dashboard")
                    }
                  }}
                  variant="outline"
                  className="border-[#060708] text-[#060708] hover:bg-[#060708] hover:text-[#FAF9FB] text-xs font-semibold uppercase tracking-wider px-4 py-2 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-[#CF3A1F] hover:bg-[#CF3A1F]/10 text-xs font-semibold uppercase tracking-wider px-4 py-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Keluar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-[#060708] transition-colors px-3 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-[#060708] hover:bg-[#060708]/90 text-[#FAF9FB] text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded shadow-sm transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center text-center px-6 py-20 md:py-32 overflow-hidden border-b border-[#E8E5E9]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(198,181,191,0.15),transparent)]"></div>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C6B5BF]/20 border border-[#C6B5BF]/40 text-[#060708] text-[10px] font-bold uppercase tracking-widest animate-fade-in">
            <Sparkles className="h-3 w-3 text-[#CF3A1F]" /> Platform Pembelajaran Interaktif Berbasis AI untuk Mahasiswa Indonesia
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-[#060708] max-w-4xl mx-auto leading-[1.05]">
            Pembelajaran akademik<br />
            terstruktur and terpadu.
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Susun rencana studi Anda secara terstruktur dengan rekomendasi mata kuliah berbasis AI, evaluasi pembelajaran interaktif, forum diskusi akademik terintegrasi, dan tingkatkan kompetensi Anda ke program Premium.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/register")}
              className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-semibold text-sm px-8 py-6 rounded shadow-lg cursor-pointer transition-all flex items-center gap-2 group w-full sm:w-auto"
            >
              Mulai Belajar Gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Link
              href="/catalog"
              className="w-full sm:w-auto border border-[#060708] text-[#060708] hover:bg-[#060708]/5 font-semibold text-sm px-8 py-3 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              Telusuri Katalog Kelas
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 md:py-28 px-6 bg-white border-b border-[#E8E5E9]">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#FAF9FB] border border-[#E8E5E9] p-8 rounded-xl hover:border-[#C6B5BF] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#C6B5BF]/25 border border-[#C6B5BF]/30 flex items-center justify-center text-[#060708] mb-6 transition-all group-hover:bg-[#060708] group-hover:text-[#FAF9FB]">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#060708] mb-3">Rekomendasi AI</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sistem rekomendasi AI kami menganalisis minat dan performa akademik Anda untuk mencocokkan mata kuliah serta topik belajar yang paling relevan.
                </p>
              </div>
              <div onClick={() => router.push("/explore")} className="pt-6 flex items-center text-xs font-bold text-[#CF3A1F] cursor-pointer group-hover:underline">
                Eksplor Kurikulum <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            <div className="bg-[#FAF9FB] border border-[#E8E5E9] p-8 rounded-xl hover:border-[#C6B5BF] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#C6B5BF]/25 border border-[#C6B5BF]/30 flex items-center justify-center text-[#060708] mb-6 transition-all group-hover:bg-[#060708] group-hover:text-[#FAF9FB]">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#060708] mb-3">Evaluasi Pembelajaran</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uji pemahaman Anda melalui evaluasi pembelajaran pilihan ganda dengan pembatasan waktu dan penilaian langsung untuk melatih kesiapan ujian akademik.
                </p>
              </div>
              <div onClick={() => router.push("/catalog")} className="pt-6 flex items-center text-xs font-bold text-[#CF3A1F] cursor-pointer group-hover:underline">
                Evaluasi Pemahaman <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            <div className="bg-[#FAF9FB] border border-[#E8E5E9] p-8 rounded-xl hover:border-[#C6B5BF] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#C6B5BF]/25 border border-[#C6B5BF]/30 flex items-center justify-center text-[#060708] mb-6 transition-all group-hover:bg-[#060708] group-hover:text-[#FAF9FB]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#060708] mb-3">Forum Diskusi</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Diskusikan materi perkuliahan secara langsung di dalam kelas melalui utas diskusi bertingkat (nested replies) bersama dosen dan mahasiswa lain.
                </p>
              </div>
              <div onClick={() => router.push("/dashboard")} className="pt-6 flex items-center text-xs font-bold text-[#CF3A1F] cursor-pointer group-hover:underline">
                Masuk Forum <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            <div className="bg-[#FAF9FB] border border-[#E8E5E9] p-8 rounded-xl hover:border-[#C6B5BF] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#C6B5BF]/25 border border-[#C6B5BF]/30 flex items-center justify-center text-[#060708] mb-6 transition-all group-hover:bg-[#060708] group-hover:text-[#FAF9FB]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#060708] mb-3">Akses Premium</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buka modul belajar premium tingkat lanjut dan sertifikasi kelulusan dengan integrasi pembayaran aman, instan, dan terpercaya melalui Midtrans.
                </p>
              </div>
              <div onClick={() => router.push("/catalog")} className="pt-6 flex items-center text-xs font-bold text-[#CF3A1F] cursor-pointer group-hover:underline">
                Mulai Upgrade <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="katalog" className="py-20 md:py-28 px-6 bg-[#FAF9FB] border-b border-[#E8E5E9]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C6B5BF]">Katalog Pilihan</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#060708]">
              Mata Kuliah Pilihan Unggulan
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mulai belajar dari mata kuliah dasar hingga tingkat lanjut yang paling populer untuk mengembangkan kompetensi akademik Anda.
            </p>
          </div>

          {catalogLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="border border-[#E8E5E9] bg-white rounded-xl shadow-2xs overflow-hidden animate-pulse">
                  <CardHeader className="p-4 space-y-2">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                    <div className="h-6 w-3/4 bg-slate-100 rounded" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : catalogError ? (
            <div className="p-12 border border-[#CF3A1F]/20 bg-[#CF3A1F]/5 rounded-2xl text-center text-[#CF3A1F] text-xs font-semibold">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
              {catalogError}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 border border-[#E8E5E9] bg-white rounded-2xl text-center text-muted-foreground text-xs font-semibold">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
              Tidak ada mata kuliah.
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const isEnrolled = activeCourseCodes.includes(course.code)
                  return (
                    <Card key={course.id} className="border border-[#E8E5E9] hover:border-[#C6B5BF] bg-white rounded-xl shadow-2xs transition-all flex flex-col justify-between overflow-hidden group">
                      <CardHeader className="p-4 border-b border-[#E8E5E9]/60 flex flex-row items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">{course.department}</span>
                          <CardTitle className="font-heading text-sm font-black text-primary mt-1 line-clamp-1 leading-snug">{course.title}</CardTitle>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          S{course.semester}
                        </span>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>{course.sks} SKS</span>
                          <span className="text-xs font-bold text-slate-805">
                            {course.is_premium && Number(course.price) > 0 
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(course.price)) 
                              : "Gratis"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                          {course.description || "Mata kuliah unggulan untuk membina dasar kompetensi akademik Anda."}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 bg-slate-50/50 border-t border-[#E8E5E9]/60 flex items-center justify-end">
                        {isEnrolled ? (
                          <Button
                            onClick={() => router.push(`/courses/${course.code}`)}
                            className="bg-[#060708] hover:bg-[#060708]/90 text-white font-bold text-xs h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            Lanjut Belajar <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => router.push("/catalog")}
                            className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-bold text-xs h-8 px-4 rounded-lg cursor-pointer"
                          >
                            Detail Kelas
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              <div className="text-center">
                <Button
                  onClick={() => router.push("/catalog")}
                  className="bg-[#060708] hover:bg-[#060708]/95 text-white font-bold text-xs px-8 py-5 rounded-lg shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
                >
                  Lihat Seluruh Katalog Kelas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-20 md:py-28 px-6 bg-[#FAF9FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C6B5BF]">Pilihan Paket Belajar</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#060708]">
              Investasi Terbaik untuk Studi Anda
            </h2>
            <p className="text-sm text-muted-foreground">
              Mulai secara gratis untuk mempelajari konsep dasar atau buka seluruh fitur unggulan dengan paket premium sekali bayar (lifetime access).
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-[#E8E5E9] rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#060708] mb-1">Paket Dasar (Free)</h3>
                  <p className="text-xs text-muted-foreground">Untuk mencoba fitur eksplorasi utama</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-bold font-heading">Rp 0</span>
                  <span className="text-xs text-muted-foreground">/ selamanya</span>
                </div>

                <div className="border-t border-[#E8E5E9] pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fitur yang Didapat:</h4>
                  <ul className="space-y-3">
                    {[
                      "Akses dashboard belajar mahasiswa",
                      "Rekomendasi KRS / Rencana Studi Berbasis AI (Dasar)",
                      "Mengikuti evaluasi pembelajaran berdurasi standar",
                      "Bergabung di Forum Diskusi umum"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-primary">
                        <Check className="h-4 w-4 text-[#C6B5BF] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/register")}
                  className="w-full bg-[#FAF9FB] hover:bg-[#E8E5E9] text-[#060708] border border-[#E8E5E9] text-xs uppercase tracking-wider font-semibold py-6 rounded cursor-pointer"
                >
                  Mulai Belajar Gratis
                </Button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-white border-2 border-[#CF3A1F] rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#CF3A1F] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-lg">
                Paling Populer
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#060708] mb-1">Akses Premium</h3>
                  <p className="text-xs text-[#CF3A1F] font-semibold">Akses penuh ke modul belajar terstruktur</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-bold font-heading text-[#060708]">Rp 150.000</span>
                  <span className="text-xs text-muted-foreground">/ sekali bayar</span>
                </div>

                <div className="border-t border-[#E8E5E9] pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#CF3A1F]">Seluruh Fitur Premium:</h4>
                  <ul className="space-y-3">
                    {[
                      "Semua manfaat dalam Paket Dasar",
                      "Rekomendasi Rencana Studi Berbasis AI tingkat lanjut",
                      "Akses modul belajar premium & bank soal ujian kompetensi",
                      "Prioritas diskusi bersama Dosen / Pengajar kelas",
                      "Integrasi checkout aman instan dengan Midtrans Snap API"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-primary">
                        <Check className="h-4 w-4 text-[#CF3A1F] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
                  className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white text-xs uppercase tracking-wider font-semibold py-6 rounded shadow-md cursor-pointer transition-all"
                >
                  Upgrade ke Premium Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#060708] text-[#FAF9FB] px-6 py-12 md:py-20 mt-auto border-t border-[#060708]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-sm">
            <h3 className="font-heading text-2xl font-bold tracking-tight">Belajara.</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah untuk Mahasiswa Indonesia. Inspirasi dari Qurtuba (Phenomenon Studio).
            </p>
          </div>

          <div className="flex gap-16 flex-wrap">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C6B5BF]">Fitur Utama</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#fitur" className="hover:text-white transition-colors">Rekomendasi AI</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Evaluasi Berwaktu</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Forum Diskusi</a></li>
                <li><a href="#harga" className="hover:text-white transition-colors">Paket Premium</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C6B5BF]">Legalitas</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="#" className="hover:text-white transition-colors">Ketentuan Layanan</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Dokumentasi API</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#E8E5E9]/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Belajara. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1">
            Build with <Sparkles className="h-3 w-3 text-[#CF3A1F]" /> for Indonesia Higher Education
          </p>
        </div>
      </footer>
    </div>
  )
}
