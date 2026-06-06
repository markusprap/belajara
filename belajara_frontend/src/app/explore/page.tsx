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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle, Check, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { api, getUser, getToken } from "@/lib/api"

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

interface AcademicProfile {
  completed_subjects: string[]
  competency_gaps: string[]
  career_recommendations: string
}

interface StudentDashboardData {
  active_courses: Course[]
}

interface BenchmarkCourse {
  name: string
  category: string
}

interface Benchmark {
  id: string
  name: string
  description: string
  courses: BenchmarkCourse[]
}

interface SkillCategory {
  key: string
  label: string
  keywords: string[]
}

const SKILL_CONFIGS: Record<string, SkillCategory[]> = {
  "Informatika": [
    { key: "softwareEng", label: "Software Eng.", keywords: ["pemrograman", "rpl", "perangkat lunak", "web", "pbo", "oop", "object", "algoritma", "struktur data", "coding", "programming"] },
    { key: "dataSci", label: "Data Sci. & AI", keywords: ["data mining", "sains data", "data science", "kecerdasan buatan", "ai", "machine learning", "statistika", "statistik", "data analisis", "analisis data", "visualisasi", "pembelajaran mesin"] },
    { key: "systemArch", label: "System Arch.", keywords: ["enterprise", "arsitektur", "jaringan", "cloud", "infrastruktur", "sistem enterprise"] },
    { key: "mathLogic", label: "Math & Logic", keywords: ["matematika", "diskrit", "kalkulus", "aljabar", "logika", "teori", "komputasi"] },
    { key: "businessIntel", label: "Business Intel.", keywords: ["sistem pendukung keputusan", "decision support", "spk", "manajemen", "bisnis", "proyek", "analitik", "informasi"] }
  ],
  "Sistem Informasi": [
    { key: "softwareEng", label: "Software Eng.", keywords: ["pemrograman", "rpl", "perangkat lunak", "web", "pbo", "oop", "object", "algoritma", "struktur data", "coding", "programming"] },
    { key: "dataSci", label: "Data Sci. & AI", keywords: ["data mining", "sains data", "data science", "kecerdasan buatan", "ai", "machine learning", "statistika", "statistik", "data analisis", "analisis data", "visualisasi", "pembelajaran mesin"] },
    { key: "systemArch", label: "Enterprise Arch.", keywords: ["enterprise", "arsitektur", "jaringan", "cloud", "infrastruktur", "sistem enterprise", "tata kelola"] },
    { key: "mathLogic", label: "Quantitative", keywords: ["matematika", "diskrit", "kalkulus", "aljabar", "logika", "statistik", "analisis kuantitatif"] },
    { key: "businessIntel", label: "Business System", keywords: ["sistem informasi manajemen", "sim", "sistem pendukung keputusan", "spk", "manajemen", "bisnis", "analisis bisnis", "proyek"] }
  ],
  "Akuntansi": [
    { key: "financialAcct", label: "Financial Acct.", keywords: ["akuntansi keuangan", "keuangan", "pelaporan keuangan", "akuntansi pengantar", "standar akuntansi", "debet", "kredit", "jurnal"] },
    { key: "managerialAcct", label: "Managerial Acct.", keywords: ["akuntansi manajemen", "akuntansi biaya", "biaya", "anggaran", "pengendalian manajemen"] },
    { key: "auditing", label: "Auditing", keywords: ["audit", "pengauditan", "internal audit", "pemeriksaan akuntansi", "opini audit"] },
    { key: "taxation", label: "Taxation", keywords: ["pajak", "perpajakan", "pajak penghasilan", "pph", "ppn", "brevet"] },
    { key: "acctSystems", label: "Accounting Info Sys.", keywords: ["sistem informasi akuntansi", "sia", "sia sistem", "teknologi akuntansi", "sap", "audit sistem informasi"] }
  ],
  "Manajemen": [
    { key: "strategicMgmt", label: "Strategic Mgmt.", keywords: ["manajemen strategis", "strategi", "kebijakan bisnis", "pengambilan keputusan"] },
    { key: "financeAcct", label: "Finance & Acct.", keywords: ["keuangan", "akuntansi", "manajemen keuangan", "investasi", "pasar modal", "portofolio"] },
    { key: "marketing", label: "Marketing", keywords: ["pemasaran", "marketing", "promosi", "perilaku konsumen", "riset pemasaran", "brand"] },
    { key: "opsLogistics", label: "Ops & Logistics", keywords: ["operasional", "logistik", "rantai pasok", "supply chain", "manajemen operasi", "produksi"] },
    { key: "hrOrg", label: "HR & Org.", keywords: ["sdm", "sumber daya manusia", "organisasi", "perilaku organisasi", "kepemimpinan", "leadership"] }
  ],
  "Umum": [
    { key: "coreSubjects", label: "Core Subjects", keywords: ["utama", "pengantar", "dasar", "pokok", "keahlian"] },
    { key: "methodology", label: "Methodology", keywords: ["metode penelitian", "metodologi", "riset", "skripsi", "penulisan ilmiah"] },
    { key: "quantAnalysis", label: "Quant Analysis", keywords: ["kuantitatif", "matematika", "statistika", "statistik", "analisis data"] },
    { key: "softSkills", label: "Soft Skills & Ethics", keywords: ["etika", "komunikasi", "kepemimpinan", "karakter", "pancasila", "kewarganegaraan", "agama"] },
    { key: "electives", label: "Elective Specialist", keywords: ["pilihan", "elektif", "peminatan", "spesifik", "lanjutan"] }
  ]
}

