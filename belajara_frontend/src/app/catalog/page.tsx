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
  BookOpen,
  AlertCircle,
  X,
  Loader2,
  Search,
  Check,
  LogOut,
  ArrowRight,
  ChevronDown,
  Star,
  Users
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { searchProdi } from "@/lib/indonesia-academic-data"

// ─── Autocomplete Input Component ─────────────────────────────────────────
function AutocompleteInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  searchFn,
  disabled,
}: {
  id: string
  name: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  searchFn: (q: string) => string[]
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    const results = Array.from(new Set(searchFn(val)))
    setSuggestions(results)
    if (results.length > 0) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleSelect = (item: string) => {
    onChange(item)
    setOpen(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={handleInput}
          onFocus={() => {
            const results = Array.from(new Set(searchFn(value)))
            if (results.length > 0) {
              setSuggestions(results)
              setOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full h-9 bg-white border border-[#E8E5E9] rounded-lg pl-8 pr-8 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#060708]/10 focus:border-[#060708]/30 transition disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setSuggestions([]); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition text-[10px] bg-slate-100 hover:bg-slate-200 rounded px-1 py-0.5 font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E8E5E9] rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-slate-50 transition-colors border-b border-[#E8E5E9]/40 last:border-0 cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CatalogPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<any>(null)

  // Catalog and Enrollment states
  const [courses, setCourses] = React.useState<any[]>([])
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [catalogLoading, setCatalogLoading] = React.useState<boolean>(true)
  const [catalogError, setCatalogError] = React.useState<string | null>(null)
  
  // Filter states
  const [search, setSearch] = React.useState<string>("")
  const [department, setDepartment] = React.useState<string>("")
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [totalCourses, setTotalCourses] = React.useState<number>(0)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  
  // Selected course for syllabus modal popup
  const [activeSyllabusCourse, setActiveSyllabusCourse] = React.useState<any | null>(null)

  // Coursera-style enrollment states
  const [selectedEnrollCourse, setSelectedEnrollCourse] = React.useState<any | null>(null)
  const [checkoutCourse, setCheckoutCourse] = React.useState<any | null>(null)

  // Payment Snap/Checkout states
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [snapToken, setSnapToken] = React.useState<string | null>(null)
  const [orderId, setOrderId] = React.useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = React.useState<"idle" | "pending" | "success" | "failed">("idle")
  const [mockPaymentMethod, setMockPaymentMethod] = React.useState<"gopay" | "va">("gopay")

  // Load Midtrans snap.js dynamically on mount
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

  // Fetch student active courses to check enrollment status
  const fetchActiveCourses = React.useCallback(() => {
    const token = getToken()
    if (!token) return
    const u = getUser()
    if (u?.is_instructor) return // Instructors do not have enrollments
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

  // Reset page to 1 when filters are changed
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, department])

  const fetchCourses = React.useCallback(() => {
    setCatalogLoading(true)
    setCatalogError(null)
    
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (department) params.append("department", department)
    params.append("page", currentPage.toString())
    
    fetch(`http://127.0.0.1:8001/api/courses/?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil daftar mata kuliah")
        return res.json()
      })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data.results || [])
        const count = Array.isArray(data) ? data.length : (data.count || 0)
        setCourses(list)
        setTotalCourses(count)
        setTotalPages(Math.ceil(count / 20))
        setCatalogLoading(false)
      })
      .catch((err) => {
        setCatalogError(err.message || "Gagal menghubungi server backend.")
        setCatalogLoading(false)
      })
  }, [search, department, currentPage])

  React.useEffect(() => {
    const token = getToken()
    if (token) {
      setIsLoggedIn(true)
      const u = getUser()
      setCurrentUser(u)
      fetchActiveCourses()
    }
  }, [fetchActiveCourses])

  React.useEffect(() => {
    if (!isLoggedIn) {
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
    }
  }, [isLoggedIn])

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, department, currentPage, fetchCourses])

  const handleLogout = () => {
    clearToken()
    setIsLoggedIn(false)
    setCurrentUser(null)
    router.push("/")
  }

  const handleEnroll = (courseCode: string, mode: string = 'audit') => {
    const token = getToken()
    if (!token) {
      router.push("/login?redirect=catalog")
      return
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }

    fetch("http://127.0.0.1:8001/api/courses/enroll/", {
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
        fetchActiveCourses()
        router.push(`/courses/${courseCode}`)
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  const handleCheckoutTrigger = async (course: any) => {
    const token = getToken()
    if (!token) {
      router.push("/login?redirect=catalog")
      return
    }
    setCheckoutCourse(course)
    setCheckoutOpen(true)
    setCheckoutLoading(true)
    setPaymentStatus("idle")
    setSnapToken(null)
    setSelectedEnrollCourse(null)

    try {
      const response = await api.payment.checkout(course.id)
      setSnapToken(response.snap_token)
      setOrderId(response.order_id)
      
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(response.snap_token, {
          onSuccess: async (result: any) => {
            setPaymentStatus("success")
            await api.payment.verify(response.order_id, "success")
            fetchActiveCourses()
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
      alert(err.message || "Gagal melakukan checkout. Silakan login sebagai mahasiswa.")
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

  const handleMockPaymentSuccess = async () => {
    if (!orderId || !checkoutCourse) return
    setCheckoutLoading(true)
    
    setTimeout(async () => {
      try {
        await api.payment.verify(orderId, "success")
        fetchActiveCourses()
        setPaymentStatus("success")
        
        setTimeout(() => {
          setCheckoutOpen(false)
          setPaymentStatus("idle")
          router.push(`/courses/${checkoutCourse.code}`)
        }, 1500)
      } catch (err) {
        alert("Konfirmasi pembayaran gagal.")
      } finally {
        setCheckoutLoading(false)
      }
    }, 1500)
  }

  // Define catalog content markup
  const renderCatalogContent = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#C6B5BF]">Katalog Mata Kuliah</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#060708]">
            Telusuri Kelas Pembelajaran Kami
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Pilih mata kuliah yang ingin Anda ikuti, baik untuk mempelajari modul secara gratis maupun menyelesaikan evaluasi pembelajaran untuk memperoleh sertifikat kompetensi.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari mata kuliah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-[#E8E5E9] text-xs font-semibold h-9 rounded-lg"
            />
          </div>
          <div className="w-full sm:w-56 shrink-0 z-10">
            <AutocompleteInput
              id="departmentFilter"
              name="departmentFilter"
              placeholder="SEMUA JURUSAN"
              value={department}
              onChange={(val) => setDepartment(val)}
              searchFn={searchProdi}
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {catalogLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border border-[#E8E5E9] bg-white rounded-xl shadow-2xs overflow-hidden animate-pulse">
              <CardHeader className="p-4 space-y-2">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-6 w-3/4 bg-slate-100 rounded" />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="h-12 w-full bg-slate-100 rounded" />
                <div className="h-8 w-full bg-slate-100 rounded" />
              </CardContent>
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
          Tidak ada mata kuliah yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = activeCourseCodes.includes(course.code)
              return (
                <Card key={course.id} className="border border-[#E8E5E9] hover:border-[#C6B5BF] bg-white rounded-xl shadow-xs transition-all flex flex-col justify-between overflow-hidden group">
                  
                  {/* Course Thumbnail Image */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-100">
                    <img 
                      src={course.thumbnail_url || (course.department === "Matematika" ? "/images/asian_instructor_thumbnail.png" : "/images/daniel_scott_thumbnail.png")} 
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
                      <CardTitle className="font-heading text-sm font-black text-primary mt-1 line-clamp-1 leading-snug">
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
                        Lanjut Belajar <ArrowRight className="h-3.5 w-3.5" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#E8E5E9]/60">
              <p className="text-[10px] text-muted-foreground font-semibold">
                Menampilkan {Math.min((currentPage - 1) * 20 + 1, totalCourses)} - {Math.min(currentPage * 20, totalCourses)} dari {totalCourses} mata kuliah
              </p>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="h-8 px-3 rounded-lg border-[#E8E5E9] text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Sebelumnya
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="px-1 text-[10px] text-muted-foreground font-bold">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors cursor-pointer ${
                        currentPage === page
                          ? "bg-[#060708] border-[#060708] text-white"
                          : "bg-white border-[#E8E5E9] text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="h-8 px-3 rounded-lg border-[#E8E5E9] text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Syllabus Modal Overlay */}
      {activeSyllabusCourse && (
        <div className="fixed inset-0 z-50 bg-[#060708]/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E8E5E9] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-[#E8E5E9] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest block">{activeSyllabusCourse.code}</span>
                <h3 className="font-heading text-lg font-black text-primary mt-1">{activeSyllabusCourse.title}</h3>
              </div>
              <button
                onClick={() => setActiveSyllabusCourse(null)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-[10px] font-extrabold text-[#060708] uppercase tracking-wider">Materi Kuliah & Silabus Pembelajaran:</h4>
              <div className="space-y-3">
                {activeSyllabusCourse.modules && activeSyllabusCourse.modules.map((mod: any, idx: number) => (
                  <div key={mod.id} className="p-4 rounded-xl border border-border bg-[#FAF9FB]/50 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#FAF9FB] border border-[#E8E5E9] text-[10px] font-bold text-slate-600 shrink-0 mt-0.5">
                      M{idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-[#060708]">{mod.title}</h5>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed font-sans">{mod.description || "Belum ada rangkuman topik pembelajaran modul."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coursera-style Enrollment Mode Selector Modal */}
      {selectedEnrollCourse && (
        <div className="fixed inset-0 z-50 bg-[#060708]/60 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E8E5E9] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E8E5E9] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest block">Pendaftaran Kelas</span>
                <h3 className="font-heading text-lg font-black text-primary mt-1">{selectedEnrollCourse.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEnrollCourse(null)}
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
                  onClick={() => handleEnroll(selectedEnrollCourse.code, 'audit')}
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
                {(() => {
                  const isCourseFree = selectedEnrollCourse ? (Number(selectedEnrollCourse.price) <= 0 || !selectedEnrollCourse.is_premium || currentUser?.is_premium) : true
                  return (
                    <>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-[#060708] mb-0.5">Kelas Lengkap (Premium)</h4>
                          <span className="text-[10px] font-black text-[#CF3A1F]">
                            {isCourseFree 
                              ? "Gratis" 
                              : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(selectedEnrollCourse.price))}
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
                        onClick={isCourseFree ? () => handleEnroll(selectedEnrollCourse.code, 'verified') : () => handleCheckoutTrigger(selectedEnrollCourse)}
                        className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-bold text-[10px] h-8 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#C6B5BF]" /> {isCourseFree ? "Mulai Belajar (Premium)" : "Beli Kelas Lengkap"}
                      </Button>
                    </>
                  )
                })()}
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
                    <span className="font-bold text-slate-800">{checkoutCourse?.title}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Harga:</span>
                    <span className="text-[#CF3A1F] font-bold">
                      {checkoutCourse && Number(checkoutCourse.price) > 0 
                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(checkoutCourse.price)) 
                        : "Gratis"}
                    </span>
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

  // RENDER LAYOUT
  if (isLoggedIn) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="font-heading text-sm font-semibold text-[#060708]">
                Katalog Mata Kuliah
              </div>
            </div>
            <ThemeToggle />
          </header>
          <div className="p-6 bg-[#FAF9FB] flex-1">
            <div className="max-w-7xl mx-auto">
              {renderCatalogContent()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Guest view layout
  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#060708] flex flex-col font-sans selection:bg-[#C6B5BF]/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF9FB]/80 border-b border-[#E8E5E9] px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-[#060708]">
              Belajara.
            </Link>
            
            {/* Desktop Navbar Menu */}
            <nav className="hidden lg:flex items-center gap-8 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <a href="/#formula" className="hover:text-[#060708] transition-colors">About Us</a>
              <a href="/#benefits" className="hover:text-[#060708] transition-colors">Program</a>
              <a href="/#harga" className="hover:text-[#060708] transition-colors">Pricing</a>
              <Link href="/catalog" className="text-[#CF3A1F] hover:text-[#CF3A1F]/80 transition-colors">Katalog Kelas</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login?redirect=catalog"
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
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {renderCatalogContent()}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#060708] text-[#FAF9FB] px-6 py-8 border-t border-[#060708]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-semibold">
          <p>&copy; {new Date().getFullYear()} Belajara. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1">
            Platform Pembelajaran Interaktif Berbasis AI untuk Mahasiswa Indonesia
          </p>
        </div>
      </footer>
    </div>
  )
}
