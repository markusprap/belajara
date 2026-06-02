"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle, Check } from "lucide-react"
import { api } from "@/lib/api"

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

interface Recommendation {
  course: Course
  match_percentage: number
  reason: string
}

interface StudentDashboardData {
  active_courses: Course[]
}

export default function ExplorePage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [loadingStep, setLoadingStep] = React.useState<string>("Mengunggah file...")
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([])
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pollingIntervalRef = React.useRef<any>(null)

  // Cycle loading messages for a premium dynamic UX
  React.useEffect(() => {
    if (!loading) return

    const steps = [
      "Mengekstrak teks dokumen secara in-memory...",
      "Menganalisis kompetensi dan topik dalam dokumen...",
      "Menghubungi Gemini AI Engine...",
      "Mencocokkan profil dokumen dengan katalog mata kuliah...",
      "Menyusun rekomendasi belajar terbaik untuk Anda..."
    ]
    let currentStep = 0
    setLoadingStep(steps[0])

    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length
      setLoadingStep(steps[currentStep])
    }, 2000)

    return () => clearInterval(interval)
  }, [loading])

  const fetchActiveCourses = () => {
    fetch("http://localhost:8001/api/dashboard/")
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error()
      })
      .then((data: StudentDashboardData) => {
        if (data && data.active_courses) {
          setActiveCourseCodes(data.active_courses.map(c => c.code))
        }
      })
      .catch(() => {
        // Silent catch
      })
  }

  React.useEffect(() => {
    fetchActiveCourses()
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const checkFileSupport = (file: File): boolean => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    return ext === '.pdf' || ext === '.xlsx' || ext === '.xls'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (checkFileSupport(droppedFile)) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError("Hanya file PDF atau Excel yang diperbolehkan.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (checkFileSupport(selectedFile)) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Hanya file PDF atau Excel yang diperbolehkan.")
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setRecommendations([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAnalyze = () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setRecommendations([])

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    api.explore.analyze(file)
      .then((data: any) => {
        const curriculumId = data.curriculum_id
        if (!curriculumId) {
          throw new Error("Gagal mendapatkan ID kurikulum dari server.")
        }

        pollingIntervalRef.current = setInterval(() => {
          api.explore.checkStatus(curriculumId)
            .then((statusData: any) => {
              if (statusData.status === "success") {
                setRecommendations(statusData.recommendations || [])
                setLoading(false)
                fetchActiveCourses() // Refresh active list to reflect current status
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current)
                  pollingIntervalRef.current = null
                }
              } else if (statusData.status === "processing") {
                // do nothing (continue polling)
              } else {
                throw new Error(statusData.detail || "Terjadi kesalahan saat memproses kurikulum.")
              }
            })
            .catch((err: any) => {
              setError(err.message || "Gagal memeriksa status rekomendasi.")
              setLoading(false)
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            })
        }, 2000)
      })
      .catch((err: any) => {
        setError(err.message || "Gagal mengunggah file kurikulum.")
        setLoading(false)
      })
  }

  const handleEnroll = (courseCode: string) => {
    fetch("http://localhost:8001/api/courses/enroll/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ course_code: courseCode })
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
        fetchActiveCourses() // Refresh active list
        alert(`Berhasil mengambil mata kuliah ${courseCode}! Silakan cek Dashboard untuk memulai pembelajaran.`)
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-primary">
            Eksplorasi (AI)
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-primary">
              Rekomendasi Rencana Studi AI
            </h1>
            <p className="text-sm text-muted-foreground">
              Unggah proposal penelitian, silabus eksternal, atau dokumen kurikulum Anda untuk mendapatkan rekomendasi mata kuliah yang relevan.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Uploader Card */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl">
                <h3 className="font-heading text-lg font-bold text-primary mb-4">
                  Unggah Dokumen Akademik
                </h3>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragging
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent bg-background"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls"
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-semibold text-primary mb-1">
                    Drag & Drop file Anda di sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    atau klik untuk menjelajah file (Format: PDF / Excel)
                  </p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Selected File Details */}
                {file && (
                  <div className="mt-6 p-4 border rounded-lg bg-background flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-8 w-8 text-accent shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-primary truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {file && !loading && (
                  <Button
                    onClick={handleAnalyze}
                    className="w-full mt-6 bg-destructive hover:bg-destructive/90 text-white cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    Mulai Analisis AI
                  </Button>
                )}
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
              {loading && (
                <Card className="border border-border shadow-sm bg-white p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] rounded-xl">
                  <Loader2 className="h-12 w-12 text-accent animate-spin" />
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-primary">
                      Sedang Menganalisis Dokumen
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">
                      {loadingStep}
                    </p>
                  </div>
                </Card>
              )}

              {!loading && recommendations.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-xl bg-white min-h-[400px]">
                  <Sparkles className="h-12 w-12 text-accent/50 mb-4" />
                  <h3 className="font-heading text-xl font-bold text-primary">Hasil Rekomendasi AI</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Unggah dokumen kurikulum atau proposal rencana belajar Anda di panel kiri untuk memetakan mata kuliah yang paling sesuai.
                  </p>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl font-bold text-primary flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-destructive" />
                      Hasil Rekomendasi untuk Anda
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      Ditemukan {recommendations.length} rekomendasi mata kuliah
                    </span>
                  </div>

                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => {
                      const course = rec.course
                      const isEnrolled = activeCourseCodes.includes(course.code)
                      
                      return (
                        <div key={idx} className="border border-border rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30 font-sans">
                                  {course.code}
                                </span>
                                <span className="text-xs text-muted-foreground">{course.department}</span>
                              </div>
                              <h3 className="font-heading text-xl font-bold text-primary mt-1">
                                {course.title}
                              </h3>
                            </div>
                            
                            {/* Match Percentage Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span className="text-sm font-bold font-heading">{rec.match_percentage}% Relevan</span>
                            </div>
                          </div>

                          <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 text-sm text-primary">
                            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Analisis Kecocokan AI</p>
                            <p className="italic">"{rec.reason}"</p>
                          </div>

                          <div className="space-y-2 border-t border-border pt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modul Pembelajaran</h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {course.modules.map((module) => (
                                <div key={module.id} className="text-xs flex items-center gap-2 text-primary p-2 border rounded bg-background">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                                  <span className="truncate">Modul {module.order}: {module.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                              Bobot: <strong className="text-primary">{course.sks} SKS</strong> | Semester {course.semester}
                            </span>
                            
                            {isEnrolled ? (
                              <span className="text-xs font-bold text-primary bg-accent/20 px-4 py-2 rounded-lg border border-accent/30 flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                Terdaftar di Dashboard
                              </span>
                            ) : (
                              <Button
                                onClick={() => handleEnroll(course.code)}
                                className="bg-destructive hover:bg-destructive/95 text-white text-xs h-9 cursor-pointer px-4 rounded-lg font-medium shadow-sm"
                              >
                                Ambil Mata Kuliah Ini
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
