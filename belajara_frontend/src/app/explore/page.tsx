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
import { Card } from "@/components/ui/card"
import {
  Upload, FileText, X, Sparkles, Loader2, CheckCircle2, AlertCircle,
  Check, BookOpen, ChevronDown, ChevronUp, Lock, Lightbulb,
  TrendingUp, Map, Eye, EyeOff, Search, GraduationCap,
} from "lucide-react"
import { api, BASE_URL } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useModal } from "@/context/ModalContext"
import { inferProgramStudiGroup, type ProgramStudiGroupKey, PROGRAM_STUDI_INDONESIA, searchProdi } from "@/lib/indonesia-academic-data"

// ─────────────────────────────────────────────────────────────
//  Types & Interfaces
// ─────────────────────────────────────────────────────────────

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

interface GapItem {
  gap: string
  priority: "high" | "medium" | "low"
  reason: string
  suggested_action?: string
}

interface CareerGapItem {
  gap: string
  target_career: string
  reason: string
}

interface EvidenceItem {
  competency: string
  competency_key: string
  course_name: string
  text_excerpt: string
  confidence: number
}

interface CareerRec {
  title: string
  fit_score: number
  missing_skills: string[]
  why: string
}

interface SemesterPlan {
  term: string
  focus: string
  actions: string[]
}

interface AcademicProfile {
  study_program?: string
  detected_semester?: number | null
  readiness_score?: number
  confidence_score?: number
  summary?: string
  next_best_action?: string
  is_premium_analysis?: boolean

  completed_subjects: string[]

  // AI-provided scores and labels
  competency_scores?: Record<string, number>
  competency_axis_labels?: Record<string, string>

  // Rich evidence with text excerpts
  competency_evidence?: EvidenceItem[]

  // Structured gap map
  gap_map?: {
    mandatory: GapItem[]
    elective: GapItem[]
    career: CareerGapItem[]
  }

  // Legacy flat list (backward compat)
  competency_gaps?: Array<string | GapItem>