const BENCHMARKS: Record<string, Benchmark[]> = {
  "Informatika": [
    {
      id: "aptikom-if",
      name: "Standar APTIKOM (Informatika)",
      description: "Kurikulum Inti Informatika Asosiasi Pendidikan Tinggi Informatika dan Komputer Indonesia.",
      courses: [
        { name: "Algoritma & Struktur Data", category: "softwareEng" },
        { name: "Basis Data", category: "softwareEng" },
        { name: "Pemrograman Web", category: "softwareEng" },
        { name: "Rekayasa Perangkat Lunak", category: "softwareEng" },
        { name: "Matematika Diskrit", category: "mathLogic" },
        { name: "Kecerdasan Buatan", category: "dataSci" },
        { name: "Sistem Jaringan / Operasi", category: "systemArch" }
      ]
    },
    {
      id: "acm-cs",
      name: "ACM/IEEE Computer Science 2023",
      description: "International standard computing curriculum guidelines by ACM and IEEE-CS.",
      courses: [
        { name: "Software Development Fundamentals", category: "softwareEng" },
        { name: "Algorithms and Complexity", category: "softwareEng" },
        { name: "Systems Fundamentals", category: "systemArch" },
        { name: "Discrete Structures", category: "mathLogic" },
        { name: "Data Management & Analytics", category: "dataSci" },
        { name: "Artificial Intelligence", category: "dataSci" }
      ]
    }
  ],
  "Sistem Informasi": [
    {
      id: "aptikom-si",
      name: "Standar APTIKOM (Sistem Informasi)",
      description: "Kurikulum Nasional Rumpun Sistem Informasi.",
      courses: [
        { name: "Sistem Informasi Manajemen", category: "businessIntel" },
        { name: "Analisis & Perancangan Sistem", category: "softwareEng" },
        { name: "Manajemen Proyek TI", category: "businessIntel" },
        { name: "Basis Data", category: "softwareEng" },
        { name: "Sistem Pendukung Keputusan", category: "businessIntel" },
        { name: "Tata Kelola TI", category: "businessIntel" }
      ]
    },
    {
      id: "acm-msis",
      name: "ACM/AIS MSIS Core Curriculum",
      description: "International curriculum guidelines for MS in Information Systems.",
      courses: [
        { name: "Enterprise Architecture", category: "systemArch" },
        { name: "IS Strategy and Governance", category: "businessIntel" },
        { name: "Data Management & Analytics", category: "dataSci" },
        { name: "Systems Analysis and Design", category: "softwareEng" },
        { name: "Project Management", category: "businessIntel" }
      ]
    }
  ],
  "Manajemen": [
    {
      id: "aacsb-manajemen",
      name: "Standar Global AACSB (Manajemen)",
      description: "Kurikulum standar internasional sekolah bisnis dari AACSB.",
      courses: [
        { name: "Manajemen Strategis", category: "businessIntel" },
        { name: "Perilaku Organisasi", category: "businessIntel" },
        { name: "Manajemen Pemasaran", category: "businessIntel" },
        { name: "Pengantar Bisnis", category: "businessIntel" },
        { name: "Statistika Bisnis", category: "mathLogic" },
        { name: "Manajemen Operasional", category: "businessIntel" }
      ]
    },
    {
      id: "kkni-manajemen",
      name: "KKNI Level 6 (Manajemen Indonesia)",
      description: "Kerangka Kualifikasi Nasional Indonesia rumpun Manajemen.",
      courses: [
        { name: "Manajemen Keuangan", category: "businessIntel" },
        { name: "Manajemen Sumber Daya Manusia", category: "businessIntel" },
        { name: "Kewirausahaan", category: "businessIntel" },
        { name: "Sistem Informasi Manajemen", category: "businessIntel" },
        { name: "Metode Penelitian", category: "mathLogic" }
      ]
    }
  ],
  "Umum": [
    {
      id: "sndikti-umum",
      name: "SN-Dikti (Standar Nasional Indonesia)",
      description: "Standar Nasional Pendidikan Tinggi Indonesia untuk seluruh Program Studi.",
      courses: [
        { name: "Pendidikan Pancasila & Kewarganegaraan", category: "mathLogic" },
        { name: "Pendidikan Agama", category: "mathLogic" },
        { name: "Bahasa Indonesia", category: "mathLogic" },
        { name: "Bahasa Inggris Akademik", category: "mathLogic" },
        { name: "Metodologi Penelitian", category: "mathLogic" }
      ]
    }
  ]
}

