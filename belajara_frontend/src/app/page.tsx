"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, getToken, clearToken, getUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
  ArrowRight,
  Check,
  Compass,
  ArrowUpRight,
  LogOut,
  SlidersHorizontal,
  BookOpen,
  AlertCircle,
  X,
  Play,
  Star,
  Users,
  ArrowUp,
  Award,
  Video,
  UserCheck
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [allCourses, setAllCourses] = React.useState<any[]>([])
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  
  // Catalog filtering states
  const [courses, setCourses] = React.useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = React.useState<boolean>(true)
  const [catalogError, setCatalogError] = React.useState<string | null>(null)
  const [selectedDept, setSelectedDept] = React.useState<string>("Semua Kelas")

  // Interactive video modal state
  const [isVideoOpen, setIsVideoOpen] = React.useState(false)
  const [showBackToTop, setShowBackToTop] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  // Fetch student active courses to check enrollment status
  const fetchActiveCourses = React.useCallback(() => {
    const token = getToken()
    if (!token) return
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
    fetch("http://127.0.0.1:8001/api/dashboard/", { headers })
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
    
    fetch(`http://127.0.0.1:8001/api/courses/`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil daftar mata kuliah")
        return res.json()
      })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.results || [])
        setAllCourses(list)
        setCourses(list) // Set active list
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

  // Handle department filtering inline
  const handleDeptFilter = (dept: string) => {
    setSelectedDept(dept)
    if (dept === "Semua Kelas") {
      setCourses(allCourses)
    } else {
      const filtered = allCourses.filter(c => c.department === dept || c.category === dept)
      setCourses(filtered)
    }
  }

  const handleLogout = () => {
    clearToken()
    setIsLoggedIn(false)
    setCurrentUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#060708] flex flex-col font-sans selection:bg-[#C6B5BF]/30">
      
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF9FB]/90 border-b border-[#E8E5E9] px-6 py-4 flex items-center justify-between">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* ed-tech Logo */}
            <Link href="/" className="flex items-center gap-1.5 group select-none">
              <span className="font-heading text-2xl font-black tracking-tight text-[#060708]">
                Belajara
              </span>
              <span className="w-2.5 h-2.5 bg-[#CF3A1F] rounded-full group-hover:scale-125 transition-transform" />
            </Link>
            
            {/* Desktop Navbar Menu */}
            <nav className="hidden lg:flex items-center gap-8 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <a href="#formula" className="hover:text-[#060708] transition-colors">About Us</a>
              <a href="#benefits" className="hover:text-[#060708] transition-colors">Program</a>
              <a href="#harga" className="hover:text-[#060708] transition-colors">Pricing</a>
              <Link href="/catalog" className="text-[#CF3A1F] hover:text-[#CF3A1F]/80 transition-colors">Katalog Kelas</Link>
            </nav>
          </div>

          <div className="flex items-center gap-5">
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
                  className="bg-[#060708] hover:bg-[#060708]/90 text-white text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-[#CF3A1F] hover:bg-[#CF3A1F]/10 text-[10px] font-bold uppercase tracking-wider h-9 px-3 rounded-lg cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 hover:text-[#060708] transition-colors px-3 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-[#060708] hover:bg-[#060708]/90 text-white text-[10px] uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-lg shadow-sm transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative px-6 py-12 lg:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-[#E8E5E9]">
        
        {/* Hero Left Column (Info & Title) */}
        <div className="lg:col-span-7 space-y-8 relative">
          
          {/* Decorative soft glow blob */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#8B5CF6]/15 rounded-full filter blur-3xl opacity-60 pointer-events-none -z-10" />

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 rounded-full border border-[#8B5CF6]/20 shadow-2xs mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8B5CF6]">
              AI-Powered Online Learning Platform
            </span>
          </div>

          {/* Main Title Headings */}
          <div className="space-y-4">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold tracking-tight text-[#060708] leading-[1.1] space-y-1 select-none">
              <span className="block">Unlock Learning</span>
              <span className="block">with Expert-Led</span>
              <span className="flex flex-wrap items-center gap-3">
                <span>Courses</span>
                <span className="inline-flex items-center -space-x-3 ml-2">
                  <img 
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[#FAF9FB] object-cover shadow-md shrink-0 bg-white"
                    src="/images/daniel_scott_thumbnail.png"
                    alt="Daniel Scott"
                  />
                  <img 
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[#FAF9FB] object-cover shadow-md shrink-0 bg-white"
                    src="/images/asian_instructor_thumbnail.png"
                    alt="Asian Instructor"
                  />
                  <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center border-2 border-[#FAF9FB] shadow-md hover:scale-105 transition-transform cursor-pointer shrink-0">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </span>
              </span>
            </h1>
          </div>

          {/* Hero Paragraph */}
          <p className="text-xs md:text-sm text-slate-500 font-sans font-medium leading-relaxed max-w-xl">
            Join thousands of learners gaining new skills through engaging, flexible online courses.
          </p>

          {/* Hero CTA Button */}
          <div className="pt-2">
            <Button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/register")}
              className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white font-extrabold text-xs px-8 py-5.5 rounded-xl shadow-md transition-all w-full sm:w-auto"
            >
              Start Learning
            </Button>
          </div>

        </div>

        {/* Hero Right Column (Student Card + Badges + Scroll Indicator) */}
        <div className="lg:col-span-5 flex items-center justify-center relative py-8 min-h-[460px]">
          
          {/* Grid lines pattern background behind student card */}
          <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none select-none overflow-hidden max-w-[420px] mx-auto opacity-70">
            <svg className="w-full h-full text-slate-200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Decorative vertical lines on grid edges */}
          <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-slate-200 hidden md:block -z-10 opacity-70" />
          <div className="absolute right-[-20px] top-0 bottom-0 w-[1px] bg-slate-200 hidden md:block -z-10 opacity-70" />

          {/* Student Portrait Rounded Box Frame */}
          <div className="relative w-72 h-[350px] md:w-80 md:h-[400px] rounded-[32px] border border-[#E8E5E9] bg-white shadow-xl overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-102">
            <img 
              src="/images/hero_student_male.png" 
              alt="Student Portrait" 
              className="w-full h-full object-cover scale-102"
            />
          </div>

          {/* Floating AI Powered Pill on the Left Border */}
          <div className="absolute left-[-20px] md:left-[-35px] top-[45%] z-10 flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100/60 rounded-full shadow-lg backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <div className="w-6 h-6 rounded-full bg-[#FF8A00] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              AI Powered
            </span>
          </div>

          {/* Vertical Scroll Down Indicator on the Right Side */}
          <div className="absolute right-[-45px] lg:right-[-75px] bottom-8 flex flex-col items-center gap-6 select-none pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] tracking-[0.3em] font-extrabold uppercase text-slate-400" style={{ writingMode: "vertical-rl" }}>
                Scroll Down
              </span>
              <div className="w-[1px] h-20 bg-gradient-to-b from-slate-300 to-slate-200 relative flex justify-center">
                <span className="absolute bottom-0 text-[10px] text-slate-400 font-extrabold translate-y-1">↓</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 3. Tilted Offset Feature Cards */}
      <section className="px-6 py-20 bg-[#FAF9FB] border-b border-[#E8E5E9] overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Section subtitle */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-extrabold text-[#CF3A1F] uppercase tracking-widest block">Fitur Utama</span>
            <h3 className="font-heading text-2xl font-black text-[#060708]">Ekosistem Belajar Cerdas Terintegrasi</h3>
          </div>

          {/* Grid stack with vertical offset and tilt */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 pb-12 relative max-w-5xl mx-auto">
            
            {/* Card 1: Rekomendasi AI (Pastel Teal) */}
            <div className="bg-[#E6F7F0] border-2 border-[#A3E2C9] rounded-2xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-103 cursor-pointer rotate-[-2deg] hover:rotate-0 hover:shadow-lg relative group">
              <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-[#A3E2C9] flex items-center justify-center text-slate-800">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="space-y-4">
                <span className="bg-[#A3E2C9]/40 border border-[#A3E2C9] text-[9px] font-extrabold text-emerald-800 px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                  6 bulan
                </span>
                <h4 className="font-heading text-lg font-black text-slate-900">Rekomendasi Rencana Studi AI</h4>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">Sistem kecerdasan menganalisis minat studi untuk merancang rekomendasi mata kuliah optimal.</p>
                {/* Abstract shape */}
                <div className="h-8 w-20 bg-emerald-400/20 rounded-full mt-2 filter blur-xs" />
              </div>
            </div>

            {/* Card 2: Evaluasi Berwaktu (Pastel Pink) */}
            <div className="bg-[#FCEBEF] border-2 border-[#F5C2CD] rounded-2xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-103 cursor-pointer rotate-[2deg] hover:rotate-0 hover:shadow-lg relative group md:translate-y-[-10px]">
              <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-[#F5C2CD] flex items-center justify-center text-slate-800">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="space-y-4">
                <span className="bg-[#F5C2CD]/40 border border-[#F5C2CD] text-[9px] font-extrabold text-[#CF3A1F] px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                  Kelas Mandiri
                </span>
                <h4 className="font-heading text-lg font-black text-slate-900">Asesmen Evaluasi Berwaktu</h4>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">Uji pemahaman topik belajar menggunakan bank kuis terstandarisasi dengan durasi ujian.</p>
                {/* Abstract path */}
                <div className="h-2 w-24 bg-[#CF3A1F]/15 rounded-full mt-2" />
              </div>
            </div>

            {/* Card 3: Forum Kolaborasi (Pastel Lime) */}
            <div className="bg-[#F9FAD0] border-2 border-[#E5EFA2] rounded-2xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-103 cursor-pointer rotate-[-1deg] hover:rotate-0 hover:shadow-lg relative group translate-y-[10px] md:translate-y-[15px]">
              <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-[#E5EFA2] flex items-center justify-center text-slate-800">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="space-y-4">
                <span className="bg-[#E5EFA2]/40 border border-[#E5EFA2] text-[9px] font-extrabold text-lime-800 px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                  Interaktif
                </span>
                <h4 className="font-heading text-lg font-black text-slate-900">Forum Kolaborasi Akademik</h4>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">Tanya jawab bertingkat (nested replies) langsung di modul belajar bersama dosen dan asisten.</p>
                {/* Abstract flower icon */}
                <div className="h-7 w-7 bg-lime-400/20 rounded-md rotate-45 mt-2" />
              </div>
            </div>

            {/* Floating Tags around cards */}
            <div className="absolute top-[20px] left-[-30px] hidden xl:block bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs rotate-[-15deg]">
              #Learning
            </div>
            <div className="absolute bottom-[-10px] right-[-30px] hidden xl:block bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs rotate-[10deg]">
              #TeknologiAI
            </div>
            <div className="absolute top-[180px] right-[250px] hidden xl:block bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs rotate-[-5deg]">
              #Sertifikasi
            </div>
          </div>

        </div>
      </section>

      {/* 4. Our Winning Formula */}
      <section id="formula" className="px-6 py-20 bg-white border-b border-[#E8E5E9]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h3 className="font-heading text-3xl font-black text-[#060708] tracking-tight">Our Winning Formula</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E5E9] font-sans text-xs">
            
            {/* Access */}
            <div className="p-8 text-center space-y-4">
              <span className="inline-flex p-3 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                <Award className="h-5 w-5" />
              </span>
              <h4 className="font-heading text-sm font-black text-slate-800">Lifetime Access</h4>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Pelajari materi, tonton video, dan unduh pustaka silabus kapan saja secara bebas tanpa pembatasan waktu.
              </p>
            </div>

            {/* Mentor */}
            <div className="p-8 text-center space-y-4">
              <span className="inline-flex p-3 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                <UserCheck className="h-5 w-5" />
              </span>
              <h4 className="font-heading text-sm font-black text-slate-800">Expert Mentors</h4>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Diskusi terarah langsung dipandu oleh dosen pengampu universitas yang kompeten di bidang studinya.
              </p>
            </div>

            {/* Offline */}
            <div className="p-8 text-center space-y-4">
              <span className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                <BookOpen className="h-5 w-5" />
              </span>
              <h4 className="font-heading text-sm font-black text-slate-800">Offline Mode</h4>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Unduh slide materi perkuliahan dalam format PDF untuk dipelajari secara mandiri luring (offline).
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Benefits of Learning */}
      <section id="benefits" className="px-6 py-20 bg-[#FAF9FB] border-b border-[#E8E5E9]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image with Pink CSS gradient blob */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            {/* Custom blob backdrop */}
            <div className="absolute w-72 h-72 md:w-80 md:h-80 bg-gradient-to-tr from-pink-300 via-purple-300 to-rose-300 rounded-full opacity-60 filter blur-xl animate-pulse" 
                 style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
            
            {/* Student Photo */}
            <div className="relative w-64 h-80 rounded-2xl overflow-hidden border border-[#E8E5E9] shadow-xl bg-white flex items-center justify-center shrink-0">
              <img 
                src="/images/asian_instructor_thumbnail.png" 
                alt="Student Benefits" 
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          </div>

          {/* Right Column: Benefit cards list */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-[#CF3A1F] uppercase tracking-widest block">Kenapa Belajara?</span>
              <h3 className="font-heading text-3xl font-black text-[#060708] leading-tight">
                Manfaat Belajar Online Bersama Belajara
              </h3>
            </div>

            <div className="space-y-4 font-sans text-xs">
              
              {/* Item 1 */}
              <div className="flex gap-4 p-4 rounded-xl border border-[#E8E5E9] bg-white shadow-xs">
                <span className="w-10 h-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">Kelas Demo Gratis</h4>
                  <p className="text-slate-500 font-semibold leading-relaxed">Coba modul pembuka secara gratis dan telusuri silabus detail mata kuliah sebelum melakukan pendaftaran.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4 p-4 rounded-xl border border-[#E8E5E9] bg-white shadow-xs">
                <span className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">1:1 AI Powered Mentor</h4>
                  <p className="text-slate-500 font-semibold leading-relaxed">Analisis kurikulum personal secara instan dengan asisten AI untuk memetakan mata kuliah yang paling cocok dengan minat Anda.</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4 p-4 rounded-xl border border-[#E8E5E9] bg-white shadow-xs">
                <span className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">Evaluasi Pembelajaran Berwaktu</h4>
                  <p className="text-slate-500 font-semibold leading-relaxed">Uji pemahaman Anda melalui evaluasi asesmen berdurasi otomatis untuk menguji kesiapan kompetensi perkuliahan.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 6. Featured Courses Section */}
      <section id="courses" className="py-20 md:py-28 px-6 bg-white border-b border-[#E8E5E9]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold text-[#CF3A1F] uppercase tracking-widest block">Katalog Pilihan</span>
            <h2 className="font-heading text-3xl font-black text-[#060708]">
              Mata Kuliah Rekomendasi Kami
            </h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Mulai belajar dari silabus terstruktur mata kuliah unggulan pilihan kami untuk mengasah keahlian akademik Anda.
            </p>
          </div>

          {/* Department Filter Pills (Strict Qurtuba Standard) */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] font-extrabold uppercase tracking-wider">
            {[
              "Semua Kelas",
              "Informatika",
              "Matematika",
              "Sains Data"
            ].map(dept => (
              <button
                key={dept}
                onClick={() => handleDeptFilter(dept)}
                className={`px-4 py-2 rounded-full border cursor-pointer transition-all ${
                  selectedDept === dept 
                    ? "bg-[#060708] border-[#060708] text-white shadow-sm" 
                    : "bg-[#FAF9FB] border-[#E8E5E9] text-slate-600 hover:bg-slate-50"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {catalogLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="border border-[#E8E5E9] bg-white rounded-xl shadow-2xs overflow-hidden animate-pulse">
                  <div className="aspect-video w-full bg-slate-100" />
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
            <div className="p-12 border border-[#E8E5E9] bg-white rounded-2xl text-center text-muted-foreground text-xs font-semibold max-w-md mx-auto">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
              Tidak ada mata kuliah yang sesuai dengan kategori ini.
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const isEnrolled = activeCourseCodes.includes(course.code)
                  return (
                    <Card key={course.id} className="border border-[#E8E5E9] hover:border-[#C6B5BF] bg-white rounded-xl shadow-xs transition-all flex flex-col justify-between overflow-hidden group">
                      
                      {/* Course Thumbnail Image */}
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-100">
                        <img 
                          src={course.thumbnail_url || "/images/daniel_scott_thumbnail.png"} 
                          alt={course.title}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Tag/Pricing Float badge */}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-white/20">
                          {course.sks} SKS | {course.is_premium && Number(course.price) > 0 ? "Premium" : "Gratis"}
                        </div>
                      </div>

                      <CardHeader className="p-4 flex flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-extrabold text-[#CF3A1F] uppercase tracking-wider block">{course.department}</span>
                          <CardTitle className="font-heading text-sm font-black text-[#060708] mt-1 line-clamp-1 leading-snug">
                            <Link href={`/catalog/preview/${course.code}`} className="hover:text-[#CF3A1F] transition-colors">
                              {course.title}
                            </Link>
                          </CardTitle>
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase shrink-0 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Semester {course.semester}
                        </span>
                      </CardHeader>
                      
                      <CardContent className="px-4 pb-4 space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans font-medium">
                          {course.description || "Mata kuliah akademik pilihan untuk memperkuat logika keilmuan dan kompetensi profesional Anda."}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <strong>4.9</strong> (5.7k Reviews)
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <strong>45</strong> Mhs
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 bg-slate-50/50 border-t border-[#E8E5E9]/60 flex items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-wider">
                        <span className="text-slate-800 font-bold text-[11px]">
                          {course.is_premium && Number(course.price) > 0 
                            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(course.price)) 
                            : "Gratis"}
                        </span>
                        
                        {isEnrolled ? (
                          <Button
                            onClick={() => router.push(`/courses/${course.code}`)}
                            className="bg-[#060708] hover:bg-[#060708]/90 text-white text-[9px] font-bold uppercase tracking-wider h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            Mulai Belajar <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => router.push(`/catalog/preview/${course.code}`)}
                            className="bg-white border border-slate-900 text-slate-900 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-wider h-8 px-4 rounded-lg cursor-pointer"
                          >
                            Detail Kelas
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              <div className="text-center pt-4">
                <Button
                  onClick={() => router.push("/catalog")}
                  className="bg-[#060708] hover:bg-[#060708]/95 text-white font-extrabold text-xs px-8 py-5 rounded-lg shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
                >
                  Lihat Seluruh Katalog Kelas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="harga" className="py-20 md:py-28 px-6 bg-[#FAF9FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-extrabold text-[#CF3A1F] uppercase tracking-widest block">Pilihan Paket Belajar</span>
            <h2 className="font-heading text-3xl font-black text-[#060708]">
              Investasi Terbaik untuk Studi Anda
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Mulai secara gratis untuk mempelajari konsep dasar atau buka seluruh fitur unggulan dengan paket premium sekali bayar (lifetime access).
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-[#E8E5E9] rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#060708] mb-1">Free</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mulai tanpa biaya</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-slate-800 font-heading">Rp 0</span>
                  <span className="text-xs text-muted-foreground">/ bulan</span>
                </div>

                <div className="border-t border-[#E8E5E9] pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fitur yang Didapat:</h4>
                  <ul className="space-y-3">
                    {[
                      "Akses dashboard belajar mahasiswa",
                      "Rekomendasi KRS AI (Dasar - 1×/bulan)",
                      "Evaluasi kuis berdurasi standar (10 menit)",
                      "Bergabung di Forum Diskusi umum"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-primary font-sans font-medium">
                        <Check className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/register")}
                  className="w-full bg-[#FAF9FB] hover:bg-[#E8E5E9] text-[#060708] border border-[#E8E5E9] text-xs uppercase tracking-wider font-extrabold py-6 rounded-lg cursor-pointer"
                >
                  Mulai Belajar Gratis
                </Button>
              </div>
            </div>

            {/* Scholar Plan */}
            <div className="bg-white border-2 border-[#C6B5BF] rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#C6B5BF] text-slate-900 text-[9px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-bl-lg">
                Terpopuler
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#060708] mb-1">Scholar</h3>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Populer untuk mahasiswa</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-slate-800 font-heading">Rp 49.000</span>
                  <span className="text-xs text-muted-foreground">/ bulan</span>
                </div>

                <div className="border-t border-[#E8E5E9] pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seluruh Fitur Scholar:</h4>
                  <ul className="space-y-3">
                    {[
                      "Semua manfaat dalam Paket Dasar",
                      "Rekomendasi KRS AI tingkat lanjut (Unlimited)",
                      "Akses modul premium & bank soal kompetensi",
                      "Prioritas diskusi bersama Dosen/Pengajar",
                      "Unduh materi kuliah (PDF & slides)",
                      "Tanpa iklan"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-primary font-sans font-semibold">
                        <Check className="h-4 w-4 text-[#C6B5BF] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => router.push(isLoggedIn ? "/pricing" : "/login")}
                  className="w-full bg-[#060708] hover:bg-[#060708]/90 text-[#FAF9FB] text-xs uppercase tracking-wider font-extrabold py-6 rounded-lg shadow-md cursor-pointer transition-all"
                >
                  Mulai Scholar
                </Button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-[#CF3A1F] rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#CF3A1F] text-white text-[9px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-bl-lg">
                Pro Value
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#060708] mb-1">Pro</h3>
                  <p className="text-[10px] text-[#CF3A1F] font-extrabold uppercase tracking-wider">Untuk mahasiswa ambisius</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-[#CF3A1F] font-heading">Rp 99.000</span>
                  <span className="text-xs text-muted-foreground">/ bulan</span>
                </div>

                <div className="border-t border-[#E8E5E9] pt-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#CF3A1F]">Seluruh Fitur Pro:</h4>
                  <ul className="space-y-3">
                    {[
                      "Semua manfaat dalam Paket Scholar",
                      "Sertifikat digital (shareable LinkedIn)",
                      "Priority AI support (respons 2× cepat)",
                      "Learning analytics advanced",
                      "Export progress report PDF",
                      "Akses beta fitur AI berikutnya"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-primary font-sans font-semibold">
                        <Check className="h-4 w-4 text-[#CF3A1F] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={() => router.push(isLoggedIn ? "/pricing" : "/login")}
                  className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white text-xs uppercase tracking-wider font-extrabold py-6 rounded-lg shadow-md cursor-pointer transition-all"
                >
                  Upgrade ke Pro Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer Section */}
      <footer className="bg-[#060708] text-[#FAF9FB] px-6 py-16 md:py-20 mt-auto border-t border-[#060708]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-sm">
            <h3 className="font-heading text-2xl font-bold tracking-tight text-[#FAF9FB]">Belajara.</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah untuk Mahasiswa Indonesia. Inspirasi dari Qurtuba (Phenomenon Studio).
            </p>
          </div>

          <div className="flex gap-16 flex-wrap font-sans text-xs">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C6B5BF]">Fitur Utama</h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li><a href="#fitur" className="hover:text-white transition-colors">Rekomendasi AI</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Evaluasi Berwaktu</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Forum Diskusi</a></li>
                <li><a href="#harga" className="hover:text-white transition-colors">Paket Premium</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C6B5BF]">Legalitas</h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Ketentuan Layanan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dokumentasi API</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#E8E5E9]/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-semibold">
          <p>&copy; {new Date().getFullYear()} Belajara. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1">
            Build with <Sparkles className="h-3 w-3 text-[#CF3A1F]" /> for Indonesia Higher Education
          </p>
        </div>
      </footer>

      {/* Video Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 bg-[#060708]/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col relative aspect-video">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/20 transition-all cursor-pointer"
              title="Tutup video"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Belajara Platform Intro"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-[#060708] hover:bg-[#CF3A1F] text-white border border-[#E8E5E9] p-3 rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center justify-center"
          title="Kembali ke atas"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

    </div>
  )
}
