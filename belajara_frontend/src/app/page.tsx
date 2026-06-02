"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Trophy, Sparkles, AlertCircle } from "lucide-react"

import { useRouter } from "next/navigation"
import { getToken, clearToken } from "@/lib/api"

interface Student {
  name: string
  nim: string
  jurusan: string
  universitas: string
  semester: number
}

interface Stats {
  active_classes_count: number
  ai_recommendations_count: number
  achievement_level: number
}

interface TodayRecommendation {
  course_code: string
  course_title: string
  module_title: string
  module_description: string
}

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
}

interface DashboardData {
  student: Student
  stats: Stats
  today_recommendation: TodayRecommendation
  active_courses: Course[]
}

export default function Page() {
  const router = useRouter()
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDashboardData = () => {
    setLoading(true)
    setError(null)
    const token = getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    fetch("http://localhost:8001/api/dashboard/", { headers })
      .then((res) => {
        if (res.status === 401) {
          clearToken()
          router.push("/login")
          throw new Error("Sesi telah berakhir. Silakan login kembali.")
        }
        if (!res.ok) {
          throw new Error("Gagal mengambil data dashboard")
        }
        return res.json()
      })
      .then((data: DashboardData) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Koneksi ke backend terputus.")
        setLoading(false)
      })
  }

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
    } else {
      fetchDashboardData()
    }
  }, [router])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-primary">
            Belajara Dashboard
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
          {loading ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </Card>
            </div>
          ) : error ? (
            <Card className="border-destructive/20 bg-white p-12 flex flex-col items-center gap-4 text-center max-w-lg mx-auto mt-12 shadow-sm">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-heading text-xl font-bold text-primary">Gagal Memuat Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">Pastikan server Django Anda berjalan di http://localhost:8001</p>
              </div>
              <Button onClick={fetchDashboardData} className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer mt-4">
                Coba Hubungkan Kembali
              </Button>
            </Card>
          ) : data ? (
            <>
              {/* Welcome Section */}
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-heading font-bold text-primary">
                  Selamat Datang, {data.student.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  NIM: {data.student.nim} | Jurusan: {data.student.jurusan} | {data.student.universitas}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Mata Kuliah Aktif
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading">
                      {data.stats.active_classes_count} Kelas
                    </div>
                    <p className="text-xs text-muted-foreground">Semester {data.student.semester}</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Rekomendasi AI
                    </CardTitle>
                    <Sparkles className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading">
                      {data.stats.ai_recommendations_count} Mata Kuliah
                    </div>
                    <p className="text-xs text-muted-foreground">Berdasarkan minatmu</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pencapaian
                    </CardTitle>
                    <Trophy className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading">
                      Level {data.stats.achievement_level}
                    </div>
                    <p className="text-xs text-muted-foreground">Terus semangat belajar!</p>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Recommendation */}
              <div className="rounded-xl border border-border bg-white shadow-sm p-6">
                <h2 className="text-xl font-heading font-semibold mb-4 text-primary">
                  Rekomendasi Belajar Hari Ini
                </h2>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-border rounded-lg bg-background gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30 font-sans">
                        {data.today_recommendation.course_code}
                      </span>
                      <h3 className="font-semibold text-primary">
                        {data.today_recommendation.course_title}
                      </h3>
                    </div>
                    <p className="font-heading text-lg text-primary font-medium mt-1">
                      {data.today_recommendation.module_title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {data.today_recommendation.module_description}
                    </p>
                  </div>
                  <Button className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer w-full md:w-auto">
                    Mulai Belajar
                  </Button>
                </div>
              </div>

              {/* Active Courses List */}
              <div className="rounded-xl border border-border bg-white shadow-sm p-6">
                <h2 className="text-xl font-heading font-semibold mb-4 text-primary">
                  Daftar Kelas Aktif Anda
                </h2>
                {data.active_courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Anda belum mengambil mata kuliah aktif.</p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {data.active_courses.map((course) => (
                      <div key={course.id} className="p-4 border border-border rounded-lg bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-accent/20 border border-accent/30">
                              {course.code}
                            </span>
                            <span className="text-xs text-muted-foreground">{course.sks} SKS | Sem {course.semester}</span>
                          </div>
                          <h4 className="font-heading text-lg font-bold text-primary mb-1">
                            {course.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {course.description}
                          </p>
                        </div>
                        
                        <div className="border-t border-border pt-3">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Modul Pembelajaran</h5>
                          <div className="space-y-1.5">
                            {course.modules.slice(0, 3).map((module) => (
                              <div key={module.id} className="text-xs flex items-center justify-between text-primary">
                                <span className="truncate pr-2">Modul {module.order}: {module.title}</span>
                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">Aktif</span>
                              </div>
                            ))}
                            {course.modules.length > 3 && (
                              <div className="text-[10px] text-muted-foreground italic mt-1">
                                + {course.modules.length - 3} modul lainnya
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