const isSubjectCompleted = (benchmarkName: string, completedList: string[]) => {
  const cleanBenchmark = benchmarkName.toLowerCase()
  return completedList.some(comp => {
    const cleanComp = comp.toLowerCase()
    if (cleanComp.includes(cleanBenchmark) || cleanBenchmark.includes(cleanComp)) {
      return true
    }
    if (cleanBenchmark.includes("algoritma") && cleanComp.includes("algoritma")) return true
    if (cleanBenchmark.includes("basis data") && cleanComp.includes("basis data")) return true
    if (cleanBenchmark.includes("pemrograman") && cleanComp.includes("pemrograman")) return true
    if (cleanBenchmark.includes("rekayasa perangkat lunak") && (cleanComp.includes("rpl") || cleanComp.includes("perangkat lunak"))) return true
    if (cleanBenchmark.includes("statistika") && cleanComp.includes("statistik")) return true
    if (cleanBenchmark.includes("sistem pendukung keputusan") && (cleanComp.includes("spk") || cleanComp.includes("decision support"))) return true
    if (cleanBenchmark.includes("sistem informasi manajemen") && cleanComp.includes("sim")) return true
    return false
  })
}

export default function ExplorePage() {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [loadingStep, setLoadingStep] = React.useState<string>("Mengunggah file...")
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([])
  const [academicProfile, setAcademicProfile] = React.useState<AcademicProfile | null>(null)
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pollingIntervalRef = React.useRef<any>(null)

  const [expandedRecs, setExpandedRecs] = React.useState<Record<string, boolean>>({})
  const [hoveredCourse, setHoveredCourse] = React.useState<Course | null>(null)
  const [viewMode, setViewMode] = React.useState<"cards" | "timeline">("cards")

  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [selectedBenchmarkId, setSelectedBenchmarkId] = React.useState<string>("")

  React.useEffect(() => {
    setCurrentUser(getUser())
  }, [])

  const userProdi = currentUser?.mahasiswa_profile?.jurusan || currentUser?.jurusan || "Informatika"
  const skillProdiKey = Object.keys(SKILL_CONFIGS).find(
    key => userProdi.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(userProdi.toLowerCase())
  ) || "Umum"
  const skillCategories = SKILL_CONFIGS[skillProdiKey] || SKILL_CONFIGS["Umum"]

  const prodiKey = Object.keys(BENCHMARKS).find(
    key => userProdi.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(userProdi.toLowerCase())
  ) || "Umum"
  const matchedBenchmarks = BENCHMARKS[prodiKey] || BENCHMARKS["Umum"]

  const allBenchmarks = React.useMemo(() => {
    return Object.entries(BENCHMARKS).flatMap(([category, list]) =>
      list.map(b => ({ ...b, category }))
    )
  }, [])

  React.useEffect(() => {
    if (matchedBenchmarks && matchedBenchmarks.length > 0) {
      setSelectedBenchmarkId(matchedBenchmarks[0].id)
    }
  }, [currentUser, prodiKey])

  const toggleRecExpand = (courseCode: string) => {
    setExpandedRecs(prev => ({
      ...prev,
      [courseCode]: !prev[courseCode]
    }))
  }

  const getSkillData = (additionalSubject?: string) => {
    const skills: Record<string, number> = {}
    skillCategories.forEach(cat => {
      skills[cat.key] = 20
    })

    const completed = academicProfile?.completed_subjects || []
    const subjects = additionalSubject ? [...completed, additionalSubject] : completed

    if (subjects.length === 0) {
      return skills
    }

    subjects.forEach((subject: string) => {
      const normalized = subject.toLowerCase()
      skillCategories.forEach(cat => {
        const matches = cat.keywords.some(kw => normalized.includes(kw))
        if (matches) {
          skills[cat.key] = Math.min(100, skills[cat.key] + 20)
        }
      })
    })

    return skills
  }

  const skillValues = getSkillData()
  const skillList = skillCategories.map(cat => ({
    label: cat.label,
    value: skillValues[cat.key]
  }))

  const projectedValues = hoveredCourse ? getSkillData(hoveredCourse.title) : null
  const projectedList = projectedValues
    ? skillCategories.map(cat => ({
        label: cat.label,
        value: projectedValues[cat.key]
      }))
    : []

  const cx = 125
  const cy = 115
  const r = 65

  const getCoordinates = (index: number, val: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2
    const x = cx + r * (val / 100) * Math.cos(angle)
    const y = cy + r * (val / 100) * Math.sin(angle)
    return { x, y }
  }

  const pointsStr = skillList
    .map((s, idx) => {
      const coords = getCoordinates(idx, s.value)
      return `${coords.x},${coords.y}`
    })
    .join(" ")

  const projectedPointsStr = projectedList
    .map((s, idx) => {
      const coords = getCoordinates(idx, s.value)
      return `${coords.x},${coords.y}`
    })
    .join(" ")

  const gridLevels = [20, 40, 60, 80, 100]

  const getGridPath = (level: number) => {
    return Array.from({ length: 5 })
      .map((_, idx) => {
        const coords = getCoordinates(idx, level)
        return `${idx === 0 ? "M" : "L"} ${coords.x} ${coords.y}`
      })
      .join(" ") + " Z"
  }

  const getLabelCoordinates = (index: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2
    let labelOffset = 18
    if (index === 0) labelOffset = 15 // Top
    const x = cx + (r + labelOffset) * Math.cos(angle)
    const y = cy + (r + 12) * Math.sin(angle)
    return { x, y }
  }

  const activeBenchmark = allBenchmarks.find(b => b.id === selectedBenchmarkId) || matchedBenchmarks[0]

  const benchmarkStats = React.useMemo(() => {
    if (!activeBenchmark) return null
    const completedSubjects = academicProfile?.completed_subjects || []
    
    let matchedCount = 0
    const details = activeBenchmark.courses.map(course => {
      const completed = isSubjectCompleted(course.name, completedSubjects)
      if (completed) matchedCount++
      return {
        name: course.name,
        completed
      }
    })
    
    const percentage = activeBenchmark.courses.length > 0 
      ? Math.round((matchedCount / activeBenchmark.courses.length) * 100)
      : 0
      
    return {
      percentage,
      matchedCount,
      totalCount: activeBenchmark.courses.length,
      details
    }
  }, [activeBenchmark, academicProfile])

  // Cycle loading messages for a premium dynamic UX
  React.useEffect(() => {
    if (!loading) return

    const steps = [
      "Mengekstrak teks dokumen akademik...",
      "Menganalisis kompetensi dan topik studi...",
      "Memproses data melalui sistem analisis AI...",
      "Mencocokkan dokumen dengan katalog mata kuliah...",
      "Menyusun rekomendasi rencana studi..."
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
        setError("Hanya dokumen PDF atau Excel yang diperbolehkan.")
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
        setError("Hanya dokumen PDF atau Excel yang diperbolehkan.")
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setRecommendations([])
    setAcademicProfile(null)
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
    setAcademicProfile(null)

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
                const recs = statusData.recommendations || []
                setRecommendations(recs)
                if (recs.length > 0) {
                  setExpandedRecs({ [recs[0].course.code]: true })
                }
                setAcademicProfile(statusData.academic_profile || null)
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
    const token = getToken()
    if (!token) {
      router.push(`/login?redirect=explore`)
      return
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }

    fetch("http://127.0.0.1:8001/api/courses/enroll/", {
      method: "POST",
      headers,
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
        router.push(`/courses/${courseCode}`)
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
            Eksplorasi Rencana Studi
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-primary">
              Rekomendasi Rencana Studi Berbasis AI
            </h1>
            <p className="text-sm text-muted-foreground">
              Unggah proposal penelitian, silabus eksternal, atau dokumen kurikulum Anda untuk mendapatkan rekomendasi mata kuliah secara terstruktur.
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
                    Tarik & lepas dokumen Anda di sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    atau klik untuk mencari dokumen (Format: PDF / Excel)
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
                    Mulai Analisis Dokumen
                  </Button>
                )}
              </Card>

              {/* Competency Spider Chart Card */}
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl flex flex-col items-center select-none">
                <div className="w-full border-b border-border pb-3 mb-4 text-left">
                  <h3 className="font-heading text-base font-bold text-primary">
                    Peta Kompetensi Mahasiswa
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {!academicProfile 
                      ? "Visualisasi gap kompetensi (unggah dokumen untuk memperbarui)" 
                      : "Pemetaan kekuatan akademik Anda secara visual"}
                  </p>
                </div>
                
                <div className="relative w-full flex justify-center items-center">
                  <svg width="250" height="230" className="overflow-visible">
                    {/* Grid Pentagons */}
                    {gridLevels.map((lvl) => (
                      <path
                        key={lvl}
                        d={getGridPath(lvl)}
                        fill="none"
                        stroke="#FAF9FB"
                        strokeWidth="1.5"
                        className="stroke-slate-100 dark:stroke-slate-800"
                      />
                    ))}
                    <path
                      d={getGridPath(100)}
                      fill="none"
                      stroke="#E8E5E9"
                      strokeWidth="1"
                    />
                    
                    {/* Grid Lines */}
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const outerCoords = getCoordinates(idx, 100)
                      return (
                        <line
                          key={idx}
                          x1={cx}
                          y1={cy}
                          x2={outerCoords.x}
                          y2={outerCoords.y}
                          stroke="#E8E5E9"
                          strokeWidth="1"
                          strokeDasharray="2"
                        />
                      )
                    })}
                    
                    {/* User Data Polygon */}
                    <polygon
                      points={pointsStr}
                      fill="rgba(207, 58, 31, 0.15)"
                      stroke="#CF3A1F"
                      strokeWidth="2"
                      className="transition-all duration-500 ease-in-out"
                    />
                    
                    {/* Projected Data Polygon (What-If Hover) */}
                    {projectedValues && (
                      <polygon
                        points={projectedPointsStr}
                        fill="rgba(198, 181, 191, 0.15)"
                        stroke="#C6B5BF"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        className="transition-all duration-300 ease-in-out"
                      />
                    )}
                    
                    {/* User Data Vertices Dots */}
                    {skillList.map((s, idx) => {
                      const coords = getCoordinates(idx, s.value)
                      return (
                        <circle
                          key={idx}
                          cx={coords.x}
                          cy={coords.y}
                          r="3.5"
                          fill="#CF3A1F"
                          stroke="#ffffff"
                          strokeWidth="1"
                          className="transition-all duration-500 ease-in-out"
                        />
                      )
                    })}
                    
                    {/* Axis Labels */}
                    {skillList.map((s, idx) => {
                      const coords = getLabelCoordinates(idx)
                      let textAnchor: "middle" | "start" | "end" = "middle"
                      if (idx === 0) textAnchor = "middle"
                      if (idx === 1) textAnchor = "start"
                      if (idx === 2) textAnchor = "start"
                      if (idx === 3) textAnchor = "end"
                      if (idx === 4) textAnchor = "end"
                      
                      return (
                        <g key={idx}>
                          <text
                            x={coords.x}
                            y={coords.y}
                            textAnchor={textAnchor}
                            className="text-[9px] font-black fill-slate-700 uppercase tracking-wider"
                          >
                            {s.label}
                          </text>
                          <text
                            x={coords.x}
                            y={coords.y + 9}
                            textAnchor={textAnchor}
                            className="text-[9px] font-mono font-bold fill-[#CF3A1F]"
                          >
                            {s.value}%
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </Card>

              {/* Benchmarking Kurikulum Card */}
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl flex flex-col select-none">
                <div className="w-full border-b border-border pb-3 mb-4 text-left">
                  <h3 className="font-heading text-base font-bold text-primary">
                    Benchmarking Kurikulum
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Perbandingan keselarasan studi Anda dengan kurikulum standar program studi <strong>{userProdi}</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Select Benchmark */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Pilih Standar Benchmark
                    </label>
                    <select
                      value={selectedBenchmarkId}
                      onChange={(e) => setSelectedBenchmarkId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF9FB] border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-[#C6B5BF] cursor-pointer"
                    >
                      {Object.entries(BENCHMARKS).map(([category, list]) => (
                        <optgroup key={category} label={category}>
                          {list.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {activeBenchmark && (
                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                      {activeBenchmark.description}
                    </p>
                  )}

                  {!academicProfile ? (
                    <div className="p-4 border border-dashed rounded-lg bg-background text-center">
                      <p className="text-xs text-muted-foreground">
                        Unggah transkrip/dokumen kurikulum Anda untuk melihat tingkat keselarasan kurikulum.
                      </p>
                    </div>
                  ) : (
                    benchmarkStats && (
                      <div className="space-y-4 pt-2">
                        {/* Match Indicator */}
                        <div className="p-4 bg-[#FAF9FB] rounded-xl border border-border flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Keselarasan Kurikulum</p>
                            <p className="text-2xl font-bold font-heading text-primary mt-0.5">{benchmarkStats.percentage}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mata Kuliah Terpenuhi</p>
                            <p className="text-xs font-bold text-[#CF3A1F] mt-1">{benchmarkStats.matchedCount} / {benchmarkStats.totalCount}</p>
                          </div>
                        </div>

                        {/* Benchmark Subjects list */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Modul / Mata Kuliah Standar</p>
                          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                            {benchmarkStats.details.map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs bg-white">
                                <span className="font-medium text-slate-700">{item.name}</span>
                                {item.completed ? (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 shrink-0">
                                    <Check className="h-2.5 w-2.5" /> Terpenuhi
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-0.5 shrink-0">
                                    Belum
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
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

              {!loading && !academicProfile && recommendations.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-xl bg-white min-h-[400px]">
                  <Sparkles className="h-12 w-12 text-accent/50 mb-4" />
                  <h3 className="font-heading text-xl font-bold text-primary">Hasil Rekomendasi Rencana Studi</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Unggah dokumen kurikulum atau proposal rencana belajar Anda di panel kiri untuk memetakan mata kuliah yang paling sesuai.
                  </p>
                </div>
              )}

              {/* Display Results */}
              {!loading && (academicProfile || recommendations.length > 0) && (
                <div className="space-y-6">
                  {/* Academic Profile Analysis Block */}
                  {academicProfile && (
                    <Card className="border border-border shadow-sm bg-white p-6 rounded-xl space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary text-primary">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="font-heading text-xl font-bold text-primary">
                              Analisis Profil &amp; Kinerja Akademik
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              Hasil pemetaan transkrip/dokumen akademik yang diunggah secara mandiri
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => window.print()}
                          variant="outline"
                          className="text-xs font-semibold px-4 py-2 border border-border hover:bg-[#FAF9FB] cursor-pointer print:hidden flex items-center gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Cetak Laporan (PDF)
                        </Button>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Completed Competencies */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            Kompetensi / Mata Kuliah Dikuasai
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {academicProfile.completed_subjects && academicProfile.completed_subjects.length > 0 ? (
                              academicProfile.completed_subjects.map((sub, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/50 flex items-center gap-1"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  {sub}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Tidak ada mata kuliah terdeteksi.</span>
                            )}
                          </div>
                        </div>

                        {/* Competency Gaps */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                            Kesenjangan Kompetensi
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {academicProfile.competency_gaps && academicProfile.competency_gaps.length > 0 ? (
                              academicProfile.competency_gaps.map((gap, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-background text-primary border border-border flex items-center gap-1"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                  {gap}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Tidak ada kesenjangan kompetensi terdeteksi.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Career Recommendations */}
                      {academicProfile.career_recommendations && (
                        <div className="border-t border-border pt-4 space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Prospek &amp; Rekomendasi Jalur Karir
                          </h3>
                          <p className="text-sm text-primary leading-relaxed bg-[#FAF9FB] p-4 rounded-xl border border-border">
                            {academicProfile.career_recommendations}
                          </p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Belajara Catalogue Recommendations Block */}
                  {recommendations.length > 0 && (
                    <div className="space-y-6 pt-2">
                      <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                        <h2 className="font-heading text-xl font-bold text-primary flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-destructive" />
                          Rekomendasi Kelas Belajara Terkait
                        </h2>
                        <div className="flex bg-[#FAF9FB] border border-border p-1 rounded-lg text-xs font-semibold select-none">
                          <button
                            onClick={() => setViewMode("cards")}
                            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                              viewMode === "cards" ? "bg-white text-primary shadow-xs" : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            Daftar Kartu
                          </button>
                          <button
                            onClick={() => setViewMode("timeline")}
                            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                              viewMode === "timeline" ? "bg-white text-primary shadow-xs" : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            Jalur Belajar
                          </button>
                        </div>
                      </div>

                      {viewMode === "timeline" ? (
                        <div className="relative pl-6 border-l border-border ml-3 py-2 space-y-8 animate-in fade-in duration-300">
                          {[...recommendations].sort((a, b) => {
                            if (a.course.semester !== b.course.semester) {
                              return a.course.semester - b.course.semester
                            }
                            return a.course.code.localeCompare(b.course.code)
                          }).map((rec, idx) => {
                            const course = rec.course
                            const isEnrolled = activeCourseCodes.includes(course.code)
                            const isHovered = hoveredCourse?.code === course.code

                            return (
                              <div
                                key={idx}
                                className="relative space-y-3"
                                onMouseEnter={() => setHoveredCourse(course)}
                                onMouseLeave={() => setHoveredCourse(null)}
                              >
                                {/* Timeline dot */}
                                <div className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-300 ${
                                  isEnrolled 
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-500" 
                                    : isHovered
                                      ? "border-[#CF3A1F] scale-110"
                                      : "border-slate-300"
                                }`}>
                                  {isEnrolled && <Check className="h-1.5 w-1.5 stroke-[4]" />}
                                </div>

                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30 font-sans">
                                        {course.code}
                                      </span>
                                      <span className="text-xs text-muted-foreground font-semibold">Semester {course.semester}</span>
                                      <span className="text-xs text-slate-300">|</span>
                                      <span className="text-xs text-muted-foreground">{course.department}</span>
                                    </div>
                                    <h3 className="font-heading text-base font-bold text-primary mt-1">
                                      {course.title}
                                    </h3>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20 flex items-center gap-1">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      {rec.match_percentage}% Relevan
                                    </span>
                                    {isEnrolled ? (
                                      <span className="text-[10px] font-bold text-primary bg-accent/20 px-3 py-1.5 rounded-lg border border-accent/30 flex items-center gap-0.5 shrink-0">
                                        <Check className="h-3.5 w-3.5" /> Terdaftar
                                      </span>
                                    ) : (
                                      <Button
                                        onClick={() => handleEnroll(course.code)}
                                        className="bg-destructive hover:bg-destructive/95 text-white text-[10px] h-8 cursor-pointer px-3 rounded-lg font-medium shadow-xs shrink-0"
                                      >
                                        Ambil Kelas
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                <div className="p-4 bg-secondary/40 rounded-xl border border-border/50 text-xs text-primary max-w-3xl leading-relaxed">
                                  <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Analisis Kecocokan AI</p>
                                  <p className="italic">"{rec.reason}"</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recommendations.map((rec, idx) => {
                          const course = rec.course
                          const isEnrolled = activeCourseCodes.includes(course.code)
                          const isExpanded = !!expandedRecs[course.code]

                          return (
                            <div
                              key={idx}
                              className={`border border-border rounded-xl bg-white shadow-sm transition-all duration-200 overflow-hidden flex flex-col ${
                                isExpanded ? "p-6 gap-4" : "p-4 hover:border-[#C6B5BF]/40 cursor-pointer"
                              }`}
                              onClick={!isExpanded ? () => toggleRecExpand(course.code) : undefined}
                              onMouseEnter={() => setHoveredCourse(course)}
                              onMouseLeave={() => setHoveredCourse(null)}
                            >
                              <div
                                className={`flex items-start justify-between gap-4 flex-wrap select-none ${isExpanded ? "cursor-pointer" : ""}`}
                                onClick={isExpanded ? () => toggleRecExpand(course.code) : undefined}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30 font-sans">
                                      {course.code}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{course.department}</span>
                                  </div>
                                  <h3 className="font-heading text-lg font-bold text-primary mt-1">
                                    {course.title}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Match Percentage Badge */}
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold font-heading">{rec.match_percentage}% Relevan</span>
                                  </div>

                                  {/* Chevron Toggle Icon */}
                                  <span className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </span>
                                </div>
                              </div>

                              {isExpanded && (
                                <>
                                  <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 text-sm text-primary animate-in fade-in duration-200">
                                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Analisis Kecocokan AI</p>
                                    <p className="italic">"{rec.reason}"</p>
                                  </div>

                                  <div className="space-y-2 border-t border-border pt-4 animate-in fade-in duration-200">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modul Belajar</h4>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {course.modules.map((module) => (
                                        <div key={module.id} className="text-xs flex items-center gap-2 text-primary p-2 border rounded bg-background">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                                          <span className="truncate">Modul Belajar {module.order}: {module.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2 animate-in fade-in duration-200">
                                    <span className="text-xs text-muted-foreground">
                                      Bobot: <strong className="text-primary">{course.sks} SKS</strong> | Semester {course.semester}
                                    </span>

                                    {isEnrolled ? (
                                      <span className="text-xs font-bold text-primary bg-accent/20 px-4 py-2 rounded-lg border border-accent/30 flex items-center gap-1">
                                        <Check className="h-4 w-4" />
                                        Sudah Terdaftar
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
                                </>
                              )}
                            </div>
                          )
                        })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
