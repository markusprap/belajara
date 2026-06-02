"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { getToken, getUser } from "@/lib/api"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, AlertTriangle, ArrowRight, Sparkles, Check } from "lucide-react"

interface Module {
  id: number
  title: string
  description: string
  order: number
}

interface Course {
  id: number
  code: string
  title: string
  description: string
  sks: number
  semester: number
  department: string
  modules: Module[]
  enrollment_mode?: "audit" | "verified"
}

interface Student {
  name: string
  nim: string
  jurusan: string
  universitas: string
  semester: number
}

interface DashboardData {
  student: Student
  active_courses: Course[]
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [student, setStudent] = React.useState<Student | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [username, setUsername] = React.useState<string>("")

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const u = getUser()
    if (u) {
      setUsername(u.username || "mahasiswa")
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    }

    fetch("http://localhost:8001/api/dashboard/", { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil data kelas terdaftar.")
        }
        return res.json()
      })
      .then((data: DashboardData) => {
        setCourses(data.active_courses || [])
        setStudent(data.student || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Gagal menghubungi server backend.")
        setLoading(false)
      })
  }, [router])

  // Local helper to resolve progress percentage from localStorage
  const getCourseProgress = (courseCode: string, totalModules: number) => {
    if (totalModules === 0) return 0
    try {
      const storageKey = `belajara_completed_subchapters_${username}_${courseCode}`
      const raw = localStorage.getItem(storageKey)
      if (!raw) return 0
      const completed = JSON.parse(raw)
      if (!Array.isArray(completed)) return 0
      
      const totalSubchapters = totalModules * 5
      return Math.min(100, Math.round((completed.length / totalSubchapters) * 100))
    } catch (e) {
      return 0
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Minimalist Top Nav Header */}
        <header className="flex h-14 shrink-0 items-center justify-between px-6 bg-white border-b border-border/80">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-xs font-semibold text-[#060708]">Mata Kuliah Saya</span>
          </div>
        </header>

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF9FB] text-[#060708] font-sans selection:bg-[#C6B5BF]/30">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Page Title & Context Header */}
            <div className="space-y-2">
              <h2 className="font-heading text-3xl font-black tracking-tight text-primary">
                Mata Kuliah Saya
              </h2>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Pantau kemajuan belajar Anda, akses evaluasi pembelajaran berbasis AI, forum tanya jawab akademik, dan sertifikat kompetensi.
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="border border-[#E8E5E9] bg-white rounded-xl shadow-2xs overflow-hidden animate-pulse">
                    <CardHeader className="p-4 space-y-2">
                      <div className="h-4 w-24 bg-slate-100 rounded" />
                      <div className="h-6 w-3/4 bg-slate-100 rounded" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="h-10 w-full bg-slate-100 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-2xl text-center text-destructive text-xs font-semibold">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                {error}
              </div>
            ) : courses.length === 0 ? (
              <Card className="border border-[#E8E5E9] bg-white rounded-2xl shadow-xs p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <BookOpen className="h-16 w-16 text-[#C6B5BF] mb-4 opacity-80" />
                <h3 className="font-heading text-xl font-bold text-primary">Belum Mengambil Mata Kuliah</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed font-semibold">
                  Mulai langkah akademik Anda dengan memilih mata kuliah dari Katalog Mata Kuliah kami.
                </p>
                <Button
                  onClick={() => router.push("/#katalog")}
                  className="mt-6 bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white text-xs font-bold px-6 h-9 rounded-lg shadow-sm cursor-pointer"
                >
                  Telusuri Katalog Mata Kuliah
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => {
                  const progress = getCourseProgress(course.code, course.modules?.length || 0)
                  const isVerified = course.enrollment_mode === "verified"
                  
                  return (
                    <Card
                      key={course.id}
                      className="border border-[#E8E5E9] hover:border-[#C6B5BF] bg-white rounded-xl shadow-2xs transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <CardHeader className="p-4 border-b border-[#E8E5E9]/60">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">
                            {course.department}
                          </span>
                          
                          {/* Enrollment Mode Badge */}
                          {isVerified ? (
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#060708] text-white border border-[#060708] flex items-center gap-0.5 shadow-2xs">
                              <Sparkles className="h-2 w-2 text-[#C6B5BF]" /> Terverifikasi
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-250 flex items-center gap-0.5">
                              Mode Audit
                            </span>
                          )}
                        </div>
                        <CardTitle className="font-heading text-sm font-black text-primary mt-2 line-clamp-1 leading-snug">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] mt-0.5 font-semibold text-slate-500">
                          {course.sks} SKS • Semester {course.semester}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                            <span>Kemajuan Belajar</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="bg-[#CF3A1F] h-full rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 bg-slate-50/50 border-t border-[#E8E5E9]/60 flex justify-end">
                        <Button
                          onClick={() => router.push(`/courses/${course.code}`)}
                          className="bg-[#060708] hover:bg-[#060708]/90 text-white font-bold text-xs h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          Masuk Kelas <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
