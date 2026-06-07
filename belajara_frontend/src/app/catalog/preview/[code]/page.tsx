"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Star, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Lock, 
  X, 
  Play, 
  Share2, 
  Heart, 
  Loader2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Laptop
} from "lucide-react"
import { api, getToken, getUser, setUser, BASE_URL } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ code: string }>
}

export default function CoursePreviewPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const courseCode = resolvedParams.code

  // User auth state
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])

  // Course detail states
  const [course, setCourse] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Layout interactive states
  const [activeTab, setActiveTab] = React.useState<"info" | "outline" | "resources" | "reviews">("info")
  const [isDescExpanded, setIsDescExpanded] = React.useState(false)
  const [isVideoOpen, setIsVideoOpen] = React.useState(false)
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [copiedShare, setCopiedShare] = React.useState(false)
  const [expandedModules, setExpandedModules] = React.useState<Record<number, boolean>>({})

  // Enrollment & Checkout states
  const [showEnrollModal, setShowEnrollModal] = React.useState(false)
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [snapToken, setSnapToken] = React.useState<string | null>(null)
  const [orderId, setOrderId] = React.useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = React.useState<"idle" | "pending" | "success" | "failed">("idle")
  const [mockPaymentMethod, setMockPaymentMethod] = React.useState<"gopay" | "va">("gopay")

  // Load Midtrans sandbox snap.js script
  React.useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js"
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-dummy")
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Check login session & active courses
  const fetchSessionData = React.useCallback(() => {
    const token = getToken()
    if (token) {
      setIsLoggedIn(true)
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }

      // Fetch fresh profile data to keep premium status in sync
      fetch(`${BASE_URL}/auth/me/`, { headers })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error()
        })
        .then((userData: any) => {
          setCurrentUser(userData)
          setUser(userData)
        })
        .catch(() => {
          // Fallback to local storage
          const u = getUser()
          setCurrentUser(u)
        })
      
      const u = getUser()
      if (u?.is_instructor) return // Instructors do not have enrollments
      
      // Fetch enrolled courses to check enrollment status
      fetch(`${BASE_URL}/dashboard/`, { headers })
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
    }
  }, [])

  React.useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])

  // Fetch course details
  const fetchCourseDetails = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.courses.get(courseCode)
      setCourse(data)
      
      // Expand first module by default
      if (data && data.modules && data.modules.length > 0) {
        setExpandedModules({ [data.modules[0].id]: true })
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data kelas.")
    } finally {
      setLoading(false)
    }
  }, [courseCode])

  React.useEffect(() => {
    fetchCourseDetails()
  }, [fetchCourseDetails])

  // Helper toggle for module accordion
  const toggleModule = (id: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Copy course link handler
  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
  }

  // General enrollment handler
  const handleEnroll = (mode: string = 'audit') => {
    const token = getToken()
    if (!token) {
      router.push(`/login?redirect=catalog/preview/${courseCode}`)
      return
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }

    fetch(`${BASE_URL}/courses/enroll/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ course_code: courseCode, enrollment_mode: mode })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.detail || "Gagal mendaftar kelas.")
          })
        }
        return res.json()
      })
      .then(() => {
        fetchSessionData()
        router.push(`/courses/${courseCode}`)
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  // Verified/Premium checkout handler
  const handleCheckoutTrigger = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=catalog/preview/${courseCode}`)
      return
    }
    if (!course) return

    setShowEnrollModal(false)
    setCheckoutOpen(true)
    setCheckoutLoading(true)
    setPaymentStatus("idle")
    setSnapToken(null)

    try {
      const response = await api.payment.checkout(course.id)
      setSnapToken(response.snap_token)
      setOrderId(response.order_id)
      
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(response.snap_token, {
          onSuccess: async (result: any) => {
            setPaymentStatus("success")
            await api.payment.verify(response.order_id, "success")
            fetchSessionData()
            alert(`Pendaftaran ${course.title} Kelas Lengkap Berhasil! Selamat belajar.`)
            setCheckoutOpen(false)
            router.push(`/courses/${course.code}`)
          },
          onPending: () => {
            setPaymentStatus("pending")
          },
          onError: async () => {
            setPaymentStatus("failed")
            if (response.order_id) {
              try {
                await api.payment.cancelTransaction(response.order_id)
              } catch (e) {
                console.warn(e)
              }
            }
          },
          onClose: async () => {
            console.log("Snap checkout popup closed")
            setCheckoutOpen(false)
            setPaymentStatus("idle")
            if (response.order_id) {
              try {
                await api.payment.cancelTransaction(response.order_id)
              } catch (e) {
                console.warn(e)
              }
            }
          }
        })
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Gagal melakukan checkout. Pastikan Anda masuk sebagai mahasiswa.")
      setCheckoutOpen(false)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCancelPayment = async () => {
    if (orderId) {
      setCheckoutLoading(true)
      try {
        await api.payment.cancelTransaction(orderId)
      } catch (err) {
        console.warn("Gagal membatalkan transaksi:", err)
      } finally {
        setCheckoutLoading(false)
      }
    }
    setCheckoutOpen(false)
    setPaymentStatus("idle")
  }

  // Simulated sandbox mock payment
  const handleMockPaymentSuccess = async () => {
    if (!orderId || !course) return
    setCheckoutLoading(true)
    
    setTimeout(async () => {
      try {
        await api.payment.verify(orderId, "success")
        fetchSessionData()
        setPaymentStatus("success")
        
        setTimeout(() => {
          setCheckoutOpen(false)
          setPaymentStatus("idle")
          router.push(`/courses/${course.code}`)
        }, 1500)
      } catch (err) {
        alert("Konfirmasi pembayaran gagal.")
      } finally {
        setCheckoutLoading(false)
      }
    }, 1500)
  }

  // Derived variables
  const isEnrolled = course ? activeCourseCodes.includes(course.code) : false
  const isFree = course ? (Number(course.price) <= 0 || !course.is_premium || currentUser?.is_premium) : true
  const priceFormatted = course ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(course.price)) : "Gratis"
  const originalPriceFormatted = course ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(course.price) * 2) : "Rp 300.000"

  // Define tools list based on category
  const getToolsForCategory = (cat: string) => {
    const defaultTools = ["Google Workspace", "Notion", "Slack"]
    if (!cat) return defaultTools
    const normalized = cat.toLowerCase()
    if (normalized.includes("design") || normalized.includes("uiux") || normalized.includes("visual")) {
      return ["Figma", "Miro", "Notion", "Adobe XD", "Whimsical"]
    }
    if (normalized.includes("math") || normalized.includes("teori")) {
      return ["LaTeX", "Geogebra", "Notion", "Python (SymPy)"]
    }
    if (normalized.includes("program") || normalized.includes("data") || normalized.includes("informatika")) {
      return ["VS Code", "Git / GitHub", "Python / C++", "PostgreSQL", "Docker"]
    }
    return defaultTools
  }

  // Render the core preview layout
  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-12 w-12 text-[#CF3A1F] animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Memuat detail mata kuliah...</p>
        </div>
      )
    }

    if (error || !course) {
      return (
        <div className="py-20 border border-[#CF3A1F]/20 bg-[#CF3A1F]/5 rounded-2xl text-center text-[#CF3A1F] max-w-xl mx-auto space-y-4">
          <span className="inline-block p-3 rounded-full bg-[#CF3A1F]/10">
            <X className="h-8 w-8 text-[#CF3A1F]" />
          </span>
          <h3 className="font-heading text-lg font-bold">Gagal Memuat Detail Kelas</h3>
          <p className="text-xs text-muted-foreground">{error || "Data mata kuliah tidak ditemukan."}</p>
          <Button onClick={fetchCourseDetails} className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-bold text-xs">
            Coba Lagi
          </Button>
        </div>
      )
    }

    // Set tools based on category
    const toolsUsed = getToolsForCategory(course.category || course.department)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Sidebar Cards (order-1 on mobile) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main action card */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs overflow-hidden">
            {/* Video preview thumbnail */}
            <div className="relative aspect-video w-full bg-slate-900 border-b border-[#E8E5E9] group overflow-hidden">
              <img 
                src={course.thumbnail_url || "/images/daniel_scott_thumbnail.png"} 
                alt={course.title}
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                onClick={() => setIsVideoOpen(true)}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/45 transition-colors text-white gap-2 cursor-pointer"
              >
                <span className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/40 group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 fill-white" />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/20">
                  Preview Course
                </span>
              </button>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Pricing section */}
              <div className="flex items-baseline justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase block tracking-wider">Harga Kelas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#060708]">
                      {isFree ? "Gratis" : priceFormatted}
                    </span>
                    {!isFree && (
                      <span className="text-xs font-bold text-slate-400 line-through">
                        {originalPriceFormatted}
                      </span>
                    )}
                  </div>
                </div>
                {!isFree && (
                  <span className="border border-[#10B981] text-[#10B981] bg-[#10B981]/5 px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                    Apply Coupon
                  </span>
                )}
              </div>

              {/* Primary action buttons */}
              <div className="flex gap-2">
                {isEnrolled ? (
                  <Button
                    onClick={() => router.push(`/courses/${course.code}`)}
                    className="flex-1 bg-[#060708] hover:bg-[#060708]/90 text-white font-extrabold text-xs h-10 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Lanjut Belajar <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push(`/login?redirect=catalog/preview/${course.code}`)
                      } else {
                        if (currentUser?.is_premium) {
                          handleEnroll('verified')
                        } else {
                          setShowEnrollModal(true)
                        }
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white font-extrabold text-xs h-10 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Enrol Now <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                
                <Button
                  onClick={handleShareClick}
                  variant="outline"
                  className="w-10 h-10 p-0 border-[#E8E5E9] hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
                  title="Bagikan kelas"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={() => setIsFavorite(!isFavorite)}
                  variant="outline"
                  className={`w-10 h-10 p-0 border-[#E8E5E9] rounded-lg flex items-center justify-center cursor-pointer shrink-0 ${
                    isFavorite ? "text-[#CF3A1F] bg-[#CF3A1F]/5 border-[#CF3A1F]/30" : "text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Tambah ke Wishlist"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#CF3A1F]" : ""}`} />
                </Button>
              </div>

              {copiedShare && (
                <p className="text-[10px] text-center text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 py-1.5 rounded-lg animate-fade-in">
                  Tautan kelas disalin ke papan klip!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructor detail card */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E8E5E9] bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase shrink-0">
                {course.instructor_name ? course.instructor_name.split(' ').map((n: string) => n[0]).join('') : "DS"}
              </span>
              <div>
                <span className="text-[9px] font-extrabold text-[#CF3A1F] bg-[#CF3A1F]/5 border border-[#CF3A1F]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  Top Instructor
                </span>
                <h4 className="font-heading text-sm font-black text-[#060708] mt-1">{course.instructor_name || "Daniel Scott"}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{course.category === "Mathematics" ? "Dosen Pengampu Matematika" : "Certified Software Trainer"}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {course.instructor_name === "Dr. Ir. Ahmad Yani" 
                ? "Dr. Ir. Ahmad Yani adalah akademisi senior bidang informatika dengan fokus riset matematika diskrit dan komputasi teori selama lebih dari 15 tahun."
                : "Dr. Daniel Scott adalah instruktur profesional bersertifikasi global yang berdedikasi tinggi dalam mendidik ribuan mahasiswa dan profesional di industri digital modern."}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-extrabold text-accent hover:text-[#060708] tracking-wider uppercase transition-colors">
              <a href="#" onClick={(e) => e.preventDefault()}>View Profile</a>
              <span className="text-slate-400">{course.instructor_email || "instructor@belajara.id"}</span>
            </div>
          </Card>

          {/* Course specifics card */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
            <h4 className="font-heading text-xs font-black uppercase text-slate-600 tracking-wider">Course Detail</h4>
            
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                <span><strong>4.9</strong> (5.7k Reviews)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                <span><strong>{course.modules?.length || 4}</strong> Modules</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span><strong>{(course.modules?.length || 4) * 2}</strong> Assignments</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                <span><strong>{(course.modules?.length || 4) * 3}</strong> Total Quizzes</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Last Update: <strong>27 May 2025</strong></span>
              </div>
            </div>
          </Card>

          {/* Tools required card */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
            <h4 className="font-heading text-xs font-black uppercase text-slate-600 tracking-wider">Tools you will use</h4>
            <div className="flex flex-wrap gap-2">
              {toolsUsed.map((tool, idx) => (
                <span 
                  key={idx} 
                  className="bg-slate-50 border border-[#E8E5E9] text-[10px] font-bold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Laptop className="h-3 w-3 text-accent shrink-0" />
                  {tool}
                </span>
              ))}
            </div>
          </Card>

          {/* Benefits list card */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
            <h4 className="font-heading text-xs font-black uppercase text-slate-600 tracking-wider">What you'll get</h4>
            <ul className="space-y-2.5 font-sans text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Akses pembelajaran penuh selamanya</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Materi bacaan interaktif & slide unduhan</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Evaluasi berbasis AI (pada kelas lengkap)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sertifikat kelulusan kompetensi akademik resmi</span>
              </li>
            </ul>
          </Card>

        </div>

        {/* Right Column: Main Content (order-2 on mobile) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata category */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#CF3A1F] uppercase tracking-widest bg-[#CF3A1F]/5 border border-[#CF3A1F]/15 px-3 py-1 rounded-full">
              {course.category || course.department}
            </span>
            <h2 className="font-heading text-3xl lg:text-4xl font-black text-[#060708] pt-2">
              {course.title}
            </h2>
            <p className="font-heading text-sm text-slate-500 italic">
              {course.code} &mdash; SMT {course.semester} &mdash; {course.sks} SKS &mdash; {course.department}
            </p>
          </div>

          {/* Description area */}
          <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
            <h3 className="font-heading text-lg font-black text-[#060708]">Tentang Mata Kuliah</h3>
            <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-3">
              <p>
                {isDescExpanded 
                  ? course.description 
                  : `${course.description.substring(0, 180)}...`
                }
              </p>
              {isDescExpanded && (
                <div className="pt-2 space-y-2">
                  <p>Mata kuliah ini dirancang untuk membina dasar-dasar analitis mahasiswa di bidang teknologi informasi. Kurikulum disusun berdasarkan standar akademik pendidikan tinggi nasional dengan integrasi studi kasus riil dari industri terkemuka saat ini.</p>
                  <p>Dengan bimbingan dosen berpengalaman dan dukungan platform pembelajaran AI Belajara, mahasiswa akan didorong untuk belajar secara interaktif, menyelesaikan asesmen kompetensi yang presisi, dan berkolaborasi dalam forum akademik secara aktif.</p>
                </div>
              )}
              <button 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[10px] font-extrabold text-[#CF3A1F] hover:text-[#060708] uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
              >
                {isDescExpanded ? (
                  <>See Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>See More <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </Card>

          {/* Tabs Menu */}
          <div className="border-b border-[#E8E5E9] flex gap-2">
            {[
              { id: "info", label: "Course Info" },
              { id: "outline", label: "Course Outline" },
              { id: "resources", label: "Resources" },
              { id: "reviews", label: "Reviews" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id 
                    ? "border-[#060708] text-[#060708]" 
                    : "border-transparent text-slate-500 hover:text-[#060708]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content areas */}
          <div className="space-y-6">
            
            {/* Tab: Course Info */}
            {activeTab === "info" && (
              <div className="space-y-6">
                
                {/* What you'll learn */}
                <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
                  <h3 className="font-heading text-base font-black text-[#060708]">What'll you learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(course.category === "Mathematics" 
                      ? [
                          "Prinsip fundamental logika proposisi & predikat formal",
                          "Teori dasar himpunan, diagram Venn & sifat operasi himpunan",
                          "Karakterisasi relasi biner & pemetaan fungsi matematis",
                          "Metode pembuktian formal dengan induksi matematika sederhana & kuat",
                          "Penerapan graf dan tree untuk pemecahan masalah diskrit",
                          "Logika pembuktian formal untuk mempermudah analisis bug program"
                        ]
                      : [
                          "Struktur data linear dasar: Array, Linked List, Stack & Queue",
                          "Struktur data non-linear lanjut: Tree, BST, AVL & Heap",
                          "Perancangan algoritma pengurutan (Sorting) & pencarian (Searching) lanjut",
                          "Graph traversal mendalam dengan BFS & DFS",
                          "Analisis waktu eksekusi program dengan representasi Big-O",
                          "Penerapan algoritma jalur terpendek (Dijkstra) untuk optimasi rute"
                        ]
                    ).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium font-sans">
                        <Check className="h-4 w-4 text-[#CF3A1F] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Earn certificate */}
                <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-heading text-base font-black text-[#060708]">Earn your certificate</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Selesaikan seluruh kuis evaluasi materi di setiap modul dan raih nilai kelulusan minimal 60% untuk mengklaim sertifikat kompetensi akademik resmi dari Belajara yang dapat langsung Anda share ke profil LinkedIn Anda.
                    </p>
                  </div>

                  {/* Certificate mockup wrapper */}
                  <div className="p-6 border border-dashed border-[#E8E5E9] rounded-xl bg-[#FAF9FB] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 max-w-sm">
                      <span className="inline-flex p-2 bg-slate-200 border rounded-full text-slate-700">
                        <Lock className="h-4 w-4" />
                      </span>
                      <h4 className="font-heading text-sm font-bold text-[#060708]">Sertifikat Kelulusan Belajara</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tersedia secara otomatis setelah pendaftaran Kelas Lengkap dan menyelesaikan seluruh kuis kompetensi.
                      </p>
                    </div>

                    {/* Certificate Graphic Graphic */}
                    <div className="relative w-64 h-44 rounded-lg bg-white border border-[#E8E5E9] shadow-md overflow-hidden flex flex-col justify-between p-4 shrink-0 selection:bg-transparent select-none">
                      {/* Decorative border layout */}
                      <div className="absolute inset-1.5 border border-slate-100 rounded pointer-events-none" />
                      <div className="absolute inset-2 border-2 border-slate-200/50 rounded pointer-events-none" />
                      
                      <div className="text-center space-y-1">
                        <h5 className="font-heading text-[8px] uppercase tracking-widest font-black text-slate-400">Certificate of Completion</h5>
                        <p className="text-[5px] text-slate-400 font-sans">Diberikan secara resmi kepada mahasiswa</p>
                        <div className="h-4 border-b border-slate-100 flex items-center justify-center">
                          <span className="text-[7px] font-black text-[#060708] font-sans">BUDI SANTOSO</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-[4px] text-slate-400 font-sans">atas keberhasilan menyelesaikan kurikulum mata kuliah</p>
                        <p className="text-[6px] font-bold text-[#CF3A1F] uppercase mt-0.5">{course.title}</p>
                      </div>

                      <div className="flex justify-between items-end text-[4px] font-sans text-slate-400">
                        <div className="space-y-0.5 text-left">
                          <p>NIM: 2201010101</p>
                          <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="text-center space-y-0.5">
                          <div className="h-3 w-10 border-b border-slate-300 mx-auto italic font-serif text-[6px]">Belajara.</div>
                          <p>AI Academic Board</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
            )}

            {/* Tab: Course Outline (Syllabus) */}
            {activeTab === "outline" && (
              <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
                <h3 className="font-heading text-base font-black text-[#060708]">Silabus Pembelajaran</h3>
                <p className="text-xs text-slate-500 font-sans">Telusuri seluruh rangkaian materi belajar yang disusun secara sistematis di bawah ini:</p>

                <div className="space-y-3 pt-2">
                  {course.modules && course.modules.map((mod: any, idx: number) => {
                    const isOpen = !!expandedModules[mod.id]
                    return (
                      <div key={mod.id} className="border border-[#E8E5E9] rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className="w-full p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer text-left focus:outline-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-white border border-[#E8E5E9] rounded text-[10px] font-black text-slate-600 shrink-0">
                              MODUL {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-[#060708]">{mod.title}</h4>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-sans font-medium">{mod.description || "Topik pembelajaran silabus akademik."}</p>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="p-4 border-t border-[#E8E5E9] bg-white divide-y divide-slate-100 font-sans text-xs">
                            {[
                              { label: `Video Pembelajaran: Pengenalan ${mod.title.replace(/^Pengantar\s+/i, "")}`, type: "Video", dur: "10 menit" },
                              { label: `Materi Kuliah Utama: Teori & Konsep Dasar`, type: "Buku", dur: "15 menit" },
                              { label: `Studi Kasus Skenario Nyata & Analisis Industri`, type: "Buku", dur: "15 menit" },
                              { label: `Evaluasi Kompetensi Modul ${idx + 1}`, type: "Kuis", dur: "15 menit", premium: true }
                            ].map((sub, sidx) => (
                              <div key={sidx} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                                  {sub.premium ? (
                                    <Lock className="h-3.5 w-3.5 text-[#CF3A1F] shrink-0" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  <span>{sub.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase shrink-0">
                                  <span className="px-1.5 py-0.5 bg-slate-100 border rounded text-[9px]">{sub.type}</span>
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sub.dur}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Tab: Resources */}
            {activeTab === "resources" && (
              <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-4">
                <h3 className="font-heading text-base font-black text-[#060708]">Sumber Daya & Referensi Belajar</h3>
                <p className="text-xs text-slate-500 font-sans">Unduh dan pelajari materi pelengkap pembelajaran berikut untuk memperkaya pemahaman Anda:</p>

                <div className="space-y-3 pt-2 font-sans text-xs">
                  {[
                    { title: "Buku Pegangan Utama (PDF)", size: "4.8 MB", desc: "Materi pustaka pegangan lengkap kurikulum nasional." },
                    { title: "Kumpulan Soal Latihan & Pembahasan", size: "1.2 MB", desc: "Soal mandiri pembina logika di luar jam evaluasi." },
                    { title: "Slide Ringkasan Modul 1 - 4", size: "8.4 MB", desc: "Ringkasan presentasi dosen pengampu untuk tinjauan cepat." }
                  ].map((res, idx) => (
                    <div key={idx} className="p-4 border border-[#E8E5E9] rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#CF3A1F] shrink-0" />
                          {res.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">{res.desc}</p>
                      </div>
                      <Button variant="outline" className="border-[#E8E5E9] text-[10px] font-bold uppercase tracking-wider h-8 rounded-lg cursor-pointer shrink-0">
                        Unduh ({res.size})
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Tab: Reviews */}
            {activeTab === "reviews" && (
              <Card className="border border-[#E8E5E9] bg-white rounded-xl shadow-xs p-6 space-y-6">
                <h3 className="font-heading text-base font-black text-[#060708]">Review & Testimoni Mahasiswa</h3>

                {/* Rating summary */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-center sm:border-r sm:pr-8 border-slate-200">
                    <div className="text-4xl font-black text-[#060708]">4.9</div>
                    <div className="flex justify-center gap-0.5 my-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Rata-rata Rating</p>
                  </div>

                  <div className="flex-1 space-y-2 text-[10px] font-bold text-slate-600 font-sans w-full">
                    {[
                      { stars: 5, pct: "92%" },
                      { stars: 4, pct: "6%" },
                      { stars: 3, pct: "2%" },
                      { stars: 2, pct: "0%" },
                      { stars: 1, pct: "0%" }
                    ].map(row => (
                      <div key={row.stars} className="flex items-center gap-3 w-full">
                        <span className="w-4 text-right shrink-0">{row.stars} ★</span>
                        <div className="flex-1 h-2 rounded bg-slate-200 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded" style={{ width: row.pct }} />
                        </div>
                        <span className="w-8 text-right text-slate-400 shrink-0">{row.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial comments */}
                <div className="divide-y divide-slate-100 font-sans text-xs space-y-4">
                  {[
                    { name: "Dewi Safitri", rating: 5, date: "24 Mei 2026", text: "Sangat membantu untuk memahami konsep secara komprehensif! Penjelasan materi di videonya sangat runut dan modul ringkasnya mempermudah belajar kuis." },
                    { name: "Rian Setiawan", rating: 5, date: "18 Mei 2026", text: "Asisten AI dalam platform ini memandu saya dengan merekomendasikan silabus lanjutan yang relevan. Sangat merekomendasikan kelas premium ini!" },
                    { name: "Farhan Maulana", rating: 4, date: "12 Mei 2026", text: "Logika penjelasannya bagus sekali. Hanya saja di modul terakhir kuisnya cukup menantang dan butuh ketelitian tinggi." }
                  ].map((rev, idx) => (
                    <div key={idx} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full border bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                            {rev.name.split(' ').map(n => n[0]).join('')}
                          </span>
                          <div>
                            <h5 className="font-bold text-slate-800">{rev.name}</h5>
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: rev.rating }).map((_, sidx) => (
                                <Star key={sidx} className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium pl-10">{rev.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>

        </div>

      </div>
    )
  }

  // Define layout structures wrapping the page
  const pageMarkup = (
    <div className="min-h-screen bg-[#FAF9FB] text-[#060708] flex flex-col font-sans selection:bg-[#C6B5BF]/30">
      
      {/* Header bar styled like mockup overlay with back navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-[#E8E5E9] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push("/catalog")} 
            variant="ghost" 
            className="p-2 h-9 w-9 border border-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Katalog Kelas</span>
            <h1 className="font-heading text-base lg:text-lg font-black text-[#060708] leading-tight">Preview Course</h1>
          </div>
        </div>

        <Button
          onClick={() => router.push("/catalog")}
          variant="outline"
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Main body content container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {renderPreviewContent()}
      </main>

      {/* Modals and overlay simulations */}
      
      {/* Video Preview Player Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 bg-[#060708]/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col relative aspect-video">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/20 transition-all cursor-pointer"
              title="Close video"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Course Video Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Coursera-style Enrollment Mode Selector Modal */}
      {showEnrollModal && course && (
        <div className="fixed inset-0 z-50 bg-[#060708]/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E8E5E9] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E8E5E9] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest block">Pendaftaran Kelas</span>
                <h3 className="font-heading text-lg font-black text-primary mt-1">{course.title}</h3>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 gap-6 bg-slate-50/20">
              {/* Option 1: Audit */}
              <div className="p-5 border border-border hover:border-accent bg-white rounded-xl flex flex-col justify-between gap-4 transition-all">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#060708] mb-0.5">Mode Audit (Gratis)</h4>
                    <span className="text-[10px] font-bold text-slate-400">Belajar Mandiri</span>
                  </div>
                  <ul className="space-y-2 text-[10px] text-slate-600 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      Akses Video Pembelajaran
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      Akses Materi & Studi Kasus
                    </li>
                    <li className="flex items-center gap-1.5 text-muted-foreground line-through">
                      Evaluasi Pembelajaran AI (Terkunci)
                    </li>
                    <li className="flex items-center gap-1.5 text-muted-foreground line-through">
                      Sertifikat Kompetensi (Terkunci)
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => handleEnroll('audit')}
                  className="w-full bg-white border border-[#060708] hover:bg-slate-50 text-[#060708] font-bold text-[10px] h-8 rounded-lg cursor-pointer"
                >
                  Mulai Belajar (Audit)
                </Button>
              </div>

              {/* Option 2: Verified */}
              <div className="p-5 border-2 border-[#CF3A1F] bg-white rounded-xl flex flex-col justify-between gap-4 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 right-0 bg-[#CF3A1F] text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-bl">
                  Direkomendasikan
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#060708] mb-0.5">Kelas Lengkap (Premium)</h4>
                    <span className="text-[10px] font-black text-[#CF3A1F]">
                      {isFree ? "Gratis" : priceFormatted}
                    </span>
                  </div>
                  <ul className="space-y-2 text-[10px] text-slate-700 font-bold">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#CF3A1F] shrink-0" />
                      Semua Akses Pembelajaran
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#CF3A1F] shrink-0" />
                      Evaluasi Kompetensi Mandiri Berbasis AI
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#CF3A1F] shrink-0" />
                      Sertifikat Kelulusan Resmi
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={isFree ? () => handleEnroll('verified') : handleCheckoutTrigger}
                  className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-bold text-[10px] h-8 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C6B5BF]" /> {isFree ? "Mulai Belajar (Premium)" : "Beli Kelas Lengkap"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Midtrans Snap simulation overlay popup */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-[#060708]/70 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E8E5E9] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 text-center space-y-6">
            <h3 className="font-heading text-lg font-black text-primary">Gerbang Pembayaran Midtrans (Sandbox)</h3>
            
            {checkoutLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-[#CF3A1F] animate-spin" />
                <span className="text-xs font-semibold text-muted-foreground">Menghubungkan ke Midtrans Snap...</span>
              </div>
            ) : paymentStatus === "success" ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-emerald-600">
                <Check className="h-16 w-16 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full p-2.5 animate-bounce" />
                <span className="font-heading text-xl font-bold">Pembayaran Berhasil!</span>
                <span className="text-xs text-muted-foreground">Mempersiapkan kelas premium Anda...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-[#FAF9FB] text-left space-y-2 text-xs font-sans">
                  <div className="flex justify-between font-semibold">
                    <span>Mata Kuliah:</span>
                    <span className="font-bold text-slate-800">{course?.title}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Harga:</span>
                    <span className="text-[#CF3A1F] font-bold">{priceFormatted}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Order ID:</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{orderId}</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Metode Simulasi Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMockPaymentMethod("gopay")}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        mockPaymentMethod === "gopay" ? "border-[#060708] bg-slate-50 text-slate-900" : "border-border text-slate-500"
                      }`}
                    >
                      QRIS / GoPay
                    </button>
                    <button
                      onClick={() => setMockPaymentMethod("va")}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        mockPaymentMethod === "va" ? "border-[#060708] bg-slate-50 text-slate-900" : "border-border text-slate-500"
                      }`}
                    >
                      Virtual Account
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleCancelPayment}
                    variant="outline"
                    className="flex-1 text-xs h-9 cursor-pointer"
                    disabled={checkoutLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleMockPaymentSuccess}
                    className="flex-1 bg-[#060708] hover:bg-[#060708]/90 text-white text-xs font-bold h-9 rounded-lg cursor-pointer"
                  >
                    Simulasikan Sukses
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )

  // Layout switcher based on login session (sidebar inset vs full guest view)
  if (isLoggedIn) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-30">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="font-heading text-sm font-semibold text-[#060708]">
              Pratinjau Kelas & Silabus
            </div>
          </header>
          
          <div className="flex-1 bg-[#FAF9FB]">
            {pageMarkup}
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Guest view layout
  return pageMarkup
}