  career_recommendations?: string | CareerRec[]
  semester_plan?: SemesterPlan[]
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

// ─────────────────────────────────────────────────────────────
//  Skill Configs — Keyword fallback (used when AI has no scores)
// ─────────────────────────────────────────────────────────────

interface SkillCategory {
  key: string
  label: string
  keywords: string[]
}

const SKILL_CONFIGS: Record<string, SkillCategory[]> = {
  computing: [
    { key: "software_engineering", label: "Software Eng.", keywords: ["pemrograman", "rpl", "perangkat lunak", "web", "pbo", "oop", "object", "algoritma", "struktur data", "coding", "programming"] },
    { key: "data_ai", label: "Data Sci. & AI", keywords: ["data mining", "sains data", "data science", "kecerdasan buatan", "ai", "machine learning", "statistika", "statistik", "data analisis", "analisis data", "visualisasi", "pembelajaran mesin"] },
    { key: "system_architecture", label: "System Arch.", keywords: ["enterprise", "arsitektur", "jaringan", "cloud", "infrastruktur", "sistem enterprise", "tata kelola"] },
    { key: "math_logic", label: "Math & Logic", keywords: ["matematika", "diskrit", "kalkulus", "aljabar", "logika", "teori", "komputasi"] },
    { key: "digital_business", label: "Digital Business", keywords: ["sistem pendukung keputusan", "decision support", "spk", "manajemen", "bisnis", "proyek", "analitik", "informasi"] },
  ],
  engineering: [
    { key: "engineering_math", label: "Eng. Math", keywords: ["matematika", "kalkulus", "fisika", "statistika", "numerik", "mekanika", "termodinamika"] },
    { key: "design_analysis", label: "Design & Analysis", keywords: ["perancangan", "desain", "analisis", "struktur", "sistem", "model", "simulasi"] },
    { key: "materials_process", label: "Materials/Process", keywords: ["material", "proses", "manufaktur", "produksi", "kimia", "metalurgi", "pangan"] },
    { key: "systems_control", label: "Systems & Control", keywords: ["kontrol", "instrumentasi", "otomasi", "robotika", "elektro", "telekomunikasi", "jaringan"] },
    { key: "safety_project", label: "Safety & Project", keywords: ["keselamatan", "lingkungan", "proyek", "manajemen", "etika", "k3", "mutu"] },
  ],
  business: [
    { key: "finance_accounting", label: "Finance & Acct.", keywords: ["keuangan", "akuntansi", "investasi", "pajak", "perpajakan", "anggaran", "biaya"] },
    { key: "marketing", label: "Marketing", keywords: ["pemasaran", "marketing", "promosi", "konsumen", "brand", "riset pasar"] },
    { key: "operations_logistics", label: "Ops & Logistics", keywords: ["operasional", "logistik", "rantai pasok", "supply chain", "produksi", "proses"] },
    { key: "strategy_entrepreneurship", label: "Strategy & Biz", keywords: ["strategi", "bisnis", "kewirausahaan", "pengantar bisnis", "model bisnis", "inovasi"] },
    { key: "hr_organization", label: "Org & People", keywords: ["sdm", "sumber daya manusia", "organisasi", "kepemimpinan", "perilaku organisasi", "komunikasi"] },
  ],
  socialHumanities: [
    { key: "theory_society", label: "Theory & Society", keywords: ["teori", "sosiologi", "politik", "hukum", "sejarah", "filsafat", "masyarakat"] },
    { key: "policy_law", label: "Policy & Law", keywords: ["kebijakan", "hukum", "regulasi", "negara", "publik", "administrasi"] },
    { key: "communication_media", label: "Comm. & Media", keywords: ["komunikasi", "media", "jurnalistik", "penyiaran", "humas", "periklanan", "film"] },
    { key: "research_methods", label: "Research Methods", keywords: ["metode penelitian", "metodologi", "riset", "statistika", "analisis data"] },
    { key: "ethics_culture", label: "Ethics & Culture", keywords: ["etika", "budaya", "antropologi", "psikologi", "kesejahteraan", "kriminologi"] },
  ],
  education: [
    { key: "pedagogy", label: "Pedagogy", keywords: ["pedagogik", "pembelajaran", "kurikulum", "didaktik", "strategi pembelajaran"] },
    { key: "subject_mastery", label: "Subject Mastery", keywords: ["matematika", "fisika", "kimia", "biologi", "bahasa", "sejarah", "ekonomi", "agama"] },
    { key: "assessment", label: "Assessment", keywords: ["evaluasi", "asesmen", "penilaian", "tes", "pengukuran"] },
    { key: "classroom_technology", label: "Classroom Tech", keywords: ["teknologi pendidikan", "media pembelajaran", "digital", "informatika"] },
    { key: "guidance_ethics", label: "Guidance & Ethics", keywords: ["bimbingan", "konseling", "karakter", "etika", "inklusi", "paud", "pgsd"] },
  ],
  science: [
    { key: "math_statistics", label: "Math & Stats", keywords: ["matematika", "statistika", "aktuaria", "kalkulus", "aljabar", "probabilitas"] },
    { key: "lab_experiment", label: "Lab & Experiment", keywords: ["laboratorium", "praktikum", "eksperimen", "kimia", "biologi", "fisika"] },
    { key: "natural_systems", label: "Natural Systems", keywords: ["geologi", "geofisika", "meteorologi", "oseanografi", "astronomi", "lingkungan", "kelautan"] },
    { key: "data_modeling", label: "Data & Modeling", keywords: ["pemodelan", "simulasi", "komputasi", "data", "analisis"] },
    { key: "research_method", label: "Research Method", keywords: ["metode penelitian", "riset", "seminar", "penulisan ilmiah"] },
  ],
  health: [
    { key: "biomedical_core", label: "Biomedical Core", keywords: ["anatomi", "fisiologi", "biokimia", "biomedik", "patologi", "farmakologi"] },
    { key: "clinical_care", label: "Clinical Care", keywords: ["klinik", "keperawatan", "kebidanan", "diagnosis", "terapi", "fisioterapi"] },
    { key: "public_health", label: "Public Health", keywords: ["kesehatan masyarakat", "epidemiologi", "lingkungan", "gizi", "promosi kesehatan"] },
    { key: "health_systems", label: "Health Systems", keywords: ["rumah sakit", "administrasi", "rekam medis", "manajemen kesehatan", "kebijakan"] },
    { key: "ethics_safety", label: "Ethics & Safety", keywords: ["etika", "keselamatan pasien", "komunikasi", "profesionalisme"] },
  ],
  agriculture: [
    { key: "production_cultivation", label: "Cultivation", keywords: ["budidaya", "agroteknologi", "tanaman", "ternak", "perairan", "silvikultur"] },
    { key: "soil_ecosystem", label: "Soil & Ecosystem", keywords: ["tanah", "hama", "penyakit", "ekologi", "hutan", "kelautan", "lingkungan"] },
    { key: "food_postharvest", label: "Food/Postharvest", keywords: ["pangan", "hasil pertanian", "pasca panen", "teknologi pangan", "gizi"] },
    { key: "agribusiness", label: "Agribusiness", keywords: ["agribisnis", "ekonomi", "pemasaran", "manajemen", "penyuluhan"] },
    { key: "research_fieldwork", label: "Research/Field", keywords: ["praktikum", "lapangan", "metode penelitian", "riset", "statistika"] },
  ],
  artsCulture: [
    { key: "creative_practice", label: "Creative Practice", keywords: ["studio", "praktik", "seni", "desain", "kriya", "pertunjukan"] },
    { key: "history_theory", label: "History & Theory", keywords: ["sejarah", "teori", "kritik", "estetika", "budaya"] },
    { key: "language_literacy", label: "Language/Literacy", keywords: ["bahasa", "sastra", "linguistik", "penulisan", "terjemahan"] },
    { key: "production_media", label: "Production Media", keywords: ["produksi", "media", "musik", "film", "teater", "digital"] },
    { key: "portfolio_research", label: "Portfolio/Research", keywords: ["portfolio", "metode penelitian", "riset", "kurasi", "pameran"] },
  ],
  tourism: [
    { key: "hospitality_operations", label: "Hospitality Ops", keywords: ["hotel", "perhotelan", "front office", "housekeeping", "layanan"] },
    { key: "destination_management", label: "Destination Mgmt.", keywords: ["destinasi", "pariwisata", "ekowisata", "perjalanan", "wisata"] },
    { key: "culinary_service", label: "Culinary/Service", keywords: ["tata boga", "kuliner", "restoran", "makanan", "minuman"] },
    { key: "marketing_event", label: "Marketing/Event", keywords: ["pemasaran", "event", "mice", "promosi", "komunikasi"] },
    { key: "sustainability", label: "Sustainability", keywords: ["berkelanjutan", "budaya", "lingkungan", "etika", "kewirausahaan"] },
  ],
  general: [
    { key: "core_foundation", label: "Core Subjects", keywords: ["utama", "pengantar", "dasar", "pokok", "keahlian"] },
    { key: "analysis_research", label: "Analysis & Research", keywords: ["metode penelitian", "metodologi", "riset", "skripsi", "penulisan ilmiah"] },
    { key: "professional_practice", label: "Professional Practice", keywords: ["praktikum", "magang", "lapangan", "proyek", "portofolio"] },
    { key: "digital_data", label: "Digital & Data", keywords: ["kuantitatif", "matematika", "statistika", "statistik", "analisis data"] },
    { key: "communication_ethics", label: "Communication & Ethics", keywords: ["etika", "komunikasi", "kepemimpinan", "karakter", "pancasila", "kewarganegaraan", "agama"] },
  ],
}

// ─────────────────────────────────────────────────────────────
//  Benchmark Data
// ─────────────────────────────────────────────────────────────

// Universal SN-Dikti benchmark (added to all programs as a common reference)
const SNDIKTI_UNIVERSAL: Benchmark = {
  id: "sndikti-universal",
  name: "SN-Dikti — Mata Kuliah Umum Wajib",
  description: "Mata kuliah umum wajib SN-Dikti yang berlaku untuk seluruh program studi di Indonesia, termasuk Pancasila, Agama, dan Bahasa Indonesia.",
  courses: [
    { name: "Pendidikan Pancasila & Kewarganegaraan", category: "communication_ethics" },
    { name: "Pendidikan Agama", category: "communication_ethics" },
    { name: "Bahasa Indonesia Akademik", category: "communication_ethics" },
    { name: "Bahasa Inggris Akademik", category: "communication_ethics" },
    { name: "Metodologi Penelitian & Penulisan Karya Ilmiah", category: "analysis_research" },
    { name: "Pengabdian Masyarakat / KKN", category: "professional_practice" },
  ],
}

const BENCHMARK_TEMPLATES: Record<Exclude<ProgramStudiGroupKey, "general">, BenchmarkCourse[]> = {
  computing: [
    { name: "Algoritma, Pemrograman & Struktur Data", category: "software_engineering" },
    { name: "Basis Data dan Manajemen Informasi", category: "data_ai" },
    { name: "Rekayasa Perangkat Lunak / Sistem Digital", category: "software_engineering" },
    { name: "Jaringan, Infrastruktur atau Arsitektur Sistem", category: "system_architecture" },
    { name: "Matematika, Statistika atau Logika Komputasi", category: "math_logic" },
    { name: "Etika Profesi dan Manajemen Proyek Digital", category: "digital_business" },
  ],
  engineering: [
    { name: "Matematika Teknik dan Sains Dasar", category: "engineering_math" },
    { name: "Gambar/Desain Teknik dan Analisis Sistem", category: "design_analysis" },
    { name: "Proses, Material atau Teknologi Produksi", category: "materials_process" },
    { name: "Sistem Kontrol, Instrumentasi atau Infrastruktur", category: "systems_control" },
    { name: "Keselamatan, Lingkungan dan Etika Profesi", category: "safety_project" },
    { name: "Manajemen Proyek Rekayasa", category: "safety_project" },
  ],
  business: [
    { name: "Akuntansi dan Dasar Keuangan", category: "finance_accounting" },
    { name: "Manajemen dan Strategi Bisnis", category: "strategy_entrepreneurship" },
    { name: "Pemasaran dan Perilaku Konsumen", category: "marketing" },
    { name: "Operasi, Logistik atau Rantai Pasok", category: "operations_logistics" },
    { name: "Organisasi, SDM dan Kepemimpinan", category: "hr_organization" },
    { name: "Metode Kuantitatif Bisnis", category: "finance_accounting" },
  ],
  socialHumanities: [
    { name: "Teori Sosial/Humaniora/Hukum Dasar", category: "theory_society" },
    { name: "Kebijakan, Regulasi atau Administrasi Publik", category: "policy_law" },
    { name: "Komunikasi, Media atau Literasi Publik", category: "communication_media" },
    { name: "Metode Penelitian Sosial", category: "research_methods" },
    { name: "Etika, Budaya dan Perspektif Masyarakat", category: "ethics_culture" },
  ],
  education: [
    { name: "Landasan Pendidikan dan Pedagogik", category: "pedagogy" },
    { name: "Penguasaan Materi Bidang Studi", category: "subject_mastery" },
    { name: "Perencanaan, Kurikulum dan Strategi Pembelajaran", category: "pedagogy" },
    { name: "Evaluasi/Asesmen Pembelajaran", category: "assessment" },
    { name: "Teknologi dan Media Pembelajaran", category: "classroom_technology" },
    { name: "Bimbingan, Etika dan Pengembangan Peserta Didik", category: "guidance_ethics" },
  ],
  science: [
    { name: "Matematika, Statistika dan Analisis Kuantitatif", category: "math_statistics" },
    { name: "Praktikum Laboratorium dan Eksperimen", category: "lab_experiment" },
    { name: "Konsep Sistem Alam sesuai Bidang Studi", category: "natural_systems" },
    { name: "Pemodelan, Simulasi atau Analisis Data", category: "data_modeling" },
    { name: "Metode Penelitian dan Penulisan Ilmiah", category: "research_method" },
  ],
  health: [
    { name: "Ilmu Biomedik dan Dasar Kesehatan", category: "biomedical_core" },
    { name: "Keterampilan Klinis/Asuhan sesuai Profesi", category: "clinical_care" },
    { name: "Kesehatan Masyarakat dan Epidemiologi", category: "public_health" },
    { name: "Sistem Layanan Kesehatan dan Administrasi", category: "health_systems" },
    { name: "Etika Profesi dan Keselamatan Pasien", category: "ethics_safety" },
  ],
  agriculture: [
    { name: "Budidaya/Produksi sesuai Komoditas", category: "production_cultivation" },
    { name: "Tanah, Ekosistem dan Pengelolaan Sumber Daya", category: "soil_ecosystem" },
    { name: "Teknologi Hasil, Pangan atau Pascapanen", category: "food_postharvest" },
    { name: "Agribisnis, Penyuluhan dan Ekonomi Sumber Daya", category: "agribusiness" },
    { name: "Praktikum Lapangan dan Metode Penelitian", category: "research_fieldwork" },
  ],
  artsCulture: [
    { name: "Praktik Studio/Pertunjukan sesuai Bidang", category: "creative_practice" },
    { name: "Sejarah, Teori dan Kritik Seni/Budaya", category: "history_theory" },
    { name: "Bahasa, Literasi atau Kajian Teks", category: "language_literacy" },
    { name: "Produksi Media/Karya dan Dokumentasi", category: "production_media" },
    { name: "Portofolio, Riset dan Presentasi Karya", category: "portfolio_research" },
  ],
  tourism: [
    { name: "Operasi Layanan Hotel/Pariwisata", category: "hospitality_operations" },
    { name: "Manajemen Destinasi dan Perjalanan", category: "destination_management" },
    { name: "Kuliner, Tata Boga atau Layanan Tamu", category: "culinary_service" },
    { name: "Pemasaran Pariwisata dan Event", category: "marketing_event" },
    { name: "Pariwisata Berkelanjutan, Budaya dan Etika", category: "sustainability" },
  ],
}

// ─────────────────────────────────────────────────────────────
//  Utility Functions
// ─────────────────────────────────────────────────────────────

const slugifyBenchmarkId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "umum"

const buildProgramBenchmarks = (
  prodi: string,
  groupKey: ProgramStudiGroupKey,
  groupLabel: string
): Benchmark[] => {
  const slug = slugifyBenchmarkId(prodi)

  if (groupKey === "general") {
    // For unrecognized prodi, return a general SN-Dikti benchmark
    return [
      {
        id: `sndikti-${slug}`,
        name: `SN-Dikti (${prodi})`,
        description: `Standar nasional capaian pembelajaran minimum untuk program studi ${prodi}.`,
        courses: SNDIKTI_UNIVERSAL.courses,
      },
      SNDIKTI_UNIVERSAL,
    ]
  }

  const template = BENCHMARK_TEMPLATES[groupKey]

  return [
    {
      id: `sndikti-${slug}`,
      name: `SN-Dikti (${prodi})`,
      description: `Standar nasional capaian pembelajaran untuk program studi ${prodi} — rumpun ${groupLabel} sesuai Permendikbud No. 3 Tahun 2020.`,
      courses: template,
    },
    {
      id: `kkni-${slug}`,
      name: `KKNI Level 6 — ${groupLabel}`,
      description: `Kerangka Kualifikasi Nasional Indonesia Level 6 (Sarjana) untuk rumpun ${groupLabel}. Mencakup kompetensi inti dan kompetensi pendukung.`,
      courses: [
        ...template.slice(0, 4),
        { name: "Metodologi Penelitian dan Proyek Akhir", category: template[template.length - 1]?.category || "analysis_research" },
        { name: "Etika Profesi, Komunikasi Akademik & Soft Skills", category: template[0]?.category || "communication_ethics" },
      ],
    },
    // Universal SN-Dikti always available as additional reference
    SNDIKTI_UNIVERSAL,
  ]
}

const isSubjectCompleted = (benchmarkName: string, completedList: string[]) => {
  const cleanBenchmark = benchmarkName.toLowerCase()
  const benchmarkTokens = cleanBenchmark
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 3 && !["atau", "yang", "dan", "dengan", "sesuai", "dasar", "mata", "kuliah"].includes(token))

