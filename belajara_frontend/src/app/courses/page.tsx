"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  SlidersHorizontal, 
  BookOpen, 
  AlertCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Upload, 
  FileText, 
  X, 
  Sparkles, 
  Loader2 
} from "lucide-react"

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

interface StudentDashboardData {
  active_courses: Course[]
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Expanded rows state (course code -> boolean)
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})

  // Filter states
  const [search, setSearch] = React.useState<string>("")
  const [department, setDepartment] = React.useState<string>("")
  const [sks, setSks] = React.useState<string>("")

  // Import Dialog states
  const [isImportOpen, setIsImportOpen] = React.useState<boolean>(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importDept, setImportDept] = React.useState<string>("Informatika")
  const [importDragging, setImportDragging] = React.useState<boolean>(false)
  const [importLoading, setImportLoading] = React.useState<boolean>(false)
  const [importStep, setImportStep] = React.useState<string>("Menyiapkan file...")
  const [importError, setImportError] = React.useState<string | null>(null)
  const [importSuccess, setImportSuccess] = React.useState<string | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Cycle loading messages for a premium dynamic UX during AI extraction
  React.useEffect(() => {
    if (!importLoading) return

    const steps = [
      "Mengekstrak teks dokumen PDF/Excel secara in-memory...",
      "Menganalisis daftar mata kuliah menggunakan Gemini 3.5 Flash...",
      "Mengekstrak kode, judul, SKS, dan semester...",
      "Menyusun modul pembelajaran per mata kuliah...",
      "Menyimpan data mata kuliah dan silabus ke PostgreSQL..."
    ]
    let currentStep = 0
    setImportStep(steps[0])

    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length
      setImportStep(steps[currentStep])
    }, 2000)

    return () => clearInterval(interval)
  }, [importLoading])

  // Fetch student active courses to check enrollment status
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
        // Silent catch, fallback to empty active list
      })
  }

  const fetchCourses = React.useCallback(() => {
    setLoading(true)
    setError(null)
    
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (department) params.append("department", department)
    if (sks) params.append("sks", sks)
    
    fetch(`http://localhost:8001/api/courses/?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil daftar mata kuliah")
        }
        return res.json()
      })
      .then((data: Course[]) => {
        setCourses(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Gagal menghubungi server backend.")
        setLoading(false)
      })
  }, [search, department, sks])

  React.useEffect(() => {
    fetchActiveCourses()
  }, [])

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [search, department, sks, fetchCourses])

  const clearFilters = () => {
    setSearch("")
    setDepartment("")
    setSks("")
  }

  const toggleRow = (code: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [code]: !prev[code]
    }))
  }

  // Handle student enrollment
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
        // Success
        fetchActiveCourses() // Refresh active codes
        alert(`Berhasil mengambil mata kuliah ${courseCode}! Silakan klik tombol 'Masuk Kelas' untuk memulai pembelajaran.`)
      })
      .catch((err) => {
        alert(err.message)
      })
  }

  // Import operations
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setImportDragging(true)
  }

  const handleDragLeave = () => {
    setImportDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setImportDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (ext === '.pdf' || ext === '.xlsx' || ext === '.xls') {
        setImportFile(file)
        setImportError(null)
      } else {
        setImportError("Hanya file PDF atau Excel yang diperbolehkan.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (ext === '.pdf' || ext === '.xlsx' || ext === '.xls') {
        setImportFile(file)
        setImportError(null)
      } else {
        setImportError("Hanya file PDF atau Excel yang diperbolehkan.")
      }
    }
  }

  const handleImportSubmit = () => {
    if (!importFile) return

    setImportLoading(true)
    setImportError(null)
    setImportSuccess(null)

    const formData = new FormData()
    formData.append("file", importFile)
    formData.append("department", importDept)

    fetch("http://localhost:8001/api/explore/upload-curriculum/", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.detail || "Gagal memproses file kurikulum.")
          })
        }
        return res.json()
      })
      .then((data) => {
        setImportLoading(false)
        setImportSuccess(data.message || "Kurikulum berhasil diimpor!")
        setImportFile(null)
        fetchCourses() // Refresh catalog
        setTimeout(() => {
          setIsImportOpen(false)
          setImportSuccess(null)
        }, 2000)
      })
      .catch((err) => {
        setImportLoading(false)
        setImportError(err.message || "Terjadi kesalahan koneksi.")
      })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-primary">
            Katalog Mata Kuliah
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-heading font-bold text-primary">
                Katalog Mata Kuliah
              </h1>
              <p className="text-sm text-muted-foreground">
                Eksplorasi silabus kurikulum dan daftarkan mata kuliah pilihan Anda langsung ke sistem.
              </p>
            </div>
            
            <Button
              onClick={() => setIsImportOpen(true)}
              className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium self-start md:self-auto shadow-sm"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Import Kurikulum (AI)</span>
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border border-border bg-white rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              <span>Filter & Pencarian</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari mata kuliah atau kode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white border border-border rounded-lg text-primary focus:outline-none"
                />
              </div>

              {/* Department Select */}
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
              >
                <option value="">Semua Jurusan</option>
                <option value="Informatika">Informatika</option>
                <option value="Sistem Informasi">Sistem Informasi</option>
              </select>

              {/* SKS Select */}
              <select
                value={sks}
                onChange={(e) => setSks(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
              >
                <option value="">Semua Bobot SKS</option>
                <option value="2">2 SKS</option>
                <option value="3">3 SKS</option>
                <option value="4">4 SKS</option>
              </select>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Menampilkan {courses.length} mata kuliah
              </span>
              {(search || department || sks) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-xs text-destructive hover:text-destructive/80 h-8 cursor-pointer"
                >
                  Bersihkan Filter
                </Button>
              )}
            </div>
          </div>

          {/* DataTable Card Container */}
          <Card className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border/80 px-6 py-4 bg-white">
              <CardTitle className="text-lg font-bold text-primary">Daftar Kurikulum Aktif</CardTitle>
              <CardDescription className="text-xs">Informasi lengkap seluruh mata kuliah yang terintegrasi di sistem.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-60" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <h3 className="font-heading text-lg font-bold text-primary">Gagal Memuat Data</h3>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button onClick={fetchCourses} className="bg-destructive text-white text-xs px-4 h-9 rounded-lg">Coba Lagi</Button>
                </div>
              ) : courses.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm">Tidak ada mata kuliah yang cocok dengan kriteria pencarian Anda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Kode</TableHead>
                      <TableHead>Nama Mata Kuliah</TableHead>
                      <TableHead className="w-[80px]">SKS</TableHead>
                      <TableHead className="w-[100px]">Semester</TableHead>
                      <TableHead className="w-[180px]">Jurusan</TableHead>
                      <TableHead className="w-[200px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => {
                      const isExpanded = !!expandedRows[course.code]
                      const isEnrolled = activeCourseCodes.includes(course.code)
                      
                      return (
                        <React.Fragment key={course.id}>
                          <TableRow className="group/row">
                            <TableCell className="font-semibold text-primary">
                              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-accent/15 border border-accent/25">
                                {course.code}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-primary">{course.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-lg">
                                {course.description}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-primary">{course.sks} SKS</TableCell>
                            <TableCell className="text-muted-foreground font-medium">Sem {course.semester}</TableCell>
                            <TableCell className="text-accent-foreground font-semibold text-xs">{course.department}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => toggleRow(course.code)}
                                  className="text-xs h-8 px-2 flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-primary hover:bg-secondary/40 rounded-md"
                                >
                                  <span>Silabus</span>
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </Button>
                                
                                {isEnrolled ? (
                                  <Button
                                    onClick={() => router.push(`/courses/${course.code}`)}
                                    className="bg-destructive hover:bg-destructive/95 text-white text-xs h-8 px-3 rounded-lg cursor-pointer font-medium flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="h-3.5 w-3.5 text-white font-bold" />
                                    Masuk Kelas
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleEnroll(course.code)}
                                    className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-3 rounded-lg cursor-pointer font-medium"
                                  >
                                    Ambil Kelas
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Syllabus Row */}
                          {isExpanded && (
                            <TableRow className="bg-secondary/10">
                              <TableCell colSpan={6} className="p-4 border-b border-border/40">
                                <div className="pl-4 border-l-2 border-accent/40 space-y-3">
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deskripsi Lengkap</h4>
                                    <p className="text-sm text-primary mt-1 leading-relaxed max-w-3xl">
                                      {course.description || "Belum ada deskripsi untuk mata kuliah ini."}
                                    </p>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Modul Pembelajaran ({course.modules.length})</h4>
                                    {course.modules.length === 0 ? (
                                      <p className="text-xs text-muted-foreground italic">Belum ada modul pembelajaran yang didefinisikan.</p>
                                    ) : (
                                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
                                        {course.modules.map((mod) => (
                                          <div key={mod.id} className="p-2.5 border border-border bg-white rounded-lg flex flex-col justify-between shadow-xs">
                                            <div>
                                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {mod.order}</span>
                                              <h5 className="font-semibold text-xs text-primary mt-0.5 leading-snug">{mod.title}</h5>
                                              <p className="text-[11px] text-muted-foreground leading-normal mt-1">{mod.description}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Custom HTML-based Import Dialog */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white border border-border shadow-xl rounded-xl overflow-hidden p-6 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsImportOpen(false)
                setImportFile(null)
                setImportError(null)
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-primary h-8 w-8 cursor-pointer rounded-full"
              disabled={importLoading}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-destructive" />
                Import Kurikulum AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Unggah file kurikulum perguruan tinggi (PDF atau Excel). Gemini AI akan mengekstrak mata kuliah dan bab silabus secara otomatis ke catalog database.
              </p>
            </div>

            {importSuccess ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[200px]">
                <div className="h-10 w-10 bg-accent/25 text-primary border border-accent/40 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 font-bold" />
                </div>
                <h4 className="font-heading text-lg font-bold text-primary">Import Berhasil</h4>
                <p className="text-xs text-muted-foreground">{importSuccess}</p>
              </div>
            ) : importLoading ? (
              <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="h-10 w-10 text-accent animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-heading text-base font-bold text-primary">Sedang Memproses Dokumen</h4>
                  <p className="text-xs text-muted-foreground font-medium animate-pulse">{importStep}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Department select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">Mata Kuliah Pilihan Jurusan</label>
                  <select
                    value={importDept}
                    onChange={(e) => setImportDept(e.target.value)}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Informatika">Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                  </select>
                </div>

                {/* Upload drag-n-drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    importDragging
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
                  <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-xs font-bold text-primary mb-0.5">Drag & Drop file di sini</p>
                  <p className="text-[10px] text-muted-foreground">atau klik untuk menelusuri (PDF atau Excel)</p>
                </div>

                {importError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* File Details */}
                {importFile && (
                  <div className="p-3 border rounded-lg bg-background flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-7 w-7 text-accent shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-primary truncate">{importFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setImportFile(null)}
                      className="text-muted-foreground hover:text-destructive h-7 w-7 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleImportSubmit}
                  disabled={!importFile}
                  className="w-full bg-destructive hover:bg-destructive/90 text-white cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                  Mulai Impor AI
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </SidebarProvider>
  )
}
