"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Plus, BookOpen, ChevronRight, Loader2, AlertCircle, Users } from "lucide-react"
import { api, getToken, BASE_URL } from "@/lib/api"

// ── Cover gradient helper ──────────────────────────────────────────────────
const COVER_PALETTES = [
  ['#1a1a2e', '#16213e', '#0f3460'],
  ['#1b4332', '#2d6a4f', '#40916c'],
  ['#3d0066', '#560090', '#7b2fff'],
  ['#7b2d00', '#a44200', '#cc5500'],
  ['#0d2137', '#0a3d62', '#1a6fa8'],
  ['#2c2c54', '#474787', '#706fd3'],
  ['#1a3a4a', '#0d6e8c', '#17a8b5'],
  ['#4a1942', '#6d2b6e', '#9b4dca'],
]

const getCoverPalette = (code: string) => {
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length]
}


interface CourseModule {
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
  is_premium?: boolean
  modules?: CourseModule[]
}

export default function InstructorPage() {
  const [courses, setCourses] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/courses/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setCourses(Array.isArray(data) ? data : (data.results || []))
      } else {
        setError("Gagal memuat daftar kelas.")
      }
    } catch {
      setError("Tidak dapat terhubung ke server.")
    }
    setLoading(false)
  }

  React.useEffect(() => { fetchCourses() }, [])



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">Portal Dosen</div>
          <div className="ml-auto">
            <a href="/instructor/courses/create">
              <Button className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white gap-2 shadow-sm cursor-pointer">
                <Plus className="h-4 w-4" /> Tambah Mata Kuliah
              </Button>
            </a>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB]">
          <div>
            <h1 className="text-3xl font-heading font-bold text-[#060708]">Selamat Datang, Dosen / Pengajar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola mata kuliah dan modul belajar Anda dari satu tempat.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Kelas</p>
                  <p className="text-2xl font-heading font-bold text-[#060708] mt-1">{courses.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <GraduationCap className="h-5 w-5 text-[#060708]" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total SKS Diajar</p>
                  <p className="text-2xl font-heading font-bold text-[#060708] mt-1">
                    {courses.reduce((sum, c) => sum + c.sks, 0)} SKS
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <BookOpen className="h-5 w-5 text-[#060708]" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Mahasiswa</p>
                  <p className="text-2xl font-heading font-bold text-[#060708] mt-1">
                    {courses.reduce((sum, c) => sum + ((c as any).enrollment_count || 0), 0)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Rerata Penyelesaian</p>
                  <p className="text-2xl font-heading font-bold text-[#CF3A1F] mt-1">
                    {courses.length > 0 
                      ? Math.round(courses.reduce((sum, c) => sum + ((c as any).completion_rate || 0), 0) / courses.length)
                      : 0}%
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#CF3A1F]/5 flex items-center justify-center border border-[#CF3A1F]/10">
                  <span className="font-heading text-xs font-bold text-[#CF3A1F]">%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Course Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#C6B5BF]" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#C6B5BF]/50 rounded-xl bg-white">
              <GraduationCap className="h-14 w-14 text-[#C6B5BF] mb-4" />
              <h3 className="font-heading text-xl font-bold text-[#060708]">Belum Ada Mata Kuliah</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Klik &ldquo;Tambah Mata Kuliah&rdquo; untuk mulai membuat mata kuliah pertama Anda.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map(course => {
                const palette = getCoverPalette(course.code)
                return (
                  <Card
                    key={course.code}
                    className="bg-white border border-border shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Gradient Thumbnail */}
                      <div
                        className="h-24 w-full relative transition-all duration-300 group-hover:scale-[1.02]"
                        style={{ background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 60%, ${palette[2]} 100%)` }}
                      >
                        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                            {course.code}
                          </span>
                          {course.is_premium && (
                            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#CF3A1F] text-white shadow-sm">
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pt-4 pb-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="font-heading text-base text-[#060708] leading-snug line-clamp-2 group-hover:text-[#CF3A1F] transition-colors">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="text-[11px] mt-1 flex items-center gap-1 flex-wrap">
                            <span>{course.department}</span>
                            <span>&bull;</span>
                            <span>{course.sks} SKS</span>
                            <span>&bull;</span>
                            <span>Semester {course.semester}</span>
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                          {course.description || "Tidak ada deskripsi."}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-2 flex-wrap text-[10px] font-bold">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <BookOpen className="h-2.5 w-2.5" /> {course.modules?.length ?? 0} Modul
                          </span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                            <Users className="h-2.5 w-2.5" /> {(course as any).enrollment_count ?? "—"} Mahasiswa
                          </span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="px-6 pb-4 pt-0">
                      <a href={`/instructor/courses/${course.code}`}>
                        <Button
                          variant="outline"
                          className="w-full gap-1.5 text-xs h-9 border-[#C6B5BF] hover:bg-[#060708] hover:text-white hover:border-[#060708] transition-all cursor-pointer font-semibold"
                        >
                          Kelola Kelas
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