  return completedList.some(comp => {
    const cleanComp = comp.toLowerCase()
    if (cleanComp.includes(cleanBenchmark) || cleanBenchmark.includes(cleanComp)) return true
    const compTokens = cleanComp.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(token => token.length > 3)
    const overlap = benchmarkTokens.filter(token => compTokens.some(ct => ct.includes(token) || token.includes(ct))).length
    if (overlap >= Math.min(2, benchmarkTokens.length)) return true
    if (cleanBenchmark.includes("algoritma") && cleanComp.includes("algoritma")) return true
    if (cleanBenchmark.includes("basis data") && cleanComp.includes("basis data")) return true
    if (cleanBenchmark.includes("pemrograman") && cleanComp.includes("pemrograman")) return true
    if (cleanBenchmark.includes("rekayasa perangkat lunak") && (cleanComp.includes("rpl") || cleanComp.includes("perangkat lunak"))) return true
    if (cleanBenchmark.includes("statistika") && cleanComp.includes("statistik")) return true
    return false
  })
}

const clampPercent = (value: unknown, fallback = 50) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

const getCareerPaths = (careerRecommendations: AcademicProfile["career_recommendations"], prodi: string): CareerRec[] => {
  if (Array.isArray(careerRecommendations)) return careerRecommendations
  if (typeof careerRecommendations === "string" && careerRecommendations.trim()) {
    return careerRecommendations
      .split(/[,;]/)
      .map(item => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        title,
        fit_score: Math.max(60, 82 - index * 7),
        missing_skills: [],
        why: `Jalur ini terdeteksi relevan dengan profil akademik ${prodi}.`,
      }))
  }
  return []
}

const getPriorityStyle = (priority: string) => {
  if (priority === "high") return "bg-destructive/10 text-destructive border-destructive/20"
  if (priority === "low") return "bg-emerald-50 text-emerald-700 border-emerald-100"
  return "bg-amber-50 text-amber-700 border-amber-100"
}

const getPriorityDot = (priority: string) => {
  if (priority === "high") return "bg-destructive"
  if (priority === "low") return "bg-emerald-500"
  return "bg-amber-400"
}

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
          className="w-full bg-[#FAF9FB] border border-border rounded-lg pl-8 pr-8 py-2 text-xs font-semibold text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#060708]/10 focus:border-[#C6B5BF] transition disabled:opacity-50"
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
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
        >
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-slate-50 transition-colors border-b border-border/40 last:border-0 cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [loadingStep, setLoadingStep] = React.useState("Mengunggah file...")
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([])
  const [academicProfile, setAcademicProfile] = React.useState<AcademicProfile | null>(null)
  const [activeCourseCodes, setActiveCourseCodes] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const [expandedRecs, setExpandedRecs] = React.useState<Record<string, boolean>>({})
  const [hoveredCourse, setHoveredCourse] = React.useState<Course | null>(null)
  const [viewMode, setViewMode] = React.useState<"cards" | "timeline">("cards")
  const [selectedCareerIndex, setSelectedCareerIndex] = React.useState(0)
  const [showEvidenceDrawer, setShowEvidenceDrawer] = React.useState(false)
  const [activeGapTab, setActiveGapTab] = React.useState<"mandatory" | "elective" | "career">("mandatory")

  const { user: currentUser } = useAuth()
  const { showAlert } = useModal()
  const [selectedBenchmarkId, setSelectedBenchmarkId] = React.useState("")

  const isPremium = (currentUser as { is_premium?: boolean } | null)?.is_premium === true

  const [userProdi, setUserProdi] = React.useState<string>("Sistem Informasi")

  React.useEffect(() => {
    const profileProdi = (currentUser as { mahasiswa_profile?: { jurusan?: string }; jurusan?: string } | null)?.mahasiswa_profile?.jurusan
      || (currentUser as { mahasiswa_profile?: { jurusan?: string }; jurusan?: string } | null)?.jurusan
    if (profileProdi) {
      setUserProdi(profileProdi)
    }
  }, [currentUser])

  React.useEffect(() => {
    if (academicProfile?.study_program) {
      setUserProdi(academicProfile.study_program)
    }
  }, [academicProfile])

  const programGroup = React.useMemo(() => inferProgramStudiGroup(userProdi), [userProdi])

  // ── Skill Categories for radar chart (from AI labels if available) ──
  const fallbackSkillCategories = SKILL_CONFIGS[programGroup.key] || SKILL_CONFIGS["general"]

  const skillCategories = React.useMemo(() => {
    const aiLabels = academicProfile?.competency_axis_labels
    const aiScores = academicProfile?.competency_scores
    if (aiLabels && aiScores && Object.keys(aiLabels).length >= 5) {
      return Object.entries(aiLabels).slice(0, 5).map(([key, label]) => ({
        key,
        label: label as string,
        keywords: [], // Not needed if AI provides scores directly
      }))
    }
    return fallbackSkillCategories
  }, [academicProfile, fallbackSkillCategories])

  // ── Benchmarks — fully dynamic based on inferProgramStudiGroup ──
  // No hardcoded IT-specific benchmarks. All prodi are handled uniformly.
  const matchedBenchmarks = React.useMemo(() => {
    return buildProgramBenchmarks(userProdi, programGroup.key, programGroup.label)
  }, [programGroup.key, programGroup.label, userProdi])

  const benchmarkGroups = React.useMemo(() => {
    // Group by a friendly label
    const groupLabel = programGroup.key === "general" ? "Standar Nasional" : programGroup.label
    return { [groupLabel]: matchedBenchmarks }
  }, [matchedBenchmarks, programGroup])

  React.useEffect(() => {
    if (matchedBenchmarks && matchedBenchmarks.length > 0) {
      setSelectedBenchmarkId(matchedBenchmarks[0].id)
    }
  }, [matchedBenchmarks])

  const toggleRecExpand = (courseCode: string) => {
    setExpandedRecs(prev => ({ ...prev, [courseCode]: !prev[courseCode] }))
  }

  // ── Skill / Radar Chart Data ──
  const getSkillData = (additionalSubject?: string) => {
    const skills: Record<string, number> = {}

    // Priority 1: Use AI-provided competency_scores directly
    if (academicProfile?.competency_scores && !additionalSubject) {
      skillCategories.forEach(cat => {
        skills[cat.key] = clampPercent(academicProfile.competency_scores![cat.key], 20)
      })
      // If we have AI scores, return them immediately — no keyword fallback
      if (Object.values(skills).some(v => v > 20)) return skills
    }

    // Priority 2: Keyword-based inference (fallback)
    skillCategories.forEach(cat => {
      skills[cat.key] = 20
    })

    const completed = academicProfile?.completed_subjects || []
    const subjects = additionalSubject ? [...completed, additionalSubject] : completed

    if (subjects.length === 0) return skills

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
  const skillList = skillCategories.map(cat => ({ label: cat.label, value: skillValues[cat.key] ?? 20 }))

  const projectedValues = hoveredCourse ? getSkillData(hoveredCourse.title) : null
  const projectedList = projectedValues
    ? skillCategories.map(cat => ({ label: cat.label, value: projectedValues[cat.key] }))
    : []

  // ── SVG Radar Chart Geometry ──
  const cx = 125
  const cy = 115
  const r = 65

  const getCoordinates = (index: number, val: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2
    return { x: cx + r * (val / 100) * Math.cos(angle), y: cy + r * (val / 100) * Math.sin(angle) }
  }

  const pointsStr = skillList.map((s, idx) => { const c = getCoordinates(idx, s.value); return `${c.x},${c.y}` }).join(" ")
  const projectedPointsStr = projectedList.map((s, idx) => { const c = getCoordinates(idx, s.value); return `${c.x},${c.y}` }).join(" ")
  const gridLevels = [20, 40, 60, 80, 100]
  const getGridPath = (level: number) =>
    Array.from({ length: 5 }).map((_, idx) => { const c = getCoordinates(idx, level); return `${idx === 0 ? "M" : "L"} ${c.x} ${c.y}` }).join(" ") + " Z"
  const getLabelCoordinates = (index: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2
    const labelOffset = index === 0 ? 15 : 18
    return { x: cx + (r + labelOffset) * Math.cos(angle), y: cy + (r + 12) * Math.sin(angle) }
  }

  // ── Derived state ──
  const activeBenchmark = matchedBenchmarks.find(b => b.id === selectedBenchmarkId) || matchedBenchmarks[0]
  const readinessScore = clampPercent(academicProfile?.readiness_score, academicProfile ? 58 : 0)
  const confidenceScore = clampPercent(academicProfile?.confidence_score, academicProfile ? 70 : 0)
  const careerPaths = getCareerPaths(academicProfile?.career_recommendations || "", userProdi)
  const selectedCareer = careerPaths[selectedCareerIndex] || careerPaths[0]
  const evidenceItems: EvidenceItem[] = (academicProfile?.competency_evidence || []) as EvidenceItem[]
  const semesterPlan = academicProfile?.semester_plan || []
  const gapMap = academicProfile?.gap_map || { mandatory: [], elective: [], career: [] }
  const nextBestAction = academicProfile?.next_best_action || ""
  const isPremiumAnalysis = academicProfile?.is_premium_analysis !== false

  React.useEffect(() => {
    setSelectedCareerIndex(0)
  }, [academicProfile])

  const benchmarkStats = React.useMemo(() => {
    if (!activeBenchmark) return null
    const completedSubjects = academicProfile?.completed_subjects || []
    let matchedCount = 0
    const details = activeBenchmark.courses.map(course => {
      const completed = isSubjectCompleted(course.name, completedSubjects)
      if (completed) matchedCount++
      return { name: course.name, completed }
    })
    const percentage = activeBenchmark.courses.length > 0
      ? Math.round((matchedCount / activeBenchmark.courses.length) * 100) : 0
    return { percentage, matchedCount, totalCount: activeBenchmark.courses.length, details }
  }, [activeBenchmark, academicProfile])

  // ── Loading steps ──
  React.useEffect(() => {
    if (!loading) return
    const steps = [
      "Mengekstrak teks dokumen akademik...",
      "Menganalisis kompetensi dan topik studi dengan AI...",
      "Menghitung skor kompetensi per dimensi prodi...",
      "Membangun peta gap: mandatory, elective, career...",
      "Mencocokkan dokumen dengan katalog mata kuliah...",
      "Menyusun semester planner dan career path...",
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
    if (!currentUser) return
    if ((currentUser as { is_instructor?: boolean } | null)?.is_instructor) return
    fetch(`${BASE_URL}/dashboard/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(res => { if (res.ok) return res.json(); throw new Error() })
      .then((data: StudentDashboardData) => {
        if (data?.active_courses) setActiveCourseCodes(data.active_courses.map(c => c.code))
      })
      .catch(() => {})
  }

  React.useEffect(() => {
    fetchActiveCourses()
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current) }
  }, [currentUser])

  const checkFileSupport = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    return ext === ".pdf" || ext === ".xlsx" || ext === ".xls"
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const f = files[0]
      if (checkFileSupport(f)) { setFile(f); setError(null) }
      else setError("Hanya dokumen PDF atau Excel yang diperbolehkan.")
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const f = files[0]
      if (checkFileSupport(f)) { setFile(f); setError(null) }
      else setError("Hanya dokumen PDF atau Excel yang diperbolehkan.")
    }
  }
  const removeFile = () => {
    setFile(null); setRecommendations([]); setAcademicProfile(null); setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAnalyze = () => {
    if (!file) return
    setLoading(true); setError(null); setRecommendations([]); setAcademicProfile(null)
    if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }

    api.explore.analyze(file, userProdi)
      .then((data: { curriculum_id?: string }) => {
        const curriculumId = data.curriculum_id
        if (!curriculumId) throw new Error("Gagal mendapatkan ID kurikulum dari server.")
        pollingIntervalRef.current = setInterval(() => {
          api.explore.checkStatus(Number(curriculumId))
            .then((statusData: { status: string; recommendations?: Recommendation[]; academic_profile?: AcademicProfile; detail?: string }) => {
              if (statusData.status === "success") {
                const recs = statusData.recommendations || []
                setRecommendations(recs)
                if (recs.length > 0) setExpandedRecs({ [recs[0].course.code]: true })
                setAcademicProfile(statusData.academic_profile || null)
                setLoading(false)
                fetchActiveCourses()
                if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
              } else if (statusData.status !== "processing") {
                throw new Error(statusData.detail || "Terjadi kesalahan saat memproses kurikulum.")
              }
            })
            .catch((err: { message?: string }) => {
              setError(err.message || "Gagal memeriksa status rekomendasi.")
              setLoading(false)
              if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null }
            })
        }, 2000)
      })
      .catch((err: { message?: string }) => {
        setError(err.message || "Gagal mengunggah file kurikulum.")
        setLoading(false)
      })
  }

  const handleEnroll = (courseCode: string) => {
    if (!currentUser) { router.push(`/login?redirect=explore`); return }
    api.courses.enroll(courseCode)
      .then(() => { fetchActiveCourses(); router.push(`/courses/${courseCode}`) })
      .catch((err: any) => { showAlert("Gagal Mendaftar", err.message || "Terjadi kesalahan saat mendaftar kelas.") })
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────

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

        <div className="flex flex-1 flex-col gap-6 p-6 bg-background print:hidden">
          {/* Header */}
          <div className="flex flex-col gap-1 explore-page-header">
            <h1 className="text-3xl font-heading font-bold text-primary">
              Rekomendasi Rencana Studi Berbasis AI
            </h1>
            <p className="text-sm text-muted-foreground">
              Unggah transkrip, silabus, atau dokumen kurikulum untuk mendapatkan analisis akademik personal yang mendalam dari AI.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ─── Left Column ─────────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">
              {/* Target Prodi Card */}
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl !overflow-visible">
                <h3 className="font-heading text-base font-bold text-primary mb-2">
                  Program Studi Target
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Pilih program studi target untuk memuat peta kompetensi default dan standar kurikulum benchmarking.
                </p>
                <div>
                  <AutocompleteInput
                    id="targetProdi"
                    name="targetProdi"
                    placeholder="Cari program studi target..."
                    value={userProdi}
                    onChange={(val) => setUserProdi(val)}
                    searchFn={searchProdi}
                  />
                </div>
              </Card>

              {/* Upload Card */}
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
                    dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent bg-background"
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.xlsx,.xls" className="hidden" />
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-semibold text-primary mb-1">Tarik &amp; lepas dokumen Anda di sini</p>
                  <p className="text-xs text-muted-foreground">atau klik untuk mencari dokumen (PDF / Excel)</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {file && (
                  <div className="mt-4 p-4 border rounded-lg bg-background flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-8 w-8 text-accent shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-primary truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeFile} className="text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer" disabled={loading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {file && !loading && (
                  <Button
                    onClick={handleAnalyze}
                    className="w-full mt-4 bg-destructive hover:bg-destructive/90 text-white cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    Mulai Analisis Dokumen
                  </Button>
                )}

                {!isPremium && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2 text-xs text-amber-800">
                    <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span><strong>Akun Free:</strong> Gratis 1x/bulan. Gap Map, AI Evidence, Career Path Lens, dan Semester Planner lengkap hanya untuk Scholar/Pro.</span>
                  </div>
                )}
              </Card>

              {/* ── Radar Chart Card ── */}
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl flex flex-col items-center select-none">
                <div className="w-full border-b border-border pb-3 mb-4 text-left">
                  <h3 className="font-heading text-base font-bold text-primary">Peta Kompetensi</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {!academicProfile
                      ? `Visualisasi kompetensi ${userProdi} (unggah dokumen untuk memperbarui)`
                      : academicProfile.competency_scores && Object.keys(academicProfile.competency_scores).length > 0
                        ? "Skor kompetensi langsung dari analisis AI"
                        : "Estimasi berbasis kata kunci mata kuliah"}
                  </p>
                </div>

                <div className="relative w-full flex justify-center items-center">
                  <svg width="250" height="230" className="overflow-visible">
                    {gridLevels.map(lvl => (
                      <path key={lvl} d={getGridPath(lvl)} fill="none" stroke="#FAF9FB" strokeWidth="1.5" className="stroke-slate-100" />
                    ))}
                    <path d={getGridPath(100)} fill="none" stroke="#E8E5E9" strokeWidth="1" />
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const outer = getCoordinates(idx, 100)
                      return <line key={idx} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#E8E5E9" strokeWidth="1" strokeDasharray="2" />
                    })}
                    <polygon points={pointsStr} fill="rgba(207, 58, 31, 0.15)" stroke="#CF3A1F" strokeWidth="2" className="transition-all duration-500 ease-in-out" />
                    {projectedValues && (
                      <polygon points={projectedPointsStr} fill="rgba(198, 181, 191, 0.15)" stroke="#C6B5BF" strokeWidth="1.5" strokeDasharray="3,3" className="transition-all duration-300 ease-in-out" />
                    )}
                    {skillList.map((s, idx) => {
                      const coords = getCoordinates(idx, s.value)
                      return <circle key={idx} cx={coords.x} cy={coords.y} r="3.5" fill="#CF3A1F" stroke="#ffffff" strokeWidth="1" className="transition-all duration-500 ease-in-out" />
                    })}
                    {skillList.map((s, idx) => {
                      const coords = getLabelCoordinates(idx)
                      const anchors: ("middle" | "start" | "end")[] = ["middle", "start", "start", "end", "end"]
                      const textAnchor = anchors[idx] || "middle"
                      return (
                        <g key={idx}>
                          <text x={coords.x} y={coords.y} textAnchor={textAnchor} className="text-[9px] font-black fill-slate-700 uppercase tracking-wider">{s.label}</text>
                          <text x={coords.x} y={coords.y + 9} textAnchor={textAnchor} className="text-[9px] font-mono font-bold fill-[#CF3A1F]">{s.value}%</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Readiness Breakdown mini bars */}
                {academicProfile && (
                  <div className="w-full mt-4 space-y-1.5 border-t border-border pt-3">
                    {skillList.map(s => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground w-20 shrink-0 truncate">{s.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-destructive rounded-full transition-all duration-700" style={{ width: `${s.value}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-primary w-6 text-right">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── Benchmarking Card ── */}
              <Card className="border border-border shadow-sm bg-white p-6 rounded-xl flex flex-col select-none">
                <div className="w-full border-b border-border pb-3 mb-4 text-left">
                  <h3 className="font-heading text-base font-bold text-primary">Benchmarking Kurikulum</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Keselarasan studi Anda vs. standar <strong>{userProdi}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pilih Standar Benchmark</label>
                    <select
                      value={selectedBenchmarkId}
                      onChange={e => setSelectedBenchmarkId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF9FB] border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-[#C6B5BF] cursor-pointer"
                    >
                      {Object.entries(benchmarkGroups).map(([category, list]) => (
                        <optgroup key={category} label={category}>
                          {list.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {activeBenchmark && (
                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">{activeBenchmark.description}</p>
                  )}

                  {!academicProfile ? (
                    <div className="p-4 border border-dashed rounded-lg bg-background text-center">
                      <p className="text-xs text-muted-foreground">Unggah dokumen untuk melihat tingkat keselarasan kurikulum.</p>
                    </div>
                  ) : benchmarkStats && (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 bg-[#FAF9FB] rounded-xl border border-border flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Keselarasan Kurikulum</p>
                          <p className="text-2xl font-bold font-heading text-primary mt-0.5">{benchmarkStats.percentage}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Terpenuhi</p>
                          <p className="text-xs font-bold text-[#CF3A1F] mt-1">{benchmarkStats.matchedCount} / {benchmarkStats.totalCount}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Modul Standar</p>
                        <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1.5">
                          {benchmarkStats.details.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs bg-white">
                              <span className="font-medium text-slate-700">{item.name}</span>
                              {item.completed
                                ? <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 shrink-0"><Check className="h-2.5 w-2.5" /> Terpenuhi</span>
                                : <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">Belum</span>
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ─── Right Column ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {loading && (
                <Card className="border border-border shadow-sm bg-white p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] rounded-xl">
                  <Loader2 className="h-12 w-12 text-accent animate-spin" />
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-primary">Sedang Menganalisis Dokumen</h3>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">{loadingStep}</p>
                  </div>
                </Card>
              )}

              {!loading && !academicProfile && recommendations.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-xl bg-white min-h-[400px]">
                  <Sparkles className="h-12 w-12 text-accent/50 mb-4" />
                  <h3 className="font-heading text-xl font-bold text-primary">Hasil Analisis Akademik AI</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Unggah transkrip nilai, silabus, atau proposal rencana studi untuk mendapatkan analisis kompetensi personal yang mendalam.
                  </p>
                </div>
              )}

              {!loading && (academicProfile || recommendations.length > 0) && (
                <div className="space-y-6">

                  {/* ── Next Best Action Banner ── */}
                  {nextBestAction && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive text-white shadow-sm">
                      <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-0.5">Next Best Action</p>
                        <p className="text-sm font-semibold leading-relaxed">{nextBestAction}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Academic Profile Analysis Card ── */}
                  {academicProfile && (
                    <Card className="border border-border shadow-sm bg-white p-6 rounded-xl space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary text-primary">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="font-heading text-xl font-bold text-primary">Analisis Profil Akademik</h2>
                            <p className="text-xs text-muted-foreground">
                              {isPremiumAnalysis ? "Analisis lengkap premium • Berbasis AI Gemini" : "Analisis ringkasan gratis • Upgrade untuk akses penuh"}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => window.print()}
                          variant="outline"
                          className="text-xs font-semibold px-4 py-2 border border-border hover:bg-[#FAF9FB] cursor-pointer print:hidden flex items-center gap-1.5"
                          disabled={!isPremiumAnalysis}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {isPremiumAnalysis ? "Cetak Laporan (PDF)" : <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Premium Only</span>}
                        </Button>
                      </div>

                      {/* KPI Row */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-[#FAF9FB] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Academic Readiness</p>
                          <div className="mt-2 flex items-end gap-2">
                            <span className="font-heading text-4xl font-bold text-primary">{readinessScore}</span>
                            <span className="pb-1 text-xs font-bold text-muted-foreground">/100</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-white border border-border overflow-hidden">
                            <div className="h-full bg-destructive transition-all duration-700" style={{ width: `${readinessScore}%` }} />
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-white p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confidence AI</p>
                          <p className="mt-2 font-heading text-3xl font-bold text-primary">{confidenceScore}%</p>
                          <p className="mt-2 text-xs text-muted-foreground">Berdasarkan kelengkapan dokumen dan bukti kompetensi.</p>
                        </div>
                        <div className="rounded-xl border border-border bg-white p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Profil Terdeteksi</p>
                          <p className="mt-2 text-sm font-bold text-primary">{academicProfile.study_program || userProdi}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {academicProfile.detected_semester ? `Perkiraan semester ${academicProfile.detected_semester}` : "Semester tidak terdeteksi"}
                          </p>
                        </div>
                      </div>

                      {/* Summary */}
                      {academicProfile.summary && (
                        <div className="rounded-xl border border-border bg-[#FAF9FB] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Ringkasan AI</p>
                          <p className="text-sm leading-relaxed text-primary">{academicProfile.summary}</p>
                        </div>
                      )}

                      {/* Completed subjects */}
                      {academicProfile.completed_subjects && academicProfile.completed_subjects.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            Kompetensi / Mata Kuliah Terdeteksi ({academicProfile.completed_subjects.length} item)
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {academicProfile.completed_subjects.map((sub, i) => (
                              <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/50 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Gap Map ── */}
                      <div className="border-t border-border pt-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Map className="h-4 w-4 text-primary shrink-0" />
                            Curriculum Gap Map
                          </h3>
                          <div className="flex bg-[#FAF9FB] border border-border p-0.5 rounded-lg text-[10px] font-bold">
                            {(["mandatory", "elective", "career"] as const).map(tab => {
                              const count = tab === "mandatory" ? gapMap.mandatory.length : tab === "elective" ? gapMap.elective.length : gapMap.career.length
                              const locked = !isPremiumAnalysis && tab !== "mandatory"
                              return (
                                <button
                                  key={tab}
                                  onClick={() => !locked && setActiveGapTab(tab)}
                                  disabled={locked}
                                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-all capitalize flex items-center gap-1 ${
                                    activeGapTab === tab ? "bg-white text-primary shadow-xs" : locked ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-primary"
                                  }`}
                                >
                                  {locked && <Lock className="h-2.5 w-2.5" />}
                                  {tab} {count > 0 && <span className={`ml-0.5 rounded-full px-1 ${tab === "mandatory" ? "bg-destructive/20 text-destructive" : tab === "elective" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{count}</span>}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {!isPremiumAnalysis && activeGapTab !== "mandatory" ? (
                          <div className="relative p-6 rounded-xl border border-border bg-[#FAF9FB] text-center">
                            <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-primary">Tersedia di Scholar & Pro</p>
                            <p className="text-xs text-muted-foreground mt-1">Upgrade untuk melihat gap elective dan gap karier yang dipersonalisasi.</p>
                            <Button className="mt-4 bg-destructive hover:bg-destructive/90 text-white text-xs px-4 py-2 cursor-pointer" onClick={() => router.push("/pricing")}>
                              Upgrade Sekarang
                            </Button>
                          </div>
                        ) : activeGapTab === "mandatory" ? (
                          <div className="space-y-2">
                            {gapMap.mandatory.length > 0 ? gapMap.mandatory.map((gap, i) => (
                              <div key={i} className={`rounded-lg border p-3 text-xs ${getPriorityStyle(gap.priority)}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${getPriorityDot(gap.priority)}`} />
                                    <span className="font-bold text-primary">{gap.gap}</span>
                                  </div>
                                  <span className="uppercase text-[9px] font-black opacity-70">{gap.priority}</span>
                                </div>
                                <p className="mt-1.5 text-slate-600 leading-relaxed">{gap.reason}</p>
                                {gap.suggested_action && (
                                  <p className="mt-1 font-semibold text-primary flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 shrink-0" /> {gap.suggested_action}
                                  </p>
                                )}
                              </div>
                            )) : <p className="text-xs text-muted-foreground italic">Tidak ada gap wajib terdeteksi dari dokumen Anda.</p>}
                          </div>
                        ) : activeGapTab === "elective" ? (
                          <div className="space-y-2">
                            {gapMap.elective.length > 0 ? gapMap.elective.map((gap, i) => (
                              <div key={i} className={`rounded-lg border p-3 text-xs ${getPriorityStyle(gap.priority)}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-primary">{gap.gap}</span>
                                  <span className="uppercase text-[9px] font-black opacity-70">{gap.priority}</span>
                                </div>
                                <p className="mt-1.5 text-slate-600 leading-relaxed">{gap.reason}</p>
                                {gap.suggested_action && <p className="mt-1 font-semibold text-primary">{gap.suggested_action}</p>}
                              </div>
                            )) : <p className="text-xs text-muted-foreground italic">Tidak ada gap elektif terdeteksi.</p>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {gapMap.career.length > 0 ? gapMap.career.map((gap, i) => (
                              <div key={i} className="rounded-lg border border-blue-100 p-3 text-xs bg-blue-50">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-bold text-primary">{gap.gap}</span>
                                  {gap.target_career && (
                                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 shrink-0">{gap.target_career}</span>
                                  )}
                                </div>
                                <p className="mt-1.5 text-slate-600 leading-relaxed">{gap.reason}</p>
                              </div>
                            )) : <p className="text-xs text-muted-foreground italic">Tidak ada gap karier terdeteksi.</p>}
                          </div>
                        )}
                      </div>

                      {/* ── AI Evidence Drawer ── */}
                      {evidenceItems.length > 0 && (
                        <div className="border-t border-border pt-5">
                          <button
                            onClick={() => setShowEvidenceDrawer(v => !v)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-[#FAF9FB] hover:bg-white transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {isPremiumAnalysis ? <Eye className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-xs font-bold text-primary">
                                AI Evidence Drawer
                              </span>
                              <span className="text-[10px] text-muted-foreground">({evidenceItems.length} bukti dari dokumen)</span>
                            </div>
                            {showEvidenceDrawer ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </button>

                          {showEvidenceDrawer && (
                            <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                              {!isPremiumAnalysis && (
                                <div className="p-4 rounded-xl border border-border bg-amber-50 text-center">
                                  <Lock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                  <p className="text-xs font-semibold text-amber-800">AI Evidence Drawer — Scholar & Pro</p>
                                  <p className="text-[11px] text-amber-700 mt-1">Lihat kutipan langsung dari dokumen yang mendukung setiap skor kompetensi.</p>
                                  <Button className="mt-3 bg-destructive text-white text-xs px-3 py-1.5 cursor-pointer" onClick={() => router.push("/pricing")}>Upgrade</Button>
                                </div>
                              )}
                              {isPremiumAnalysis && evidenceItems.map((item, i) => (
                                <div key={i} className="rounded-xl border border-border bg-white p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold text-primary">{item.competency}</p>
                                      {item.course_name && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Dari: <span className="font-semibold">{item.course_name}</span></p>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 shrink-0">
                                      {clampPercent(item.confidence)}% yakin
                                    </span>
                                  </div>
                                  {item.text_excerpt && (
                                    <blockquote className="border-l-2 border-[#C6B5BF] pl-3 text-xs text-muted-foreground italic leading-relaxed">
                                      "{item.text_excerpt}"
                                    </blockquote>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Career Path Lens ── */}
                      {careerPaths.length > 0 && (
                        <div className="border-t border-border pt-5 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Career Path Lens</h3>
                            <div className="flex flex-wrap gap-2">
                              {careerPaths.map((career, index) => (
                                <button
                                  key={career.title}
                                  onClick={() => setSelectedCareerIndex(index)}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                                    selectedCareerIndex === index
                                      ? "border-destructive bg-destructive text-white"
                                      : "border-border bg-white text-primary hover:bg-[#FAF9FB]"
                                  }`}
                                >
                                  {career.title}
                                </button>
                              ))}
                            </div>
                          </div>
                          {selectedCareer && (
                            <div className="rounded-xl border border-border bg-[#FAF9FB] p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-heading text-lg font-bold text-primary">{selectedCareer.title}</p>
                                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{selectedCareer.why}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Fit Score</p>
                                  <p className="font-heading text-2xl font-bold text-destructive">{clampPercent(selectedCareer.fit_score)}%</p>
                                </div>
                              </div>
                              {selectedCareer.missing_skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {selectedCareer.missing_skills.map((skill, i) => (
                                    <span key={i} className="rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold text-primary">{skill}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Semester Planner ── */}
                      {semesterPlan.length > 0 ? (
                        <div className="border-t border-border pt-5 space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Semester Planner</h3>
                          <div className="grid gap-3 md:grid-cols-2">
                            {semesterPlan.map((plan, index) => (
                              <div key={index} className="rounded-xl border border-border bg-white p-4">
                                <p className="text-xs font-black uppercase tracking-wider text-destructive">{plan.term}</p>
                                <p className="mt-1 font-heading text-base font-bold text-primary">{plan.focus}</p>
                                <ul className="mt-2 space-y-1">
                                  {plan.actions.map((action, ai) => (
                                    <li key={ai} className="flex gap-2 text-xs text-slate-700">
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : !isPremiumAnalysis && (
                        <div className="border-t border-border pt-5">
                          <div className="relative p-5 rounded-xl border border-dashed border-border bg-[#FAF9FB] text-center">
                            <Lock className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-primary">Semester Planner</p>
                            <p className="text-xs text-muted-foreground mt-1">Rekomendasi aksi per semester berdasarkan gap prioritas Anda — tersedia untuk Scholar & Pro.</p>
                            <Button className="mt-3 bg-destructive hover:bg-destructive/90 text-white text-xs px-4 py-2 cursor-pointer" onClick={() => router.push("/pricing")}>
                              Upgrade ke Scholar
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* ── Belajara Course Recommendations ── */}
                  {recommendations.length > 0 && (
                    <div className="space-y-6 pt-2">
                      <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                        <h2 className="font-heading text-xl font-bold text-primary flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-destructive" />
                          Rekomendasi Kelas Belajara
                          {!isPremiumAnalysis && (
                            <span className="text-xs font-normal text-muted-foreground bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Max 3 • Free</span>
                          )}
                        </h2>
                        <div className="flex bg-[#FAF9FB] border border-border p-1 rounded-lg text-xs font-semibold select-none">
                          <button
                            onClick={() => setViewMode("cards")}
                            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${viewMode === "cards" ? "bg-white text-primary shadow-xs" : "text-muted-foreground hover:text-primary"}`}
                          >
                            Daftar Kartu
                          </button>
                          <button
                            onClick={() => setViewMode("timeline")}
                            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${viewMode === "timeline" ? "bg-white text-primary shadow-xs" : "text-muted-foreground hover:text-primary"}`}
                          >
                            Jalur Belajar
                          </button>
                        </div>
                      </div>

                      {viewMode === "timeline" ? (
                        <div className="relative pl-6 border-l border-border ml-3 py-2 space-y-8 animate-in fade-in duration-300">
                          {[...recommendations].sort((a, b) => {
                            if (a.course.semester !== b.course.semester) return a.course.semester - b.course.semester
                            return a.course.code.localeCompare(b.course.code)
                          }).map((rec, idx) => {
                            const course = rec.course
                            const isEnrolled = activeCourseCodes.includes(course.code)
                            const isHovered = hoveredCourse?.code === course.code
                            return (
                              <div key={idx} className="relative space-y-3" onMouseEnter={() => setHoveredCourse(course)} onMouseLeave={() => setHoveredCourse(null)}>
                                <div className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-300 ${
                                  isEnrolled ? "border-emerald-500 bg-emerald-50" : isHovered ? "border-[#CF3A1F] scale-110" : "border-slate-300"
                                }`}>
                                  {isEnrolled && <Check className="h-1.5 w-1.5 stroke-[4] text-emerald-500" />}
                                </div>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30">{course.code}</span>
                                      <span className="text-xs text-muted-foreground font-semibold">Semester {course.semester}</span>
                                      <span className="text-xs text-slate-300">|</span>
                                      <span className="text-xs text-muted-foreground">{course.department}</span>
                                    </div>
                                    <h3 className="font-heading text-base font-bold text-primary mt-1">{course.title}</h3>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20 flex items-center gap-1">
                                      <Sparkles className="h-2.5 w-2.5" /> {rec.match_percentage}% Relevan
                                    </span>
                                    {isEnrolled
                                      ? <span className="text-[10px] font-bold text-primary bg-accent/20 px-3 py-1.5 rounded-lg border border-accent/30 flex items-center gap-0.5 shrink-0"><Check className="h-3.5 w-3.5" /> Terdaftar</span>
                                      : <Button onClick={() => handleEnroll(course.code)} className="bg-destructive hover:bg-destructive/95 text-white text-[10px] h-8 cursor-pointer px-3 rounded-lg font-medium shadow-xs shrink-0">Ambil Kelas</Button>
                                    }
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
                                <div className={`flex items-start justify-between gap-4 flex-wrap select-none ${isExpanded ? "cursor-pointer" : ""}`} onClick={isExpanded ? () => toggleRecExpand(course.code) : undefined}>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30">{course.code}</span>
                                      <span className="text-xs text-muted-foreground">{course.department}</span>
                                    </div>
                                    <h3 className="font-heading text-lg font-bold text-primary mt-1">{course.title}</h3>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                                      <Sparkles className="h-3.5 w-3.5" />
                                      <span className="text-xs font-bold font-heading">{rec.match_percentage}% Relevan</span>
                                    </div>
                                    <span className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                                        {course.modules.map(module => (
                                          <div key={module.id} className="text-xs flex items-center gap-2 text-primary p-2 border rounded bg-background">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                                            <span className="truncate">Modul {module.order}: {module.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2 animate-in fade-in duration-200">
                                      <span className="text-xs text-muted-foreground">
                                        Bobot: <strong className="text-primary">{course.sks} SKS</strong> | Semester {course.semester}
                                      </span>
                                      {isEnrolled
                                        ? <span className="text-xs font-bold text-primary bg-accent/20 px-4 py-2 rounded-lg border border-accent/30 flex items-center gap-1"><Check className="h-4 w-4" /> Sudah Terdaftar</span>
                                        : <Button onClick={() => handleEnroll(course.code)} className="bg-destructive hover:bg-destructive/95 text-white text-xs h-9 cursor-pointer px-4 rounded-lg font-medium shadow-sm">Ambil Mata Kuliah Ini</Button>
                                      }
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })}

                          {/* Upsell for free users after showing 3 */}
                          {!isPremiumAnalysis && (
                            <div className="rounded-xl border-2 border-dashed border-border bg-[#FAF9FB] p-6 text-center">
                              <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                              <p className="font-semibold text-primary text-sm">Dapatkan Rekomendasi Lebih Banyak</p>
                              <p className="text-xs text-muted-foreground mt-1">Scholar & Pro mendapatkan roadmap kelas penuh, semester planner, dan gap map lengkap.</p>
                              <Button className="mt-3 bg-destructive hover:bg-destructive/90 text-white text-xs px-4 py-2 cursor-pointer" onClick={() => router.push("/pricing")}>
                                Upgrade ke Scholar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print-Only Layout */}
        {academicProfile && (
          <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-[#060708] p-8 space-y-8">
            
            {/* ── PAGE 1: COVER HEADER & PRIMARY COMPETENCY PROFILE ── */}
            <div className="space-y-6 min-h-[920px] flex flex-col justify-between">
              <div>
                {/* Branding Top Band */}
                <div className="flex justify-between items-center border-b-4 border-[#CF3A1F] pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#060708] text-white">
                      <GraduationCap className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-heading font-black tracking-tight text-[#060708] flex items-baseline">
                        Belajara<span className="text-[#CF3A1F] font-bold">.</span>
                      </h1>
                      <p className="text-[9px] font-heading font-bold tracking-widest text-[#7E7C82] uppercase mt-0.5">
                        AI Academic Advisor Report
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold text-[#CF3A1F] bg-[#CF3A1F]/10 border border-[#CF3A1F]/20 rounded-full px-3 py-1 uppercase tracking-wider">
                      Analisis Premium
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                      Laporan ID: AI-EXP-{currentUser?.username || "0001"}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-4 space-y-1.5">
                  <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-[#060708]">
                    Laporan Hasil Analisis Akademik &amp; Rekomendasi Karir AI
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tanggal Pembuatan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Student Info Table Grid */}
                <div className="grid grid-cols-2 gap-6 p-4 border border-[#E8E5E9] rounded-xl bg-[#FAF9FB] mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profil Mahasiswa</p>
                    <table className="w-full text-xs text-left">
                      <tbody>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600 w-28">Nama:</th>
                          <td className="py-1 text-slate-900 font-semibold">{currentUser?.name || currentUser?.username || "Mahasiswa Belajara"}</td>
                        </tr>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600">Email:</th>
                          <td className="py-1 text-slate-900">{currentUser?.email || "-"}</td>
                        </tr>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600">Target Prodi:</th>
                          <td className="py-1 text-[#CF3A1F] font-bold">{academicProfile.study_program || userProdi}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status Analisis</p>
                    <table className="w-full text-xs text-left">
                      <tbody>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600 w-36">Kesiapan Akademik:</th>
                          <td className="py-1 font-bold text-slate-900">{readinessScore} / 100</td>
                        </tr>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600">AI Confidence Score:</th>
                          <td className="py-1 font-bold text-slate-900">{confidenceScore}%</td>
                        </tr>
                        <tr>
                          <th className="py-1 pr-3 font-bold text-slate-600">Semester Terdeteksi:</th>
                          <td className="py-1 text-slate-900">Semester {academicProfile.detected_semester || "Tidak terdeteksi"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Summary Card */}
                {academicProfile.summary && (
                  <div className="space-y-2 mb-6">
                    <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                      Ringkasan Evaluasi AI
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-[#FAF9FB] p-4 rounded-xl border border-[#E8E5E9]">
                      {academicProfile.summary}
                    </p>
                  </div>
                )}

                {/* Competency Visualization */}
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-4 border border-[#E8E5E9] rounded-xl bg-white h-[260px]">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Radar Chart Kompetensi</p>
                    <svg width="220" height="200" className="overflow-visible">
                      {gridLevels.map(lvl => (
                        <path key={lvl} d={getGridPath(lvl)} fill="none" stroke="#FAF9FB" strokeWidth="1.5" className="stroke-slate-100" />
                      ))}
                      <path d={getGridPath(100)} fill="none" stroke="#E8E5E9" strokeWidth="1" />
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const outer = getCoordinates(idx, 100)
                        return <line key={idx} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#E8E5E9" strokeWidth="1" strokeDasharray="2" />
                      })}
                      <polygon points={pointsStr} fill="rgba(207, 58, 31, 0.15)" stroke="#CF3A1F" strokeWidth="2" />
                      {skillList.map((s, idx) => {
                        const coords = getCoordinates(idx, s.value)
                        return <circle key={idx} cx={coords.x} cy={coords.y} r="3.5" fill="#CF3A1F" stroke="#ffffff" strokeWidth="1" />
                      })}
                      {skillList.map((s, idx) => {
                        const coords = getLabelCoordinates(idx)
                        const anchors: ("middle" | "start" | "end")[] = ["middle", "start", "start", "end", "end"]
                        const textAnchor = anchors[idx] || "middle"
                        return (
                          <g key={idx}>
                            <text x={coords.x} y={coords.y} textAnchor={textAnchor} className="text-[9px] font-black fill-slate-700 uppercase tracking-wider">{s.label}</text>
                            <text x={coords.x} y={coords.y + 9} textAnchor={textAnchor} className="text-[9px] font-mono font-bold fill-[#CF3A1F]">{s.value}%</text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  <div className="space-y-3 p-4 border border-[#E8E5E9] rounded-xl bg-white h-[260px] flex flex-col justify-center">
                    <h4 className="font-heading text-xs font-bold text-[#060708] mb-1">Detail Skor Kompetensi</h4>
                    <div className="space-y-2">
                      {skillList.map(s => (
                        <div key={s.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-600">{s.label}</span>
                            <span className="text-[#CF3A1F]">{s.value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full border border-[#E8E5E9] overflow-hidden">
                            <div className="h-full bg-slate-800 rounded-full" style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cover Page Footer */}
              <div className="text-center text-[9px] text-muted-foreground border-t border-[#E8E5E9] pt-3">
                Platform Pembelajaran Belajara • Hak Cipta Terlindungi
              </div>
            </div>

            {/* ── PAGE 2: CURRICULUM GAP MAP & CAREER PATH LENS ── */}
            <div className="page-break pt-6 space-y-6 min-h-[920px] flex flex-col justify-between">
              <div>
                {/* Mini Header */}
                <div className="flex justify-between items-center border-b border-[#E8E5E9] pb-3 mb-6">
                  <span className="text-[10px] font-heading font-black text-[#060708] tracking-wider uppercase">Belajara. AI Advisor Report</span>
                  <span className="text-[9px] text-muted-foreground font-mono">Halaman 2 dari 4</span>
                </div>

                {/* Gap Map */}
                <div className="space-y-4">
                  <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                    Curriculum Gap Map (Analisis Kesenjangan Kurikulum)
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mandatory Gaps */}
                    <div className="space-y-3 border border-[#E8E5E9] p-4 rounded-xl bg-white">
                      <h4 className="text-[10px] font-bold text-[#7E7C82] uppercase tracking-wider border-b border-[#E8E5E9] pb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#CF3A1F]" />
                        Gap Wajib (Mandatory Gaps)
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-hidden">
                        {gapMap.mandatory.length > 0 ? gapMap.mandatory.slice(0, 3).map((gap, i) => (
                          <div key={i} className="p-2.5 border border-[#E8E5E9] rounded-lg text-xs bg-[#FAF9FB] space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 truncate max-w-[130px]">{gap.gap}</span>
                              <span className="text-[#CF3A1F] bg-[#CF3A1F]/10 border border-[#CF3A1F]/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">{gap.priority}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{gap.reason}</p>
                          </div>
                        )) : <p className="text-xs text-slate-400 italic">Tidak ada gap wajib terdeteksi.</p>}
                      </div>
                    </div>

                    {/* Elective Gaps */}
                    <div className="space-y-3 border border-[#E8E5E9] p-4 rounded-xl bg-white">
                      <h4 className="text-[10px] font-bold text-[#7E7C82] uppercase tracking-wider border-b border-[#E8E5E9] pb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Gap Pilihan (Elective Gaps)
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-hidden">
                        {gapMap.elective.length > 0 ? gapMap.elective.slice(0, 3).map((gap, i) => (
                          <div key={i} className="p-2.5 border border-[#E8E5E9] rounded-lg text-xs bg-[#FAF9FB] space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 truncate max-w-[130px]">{gap.gap}</span>
                              <span className="text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">{gap.priority}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{gap.reason}</p>
                          </div>
                        )) : <p className="text-xs text-slate-400 italic">Tidak ada gap pilihan terdeteksi.</p>}
                      </div>
                    </div>
                  </div>

                  {/* Career Gaps */}
                  {gapMap.career.length > 0 && (
                    <div className="border border-[#E8E5E9] p-4 rounded-xl bg-[#FAF9FB]">
                      <h4 className="text-[10px] font-bold text-[#7E7C82] uppercase tracking-wider border-b border-[#E8E5E9] pb-2 mb-3">
                        Gap Karir (Career Gaps)
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {gapMap.career.slice(0, 4).map((gap, i) => (
                          <div key={i} className="p-2.5 border border-blue-100 rounded-lg text-xs bg-white space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 truncate max-w-[130px]">{gap.gap}</span>
                              {gap.target_career && <span className="text-[8px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">{gap.target_career}</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{gap.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Career Path Lens */}
                {careerPaths.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                      Rekomendasi Jalur Karir (Career Path Lens)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {careerPaths.slice(0, 2).map((career, idx) => (
                        <div key={idx} className="p-4 border border-[#E8E5E9] rounded-xl bg-white space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-heading font-bold text-slate-900">{career.title}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Kesesuaian Kompetensi</p>
                            </div>
                            <p className="text-lg font-heading font-bold text-[#CF3A1F]">{clampPercent(career.fit_score)}%</p>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{career.why}</p>
                          {career.missing_skills.length > 0 && (
                            <div className="pt-1">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Keterampilan Tambahan:</p>
                              <div className="flex flex-wrap gap-1">
                                {career.missing_skills.slice(0, 4).map((skill, si) => (
                                  <span key={si} className="rounded border border-[#E8E5E9] bg-[#FAF9FB] px-1.5 py-0.5 text-[8px] font-semibold text-slate-700">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Footer */}
              <div className="text-center text-[9px] text-muted-foreground border-t border-[#E8E5E9] pt-3">
                Laporan Rencana Studi AI Belajara v2.0 • Hak Cipta Terlindungi
              </div>
            </div>

            {/* ── PAGE 3: SEMESTER ACTION PLANNER & AI EVIDENCE ── */}
            <div className="page-break pt-6 space-y-6 min-h-[920px] flex flex-col justify-between">
              <div>
                {/* Mini Header */}
                <div className="flex justify-between items-center border-b border-[#E8E5E9] pb-3 mb-6">
                  <span className="text-[10px] font-heading font-black text-[#060708] tracking-wider uppercase">Belajara. AI Advisor Report</span>
                  <span className="text-[9px] text-muted-foreground font-mono">Halaman 3 dari 4</span>
                </div>

                {/* Semester Planner */}
                {semesterPlan.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                      Rencana Pembelajaran Semester (Semester Planner)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {semesterPlan.slice(0, 4).map((plan, index) => (
                        <div key={index} className="rounded-xl border border-[#E8E5E9] bg-white p-4 space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-[#CF3A1F]">{plan.term}</p>
                          <p className="font-heading text-sm font-bold text-slate-900">{plan.focus}</p>
                          <ul className="space-y-1.5 mt-1">
                            {plan.actions.slice(0, 3).map((action, ai) => (
                              <li key={ai} className="flex gap-1.5 text-[11px] text-slate-600 leading-normal">
                                <span className="text-slate-900 font-bold shrink-0">•</span>
                                <span className="line-clamp-2">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Evidence Logs */}
                {evidenceItems.length > 0 && (
                  <div className="space-y-3 pt-6">
                    <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                      Bukti Analisis Dokumen (AI Evidence Logs)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {evidenceItems.slice(0, 2).map((item, i) => (
                        <div key={i} className="p-4 border border-[#E8E5E9] rounded-xl bg-[#FAF9FB] space-y-2">
                          <div className="flex items-start justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{item.competency}</p>
                              {item.course_name && <p className="text-[9px] text-slate-400 mt-0.5">Mata Kuliah: <span className="font-semibold text-slate-700">{item.course_name}</span></p>}
                            </div>
                            <span className="text-[8px] font-bold text-[#CF3A1F] bg-[#CF3A1F]/5 px-2 py-0.5 rounded-full border border-[#CF3A1F]/10 shrink-0 font-mono">
                              Conf: {clampPercent(item.confidence)}%
                            </span>
                          </div>
                          {item.text_excerpt && (
                            <blockquote className="border-l-2 border-[#C6B5BF] pl-2 text-[10px] text-slate-500 italic leading-relaxed line-clamp-3">
                              "{item.text_excerpt}"
                            </blockquote>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Footer */}
              <div className="text-center text-[9px] text-muted-foreground border-t border-[#E8E5E9] pt-3">
                Laporan Rencana Studi AI Belajara v2.0 • Hak Cipta Terlindungi
              </div>
            </div>

            {/* ── PAGE 4: DETAILED COURSE RECOMMENDATIONS & INSTITUTIONAL FOOTER ── */}
            <div className="page-break pt-6 space-y-6 min-h-[920px] flex flex-col justify-between">
              <div>
                {/* Mini Header */}
                <div className="flex justify-between items-center border-b border-[#E8E5E9] pb-3 mb-6">
                  <span className="text-[10px] font-heading font-black text-[#060708] tracking-wider uppercase">Belajara. AI Advisor Report</span>
                  <span className="text-[9px] text-muted-foreground font-mono">Halaman 4 dari 4</span>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-sm font-bold text-[#060708] border-l-4 border-[#CF3A1F] pl-3">
                      Rekomendasi Kelas Belajara (Roadmap Kurikulum)
                    </h3>
                    
                    <div className="space-y-3">
                      {recommendations.slice(0, 4).map((item, i) => (
                        <div key={i} className="p-4 border border-[#E8E5E9] rounded-xl bg-white space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-900 text-sm font-heading">{item.course?.title} ({item.course?.code})</span>
                            <span className="text-[10px] font-bold text-[#CF3A1F] bg-[#CF3A1F]/10 px-2 py-0.5 rounded border border-[#CF3A1F]/20 font-mono">{item.match_percentage}% Relevan</span>
                          </div>
                          <p className="text-[10px] text-[#7E7C82]">{item.course?.department} • {item.course?.sks} SKS • Semester {item.course?.semester}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1"><strong>Rasionalisasi AI:</strong> "{item.reason}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Footer (Institutional Disclaimer) */}
              <div className="space-y-6">
                <div className="border-t border-[#E8E5E9] pt-6 grid grid-cols-2 gap-8 text-left max-w-3xl mx-auto text-[11px]">
                  <div className="space-y-1.5 text-slate-500">
                    <p className="font-bold text-slate-700">Verifikasi Dokumen Akademik</p>
                    <p className="leading-relaxed">Laporan ini dibuat otomatis berbasis data transkrip akademik yang diunggah. Keaslian transkrip dan data historis di dalamnya merupakan tanggung jawab penuh mahasiswa.</p>
                  </div>
                  <div className="space-y-1.5 text-slate-500">
                    <p className="font-bold text-slate-700">Sertifikasi & Disclaimer</p>
                    <p className="leading-relaxed">Sistem Rekomendasi AI Belajara menggunakan model bahasa besar untuk melakukan pemetaan kompetensi. Hasil analisa ini ditujukan sebagai referensi belajar tambahan, bukan keputusan kelulusan formal.</p>
                  </div>
                </div>
                
                <div className="text-center text-[9px] text-muted-foreground border-t border-[#E8E5E9] pt-4">
                  Laporan Hasil Rekomendasi AI Belajara • Dilindungi Hak Cipta © {new Date().getFullYear()} Belajara Indonesia.
                </div>
              </div>
            </div>

          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
