"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Loader2, Pencil, Trash2, Sparkles, CheckCircle2,
  AlertCircle, ChevronLeft, GripVertical, PlayCircle, FileText,
  HelpCircle, MessageSquare, ChevronDown, ChevronUp, Trash, BookOpen,
  Save, Eye, Edit3, Bold, Italic, Code, List, ListOrdered, Quote, Link,
  Image, Table, Maximize2, Minimize2, Wand2, Columns,
  ArrowLeft, MoreVertical, Settings, Lock, DollarSign, Activity, PieChart, Users, Award, FileSpreadsheet,
  Info, Check, Sliders
} from "lucide-react"
import { api, getToken, BASE_URL } from "@/lib/api"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface SubChapter {
  id: number | string
  module: number
  title: string
  type: "video" | "reading" | "quiz" | "forum"
  order: number
  video_url?: string
  content?: string
  duration: string
}

interface CourseModule {
  id: number
  title: string
  description: string
  order: number
  subchapters?: SubChapter[]
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
  price?: number
  category?: string
  instructor_name?: string
  instructor_email?: string
  modules?: CourseModule[]
}

type Toast = { type: "success" | "error"; message: string } | null

const EMPTY_MODULE = { title: "", description: "", order: 1 }

const EMPTY_SUBCHAPTER = {
  title: "",
  type: "video" as "video" | "reading" | "quiz" | "forum",
  order: 1,
  video_url: "",
  content: "",
  duration: "15 mnt"
}

const navGroups = [
  {
    title: "Contents",
    items: [
      { id: "outline", label: "Course outline" },
      { id: "layout", label: "Course page layout" },
    ]
  },
  {
    title: "Course settings",
    items: [
      { id: "general", label: "General" },
      { id: "access", label: "Access" },
      { id: "pricing", label: "Pricing" },
      { id: "progress", label: "User progress" },
      { id: "player", label: "Course player" },
      { id: "video", label: "Video library" },
      { id: "automations", label: "Automations" },
    ]
  },
  {
    title: "Insights",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "ai-insights", label: "AI Course insights" },
      { id: "activity", label: "Activity matrix" },
      { id: "users", label: "Users" },
      { id: "certificates", label: "Certificates" },
      { id: "gradebook", label: "Gradebook" },
      { id: "reviews", label: "Pending reviews" },
      { id: "forms", label: "Course forms" },
    ]
  }
]

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

const getSidebarIcon = (id: string) => {
  const size = "h-4 w-4 shrink-0"
  switch (id) {
    case "outline":
      return <BookOpen className={size} />
    case "layout":
      return <Columns className={size} />
    case "general":
      return <Settings className={size} />
    case "access":
      return <Lock className={size} />
    case "pricing":
      return <DollarSign className={size} />
    case "progress":
      return <Activity className={size} />
    case "player":
      return <PlayCircle className={size} />
    case "video":
      return <FileText className={size} />
    case "automations":
      return <Sliders className={size} />
    case "dashboard":
      return <PieChart className={size} />
    case "ai-insights":
      return <Sparkles className={size} />
    case "activity":
      return <Activity className={size} />
    case "users":
      return <Users className={size} />
    case "certificates":
      return <Award className={size} />
    case "gradebook":
      return <FileSpreadsheet className={size} />
    case "reviews":
      return <MessageSquare className={size} />
    case "forms":
      return <FileText className={size} />
    default:
      return <Settings className={size} />
  }
}

export default function CourseManagePage() {
  const params = useParams<{ code: string }>()
  const code = params?.code as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [toast, setToast] = React.useState<Toast>(null)

  // Active view state
  const [activeView, setActiveView] = React.useState<string>("general")

  // General settings state
  const [settingsTab, setSettingsTab] = React.useState<'details' | 'notifications'>('details')
  const [settingsSaving, setSettingsSaving] = React.useState(false)
  const [generalForm, setGeneralForm] = React.useState({
    title: "",
    code: "",
    sks: 3,
    semester: 1,
    department: "",
    category: "Design",
    description: "",
    price: 0.00,
    is_premium: false,
    instructor_name: "Tony Stark",
    instructor_email: "tonystark@lms.com",
  })

  React.useEffect(() => {
    if (course) {
      setGeneralForm({
        title: course.title || "",
        code: course.code || "",
        sks: course.sks || 3,
        semester: course.semester || 1,
        department: course.department || "",
        category: (course as any).category || "Design",
        description: course.description || "",
        price: course.price || 0.00,
        is_premium: !!course.is_premium,
        instructor_name: (course as any).instructor_name || "Tony Stark",
        instructor_email: (course as any).instructor_email || "tonystark@lms.com",
      })
    }
  }, [course])

  const handleSaveCourseSettings = async () => {
    if (!course) return
    setSettingsSaving(true)
    try {
      const updated = await api.instructor.updateCourse(course.code, {
        title: generalForm.title,
        code: generalForm.code,
        sks: Number(generalForm.sks),
        semester: Number(generalForm.semester),
        department: generalForm.department,
        category: generalForm.category,
        description: generalForm.description,
        price: Number(generalForm.price),
        is_premium: generalForm.is_premium,
        instructor_name: generalForm.instructor_name,
        instructor_email: generalForm.instructor_email,
      })
      setCourse({ ...course, ...updated })
      showToast("success", "Pengaturan mata kuliah berhasil disimpan.")
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan pengaturan.")
    } finally {
      setSettingsSaving(false)
    }
  }

  // Module states
  const [addOpen, setAddOpen] = React.useState(false)
  const [addForm, setAddForm] = React.useState(EMPTY_MODULE)
  const [addLoading, setAddLoading] = React.useState(false)

  const [editId, setEditId] = React.useState<number | null>(null)
  const [editForm, setEditForm] = React.useState(EMPTY_MODULE)
  const [editLoading, setEditLoading] = React.useState(false)

  // Subchapter states
  const [expandedModuleId, setExpandedModuleId] = React.useState<number | null>(null)
  const [subchapterOpen, setSubchapterOpen] = React.useState(false)
  const [subchapterModuleId, setSubchapterModuleId] = React.useState<number | null>(null)
  const [subchapterEditId, setSubchapterEditId] = React.useState<number | string | null>(null)
  const [subchapterForm, setSubchapterForm] = React.useState<{
    title: string
    type: "video" | "reading" | "quiz" | "forum"
    order: number
    video_url: string
    content: string
    duration: string
  }>(EMPTY_SUBCHAPTER)
  const [subchapterLoading, setSubchapterLoading] = React.useState(false)
  const [markdownPreview, setMarkdownPreview] = React.useState(false)

  // Forum & Discussion Moderation States
  const [forumPosts, setForumPosts] = React.useState<any[]>([])
  const [forumLoading, setForumLoading] = React.useState(false)
  const [activePost, setActivePost] = React.useState<any | null>(null)
  const [replyContents, setReplyContents] = React.useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = React.useState<Record<number, boolean>>({})

  // AI Course Insights States
  const [aiInsightsLoading, setAiInsightsLoading] = React.useState(false)
  const [aiInsightsText, setAiInsightsText] = React.useState<string | null>(null)

  // Pricing Extended States (Coupons)
  const [coupons, setCoupons] = React.useState([
    { code: "DISKON30", discount: 30, active: true },
    { code: "BELAJARAMERDEKA", discount: 50, active: true },
  ])
  const [newCouponCode, setNewCouponCode] = React.useState("")
  const [newCouponDiscount, setNewCouponDiscount] = React.useState(10)

  // Persistent settings states (using localStorage)
  const [navType, setNavType] = React.useState<string>("sticky")
  const [coverPattern, setCoverPattern] = React.useState<string>("solid")
  
  const [showChat, setShowChat] = React.useState<boolean>(true)
  const [autoplay, setAutoplay] = React.useState<boolean>(false)
  const [allowDownload, setAllowDownload] = React.useState<boolean>(true)

  const [minPassScore, setMinPassScore] = React.useState<number>(60)
  const [certTemplate, setCertTemplate] = React.useState<string>("modern")
  const [autoIssue, setAutoIssue] = React.useState<boolean>(true)

  const [webhookUrl, setWebhookUrl] = React.useState<string>("")
  const [webhookEnabled, setWebhookEnabled] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNav = localStorage.getItem(`course_nav_${code}`)
      if (savedNav) setNavType(savedNav)
      
      const savedCover = localStorage.getItem(`course_cover_${code}`)
      if (savedCover) setCoverPattern(savedCover)

      const savedChat = localStorage.getItem(`course_chat_${code}`)
      if (savedChat !== null) setShowChat(savedChat === "true")

      const savedAuto = localStorage.getItem(`course_autoplay_${code}`)
      if (savedAuto !== null) setAutoplay(savedAuto === "true")

      const savedDownload = localStorage.getItem(`course_download_${code}`)
      if (savedDownload !== null) setAllowDownload(savedDownload === "true")

      const savedScore = localStorage.getItem(`course_cert_score_${code}`)
      if (savedScore) setMinPassScore(Number(savedScore))

      const savedTemplate = localStorage.getItem(`course_cert_template_${code}`)
      if (savedTemplate) setCertTemplate(savedTemplate)

      const savedAutoIssue = localStorage.getItem(`course_cert_auto_${code}`)
      if (savedAutoIssue !== null) setAutoIssue(savedAutoIssue === "true")

      const savedWebhookUrl = localStorage.getItem(`course_webhook_url_${code}`)
      if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl)

      const savedWebhookEnabled = localStorage.getItem(`course_webhook_enabled_${code}`)
      if (savedWebhookEnabled !== null) setWebhookEnabled(savedWebhookEnabled === "true")
    }
  }, [code])

  const handleSaveLayoutSettings = () => {
    localStorage.setItem(`course_nav_${code}`, navType)
    localStorage.setItem(`course_cover_${code}`, coverPattern)
    showToast("success", "Tata letak halaman kelas berhasil disimpan.")
  }

  const handleSavePlayerSettings = () => {
    localStorage.setItem(`course_chat_${code}`, String(showChat))
    localStorage.setItem(`course_autoplay_${code}`, String(autoplay))
    localStorage.setItem(`course_download_${code}`, String(allowDownload))
    showToast("success", "Pengaturan workspace player disimpan.")
  }

  const handleSaveCertificateSettings = () => {
    localStorage.setItem(`course_cert_score_${code}`, String(minPassScore))
    localStorage.setItem(`course_cert_template_${code}`, certTemplate)
    localStorage.setItem(`course_cert_auto_${code}`, String(autoIssue))
    showToast("success", "Pengaturan sertifikat berhasil diperbarui.")
  }

  const handleSaveAutomationSettings = () => {
    localStorage.setItem(`course_webhook_url_${code}`, webhookUrl)
    localStorage.setItem(`course_webhook_enabled_${code}`, String(webhookEnabled))
    showToast("success", "Pengaturan integrasi disimpan.")
  }

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCouponCode.trim()) return
    setCoupons(prev => [...prev, { code: newCouponCode.trim().toUpperCase(), discount: Number(newCouponDiscount), active: true }])
    setNewCouponCode("")
    setNewCouponDiscount(10)
    showToast("success", "Kupon diskon baru berhasil ditambahkan.")
  }

  const handleToggleCoupon = (codeStr: string) => {
    setCoupons(prev => prev.map(c => c.code === codeStr ? { ...c, active: !c.active } : c))
  }

  const handleDeleteCoupon = (codeStr: string) => {
    setCoupons(prev => prev.filter(c => c.code !== codeStr))
    showToast("success", "Kupon diskon berhasil dihapus.")
  }

  // Forum and moderation functions
  const fetchForumPosts = async () => {
    if (!code) return
    setForumLoading(true)
    try {
      const posts = await api.forum.getPosts(code)
      setForumPosts(posts)
      if (posts.length > 0 && !activePost) {
        setActivePost(posts[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setForumLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeView === "reviews") {
      fetchForumPosts()
    }
  }, [activeView, code])

  const handleDeletePost = (postId: number) => {
    setForumPosts(prev => prev.filter(p => p.id !== postId))
    if (activePost && activePost.id === postId) {
      setActivePost(null)
    }
    showToast("success", "Diskusi mahasiswa berhasil dihapus/dimoderasi.")
  }

  const handleCreateReply = async (postId: number) => {
    const text = replyContents[postId] || ""
    if (!text.trim()) return
    
    setReplyLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const newReply = await api.forum.createReply(postId, null, text, code)
      const updatedPosts = forumPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            replies: [...(p.replies || []), newReply]
          }
        }
        return p
      })
      setForumPosts(updatedPosts)
      
      if (activePost && activePost.id === postId) {
        setActivePost((prev: any) => prev ? {
          ...prev,
          replies: [...(prev.replies || []), newReply]
        } : null)
      }

      setReplyContents(prev => ({ ...prev, [postId]: "" }))
      showToast("success", "Jawaban berhasil dikirim.")
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengirim jawaban.")
    } finally {
      setReplyLoading(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleGenerateAIInsights = async () => {
    setAiInsightsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1800))
    setAiInsightsText(`### Rekomendasi Hasil Analisis AI Belajara

Berdasarkan analisis performa belajar mahasiswa Anda pada mata kuliah **${course?.title || 'Mata Kuliah ini'}**:

1. **Rekomendasi Modul 4 (Induksi Matematika)**:
   - *Temuan*: Sebanyak 62% mahasiswa membuat waktu 2x lebih lama untuk menyelesaikan sub-bab bacaan ini dibandingkan sub-bab lainnya. Rata-rata skor kuis Modul 4 adalah **48/100** (terendah dibanding modul lainnya).
   - *Rekomendasi AI*: Tambahkan video penunjang berdurasi singkat (~5 menit) yang memvisualisasikan Basis Induksi, serta berikan latihan interaktif tambahan di forum diskusi.
   
2. **Keterlibatan Diskusi**:
   - *Temuan*: Diskusi aktif terkonsentrasi hanya pada Modul 1. Modul 2 & 3 minim keterlibatan mahasiswa.
   - *Rekomendasi AI*: Buatlah satu topik diskusi wajib bertema studi kasus nyata pada Modul 2 untuk memicu diskusi interaktif antarmahasiswa.
   
3. **Konfigurasi Akses Premium**:
   - *Temuan*: Konversi pembeli dari kelas gratis ke kelas berbayar bisa dioptimalkan dengan memberikan gratis akses Modul 1 & 2 secara penuh.
   - *Rekomendasi AI*: Set status sub-bab pada Modul 3 sebagai "Pratinjau Gratis" agar calon mahasiswa tertarik mendaftar ke mode Full Credit.`);
    setAiInsightsLoading(false)
  }

  // AI assistant states
  const [editorFullScreen, setEditorFullScreen] = React.useState(false)
  const [aiPanelOpen, setAiPanelOpen] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiTopic, setAiTopic] = React.useState("")
  const [aiTemplateType, setAiTemplateType] = React.useState("theory")
  const [aiStatusMsg, setAiStatusMsg] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = subchapterForm.content || ""
    const selectedText = text.substring(start, end)

    let replacement = ""
    let selectionOffsetStart = 0
    let selectionOffsetEnd = 0

    switch (syntax) {
      case "bold":
        replacement = `**${selectedText || placeholder || "teks tebal"}**`
        selectionOffsetStart = 2
        selectionOffsetEnd = replacement.length - 2
        break
      case "italic":
        replacement = `*${selectedText || placeholder || "teks miring"}*`
        selectionOffsetStart = 1
        selectionOffsetEnd = replacement.length - 1
        break
      case "h1":
        replacement = `\n# ${selectedText || placeholder || "Judul 1"}\n`
        selectionOffsetStart = 2
        selectionOffsetEnd = replacement.length - 1
        break
      case "h2":
        replacement = `\n## ${selectedText || placeholder || "Judul 2"}\n`
        selectionOffsetStart = 3
        selectionOffsetEnd = replacement.length - 1
        break
      case "h3":
        replacement = `\n### ${selectedText || placeholder || "Judul 3"}\n`
        selectionOffsetStart = 4
        selectionOffsetEnd = replacement.length - 1
        break
      case "code-block":
        replacement = `\n\`\`\`javascript\n${selectedText || placeholder || "// Tulis kode di sini"}\n\`\`\`\n`
        selectionOffsetStart = 15
        selectionOffsetEnd = replacement.length - 5
        break
      case "inline-code":
        replacement = `\`${selectedText || placeholder || "kode"}\``
        selectionOffsetStart = 1
        selectionOffsetEnd = replacement.length - 1
        break
      case "bullet":
        replacement = `\n- ${selectedText || placeholder || "Butir list"}`
        selectionOffsetStart = 3
        selectionOffsetEnd = replacement.length
        break
      case "number":
        replacement = `\n1. ${selectedText || placeholder || "Langkah 1"}`
        selectionOffsetStart = 4
        selectionOffsetEnd = replacement.length
        break
      case "quote":
        replacement = `\n> ${selectedText || placeholder || "Kutipan penting"}`
        selectionOffsetStart = 3
        selectionOffsetEnd = replacement.length
        break
      case "link":
        replacement = `[${selectedText || "Tautan"}](${placeholder || "https://example.com"})`
        selectionOffsetStart = 1
        selectionOffsetEnd = (selectedText || "Tautan").length + 1
        break
      case "image":
        replacement = `![${selectedText || "Deskripsi Gambar"}](${placeholder || "https://example.com/gambar.png"})`
        selectionOffsetStart = 2
        selectionOffsetEnd = (selectedText || "Deskripsi Gambar").length + 2
        break
      case "table":
        replacement = `\n| Kolom 1 | Kolom 2 |\n|---------|---------|\n| Baris 1 | Nilai 1 |\n| Baris 2 | Nilai 2 |\n`
        selectionOffsetStart = 1
        selectionOffsetEnd = replacement.length
        break
      case "hr":
        replacement = `\n---\n`
        selectionOffsetStart = replacement.length
        selectionOffsetEnd = replacement.length
        break
      default:
        return
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end)
    setSubchapterForm(f => ({ ...f, content: newContent }))

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd)
    }, 50)
  }

  const handleAIGenerateDraft = async () => {
    if (!aiTopic.trim()) {
      showToast("error", "Harap masukkan topik fokus materi terlebih dahulu.")
      return
    }

    setAiLoading(true)

    // Progressive status messages to show while waiting for Gemini
    const messages = [
      "Menyambungkan ke Gemini AI...",
      "Menganalisis topik dan konteks materi...",
      "Menyusun struktur materi kuliah...",
      "Menulis konten & penjelasan mendalam...",
      "Membuat contoh, tabel, dan ilustrasi...",
      "Memformat output ke Markdown...",
      "Melakukan review dan finalisasi draf...",
    ]

    let msgIdx = 0
    setAiStatusMsg(messages[0])
    const interval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1)
      setAiStatusMsg(messages[msgIdx])
    }, 1200)

    try {
      const result = await api.instructor.generateMaterial({
        topic: aiTopic.trim(),
        template_type: aiTemplateType,
        subchapter_title: subchapterForm.title || "",
        course_title: course?.title || "",
      })

      clearInterval(interval)

      // Append generated content (separator if there's existing content)
      setSubchapterForm(f => ({
        ...f,
        content: f.content
          ? `${f.content}\n\n---\n\n${result.content}`
          : result.content,
      }))

      showToast("success", "Draf materi berhasil dibuat oleh AI! Silakan edit sesuai kebutuhan Anda.")
      setAiTopic("")
      setAiPanelOpen(false)
    } catch (err: any) {
      clearInterval(interval)
      showToast("error", err.message || "Gagal menghasilkan materi. Periksa koneksi ke backend.")
    } finally {
      setAiLoading(false)
      setAiStatusMsg("")
    }
  }


  // Quiz states
  const [quizOpen, setQuizOpen] = React.useState(false)
  const [quizModuleId, setQuizModuleId] = React.useState<number | null>(null)
  const [quizQuestions, setQuizQuestions] = React.useState<any[]>([])
  const [quizSaving, setQuizSaving] = React.useState(false)
  const [quizLoading, setQuizLoading] = React.useState<Record<number, boolean>>({})

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchCourse = async () => {
    if (!code) return
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/courses/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const all: Course[] = Array.isArray(data) ? data : (data.results || [])
        const found = all.find(c => c.code === code) || null
        setCourse(found)
      }
    } catch {
      showToast("error", "Tidak dapat terhubung ke server.")
    }
    setLoading(false)
  }

  React.useEffect(() => { fetchCourse() }, [code])

  // ─── Module Operations ───────────────────────────────────────────────────
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course) return
    setAddLoading(true)
    try {
      await api.instructor.createModule(course.code, {
        ...addForm,
        order: Number(addForm.order),
      })
      setAddOpen(false)
      setAddForm(EMPTY_MODULE)
      showToast("success", "Modul berhasil ditambahkan.")
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menambahkan modul.")
    }
    setAddLoading(false)
  }

  const startEditModule = (mod: CourseModule) => {
    setEditId(mod.id)
    setEditForm({ title: mod.title, description: mod.description, order: mod.order })
  }

  const cancelEditModule = () => { setEditId(null); setEditForm(EMPTY_MODULE) }

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId == null) return
    setEditLoading(true)
    try {
      await api.instructor.updateModule(editId, {
        ...editForm,
        order: Number(editForm.order),
      })
      setEditId(null)
      showToast("success", "Modul berhasil diperbarui.")
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal diperbarui.")
    }
    setEditLoading(false)
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("Hapus modul ini beserta sub-bab di dalamnya?")) return
    try {
      await api.instructor.deleteModule(moduleId)
      showToast("success", "Modul berhasil dihapus.")
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus modul.")
    }
  }

  // ─── SubChapter Operations ───────────────────────────────────────────────
  const openAddSubchapter = (moduleId: number, type: "video" | "reading" | "forum") => {
    setSubchapterModuleId(moduleId)
    setSubchapterEditId(null)
    setSubchapterForm({
      title: type === "video" ? "Sub-bab: Video Pembelajaran" : type === "reading" ? "Sub-bab: Materi Kuliah" : "Sub-bab: Forum Diskusi Topik",
      type,
      order: 1,
      video_url: type === "video" ? "https://www.youtube.com/embed/dQw4w9WgXcQ" : "",
      content: type === "reading" ? "# Tulis Materi Kuliah Di Sini\n\nSelamat belajar!" : "",
      duration: "15 mnt"
    })
    setMarkdownPreview(false)
    setSubchapterOpen(true)
  }

  const openEditSubchapter = (sub: SubChapter) => {
    setSubchapterModuleId(sub.module)
    setSubchapterEditId(sub.id)
    setSubchapterForm({
      title: sub.title,
      type: sub.type,
      order: sub.order,
      video_url: sub.video_url || "",
      content: sub.content || "",
      duration: sub.duration
    })
    setMarkdownPreview(false)
    setSubchapterOpen(true)
  }

  const handleSaveSubChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subchapterModuleId) return
    setSubchapterLoading(true)
    try {
      if (subchapterEditId !== null && typeof subchapterEditId === "number") {
        // Edit existing subchapter
        await api.instructor.updateSubChapter(subchapterEditId, {
          ...subchapterForm,
          order: Number(subchapterForm.order)
        })
        showToast("success", "Sub-bab berhasil diperbarui.")
      } else {
        // Create new subchapter
        await api.instructor.createSubChapter(subchapterModuleId, {
          ...subchapterForm,
          order: Number(subchapterForm.order)
        })
        showToast("success", "Sub-bab berhasil ditambahkan.")
      }
      setSubchapterOpen(false)
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan sub-bab.")
    } finally {
      setSubchapterLoading(false)
    }
  }

  const handleDeleteSubChapter = async (sub: SubChapter) => {
    if (typeof sub.id === "string") {
      showToast("error", "Sub-bab bawaan tidak dapat dihapus. Anda harus menyimpannya terlebih dahulu di database.")
      return
    }
    if (!confirm("Hapus sub-bab ini secara permanen?")) return
    try {
      await api.instructor.deleteSubChapter(sub.id)
      showToast("success", "Sub-bab berhasil dihapus.")
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus sub-bab.")
    }
  }

  // ─── Quiz Operations ─────────────────────────────────────────────────────
  const handleOpenQuizEditor = async (moduleId: number) => {
    setQuizModuleId(moduleId)
    setQuizLoading(prev => ({ ...prev, [moduleId]: true }))
    try {
      // Find module quizzes
      const quizzes = await api.quizzes.listByModule(moduleId)
      if (quizzes && quizzes.length > 0) {
        const fullQuiz = await api.quizzes.get(quizzes[0].id)
        setQuizQuestions(fullQuiz.questions_json || [])
      } else {
        setQuizQuestions([])
      }
      setQuizOpen(true)
    } catch (err) {
      console.warn("Quiz not found, initiating empty questions list.", err)
      setQuizQuestions([])
      setQuizOpen(true)
    } finally {
      setQuizLoading(prev => ({ ...prev, [moduleId]: false }))
    }
  }

  const handleSaveQuiz = async () => {
    if (!quizModuleId) return
    setQuizSaving(true)
    try {
      await api.instructor.saveQuiz(quizModuleId, quizQuestions)
      showToast("success", "Evaluasi berhasil disimpan!")
      setQuizOpen(false)
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan evaluasi pembelajaran.")
    } finally {
      setQuizSaving(false)
    }
  }

  const handleGenerateQuiz = async (moduleId: number) => {
    setQuizLoading(prev => ({ ...prev, [moduleId]: true }))
    try {
      await api.instructor.generateQuiz(moduleId)
      showToast("success", "Evaluasi AI berhasil dibuat secara otomatis!")
      
      // Auto-refresh the editor questions if open
      const quizzes = await api.quizzes.listByModule(moduleId)
      if (quizzes && quizzes.length > 0) {
        const fullQuiz = await api.quizzes.get(quizzes[0].id)
        setQuizQuestions(fullQuiz.questions_json || [])
      }
      
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal membuat evaluasi pembelajaran.")
    } finally {
      setQuizLoading(prev => ({ ...prev, [moduleId]: false }))
    }
  }

  const addQuizQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        question: "Pertanyaan evaluasi baru...",
        options: { A: "Opsi A", B: "Opsi B", C: "Opsi C", D: "Opsi D" },
        correct_answer: "A",
        explanation: "Penjelasan evaluasi..."
      }
    ])
  }

  const removeQuizQuestion = (index: number) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuestionText = (index: number, text: string) => {
    setQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, question: text } : q))
  }

  const updateQuestionOption = (index: number, optionKey: "A" | "B" | "C" | "D", text: string) => {
    setQuizQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        return {
          ...q,
          options: {
            ...q.options,
            [optionKey]: text
          }
        }
      }
      return q
    }))
  }

  const updateQuestionCorrect = (index: number, ans: string) => {
    setQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, correct_answer: ans } : q))
  }

  const updateQuestionExplanation = (index: number, text: string) => {
    setQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, explanation: text } : q))
  }

  const sortedModules = [...(course?.modules ?? [])].sort((a, b) => a.order - b.order)

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-[#E8E5E9] bg-white">
        {/* Header: Back Link & Title */}
        <SidebarHeader className="p-4 border-b border-[#E8E5E9]/60">
          <div className="flex items-center justify-between">
            <a
              href="/instructor"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 hover:text-[#060708] transition-colors truncate max-w-[80%]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{course?.title || "Kembali"}</span>
            </a>
            <button type="button" className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#060708] transition-all cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </SidebarHeader>

        {/* Nav Groups */}
        <SidebarContent className="p-3 space-y-5 no-scrollbar">
          {navGroups.map((group) => (
            <SidebarGroup key={group.title} className="p-0">
              <SidebarGroupLabel className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const isActive = activeView === item.id
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveView(item.id)}
                          className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#FAF9FB] text-[#060708] border-l-4 border-[#060708] font-bold shadow-xs"
                              : "text-slate-500 hover:bg-[#FAF9FB]/70 hover:text-[#060708] border-l-4 border-transparent"
                          }`}
                        >
                          {getSidebarIcon(item.id)}
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <a href="/instructor" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[#060708] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            Portal Dosen / Pengajar
          </a>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <span className="font-heading text-sm font-semibold text-[#060708]">{code}</span>
        </header>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-[#060708] text-white"
              : "bg-[#CF3A1F] text-white"
          }`}>
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />
            }
            {toast.message}
          </div>
        )}

        {/* Main workspace area (Right) */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9FB]">
            <div className="flex flex-1 flex-col gap-6 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#C6B5BF]" />
                </div>
              ) : !course ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertCircle className="h-12 w-12 text-[#CF3A1F] mb-4" />
                  <h3 className="font-heading text-xl font-bold text-[#060708]">Mata Kuliah Tidak Ditemukan</h3>
                  <p className="text-sm text-muted-foreground mt-2">Kode mata kuliah <strong>{code}</strong> tidak ada.</p>
                  <a href="/instructor">
                    <Button variant="outline" className="mt-4 border-[#C6B5BF]">Kembali ke Portal</Button>
                  </a>
                </div>
              ) : (
                <>
                  {activeView === 'outline' && (
                    <>
                      {/* ── Course Cover Banner ───────────────────────── */}
                      {(() => {
                        const palette = getCoverPalette(course.code)
                        const totalActivities = sortedModules.reduce((acc, m) => acc + (m.subchapters?.length ?? 0), 0)
                        return (
                          <div
                            className="relative rounded-2xl overflow-hidden shadow-md"
                            style={{ background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 60%, ${palette[2]} 100%)` }}
                          >
                            {/* dot pattern overlay */}
                            <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
                            <div className="relative z-10 p-7">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                                      {course.code}
                                    </span>
                                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                                      {course.department}
                                    </span>
                                    {course.is_premium && (
                                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#CF3A1F] text-white shadow-sm">
                                        PREMIUM
                                      </span>
                                    )}
                                  </div>
                                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-sm">
                                    {course.title}
                                  </h1>
                                  {course.description && (
                                    <p className="text-sm text-white/60 leading-relaxed line-clamp-2 max-w-2xl">
                                      {course.description}
                                    </p>
                                  )}
                                </div>
                                {/* Instructor Avatar */}
                                <div className="shrink-0 hidden sm:flex flex-col items-center gap-2">
                                  <div className="h-14 w-14 rounded-full bg-white/20 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                    <span className="font-heading text-xl font-bold text-white">
                                      {((course as any).instructor_name || 'IN').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-white/60 font-medium text-center max-w-[100px] truncate">
                                    {(course as any).instructor_name || 'Instruktur'}
                                  </span>
                                </div>
                              </div>

                              {/* Stats Row */}
                              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/15 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-white/50" />
                                  <span className="text-sm font-bold text-white">{sortedModules.length}</span>
                                  <span className="text-xs text-white/50">Modul</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <PlayCircle className="h-3.5 w-3.5 text-white/50" />
                                  <span className="text-sm font-bold text-white">{totalActivities}</span>
                                  <span className="text-xs text-white/50">Aktivitas</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-white">{course.sks} SKS</span>
                                  <span className="text-xs text-white/50">· Semester {course.semester}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 backdrop-blur-sm capitalize">
                                    {(course as any).level || 'Beginner'}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors cursor-pointer backdrop-blur-sm flex items-center gap-1"
                                    onClick={() => window.open(`/courses/${course.code}`, '_blank')}
                                  >
                                    <Eye className="h-3 w-3" /> Preview
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* ── Modules Section ──────────────────────────── */}
                      <div className="space-y-3">
                        {/* Header row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-heading text-lg font-bold text-[#060708]">Course Outline</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sortedModules.length} modul · {sortedModules.reduce((acc, m) => acc + (m.subchapters?.length ?? 0), 0)} aktivitas
                            </p>
                          </div>
                          <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                              <Button className="bg-[#060708] hover:bg-[#060708]/80 text-white gap-1.5 h-9 px-4 text-xs font-semibold">
                                <Plus className="h-3.5 w-3.5" /> Tambah Modul
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-white">
                              <DialogHeader>
                                <DialogTitle className="font-heading text-xl text-[#060708]">Tambah Modul Baru</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleAddModule} className="space-y-4 mt-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold">Judul Modul</Label>
                                  <Input
                                    placeholder="cth: Pengantar Logika Matematika"
                                    value={addForm.title}
                                    onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold">Deskripsi</Label>
                                  <Textarea
                                    placeholder="Deskripsi materi modul..."
                                    value={addForm.description}
                                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold">Urutan Modul</Label>
                                  <Input
                                    type="number" min={1}
                                    value={addForm.order}
                                    onChange={e => setAddForm(f => ({ ...f, order: parseInt(e.target.value) }))}
                                    required
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  className="w-full bg-[#060708] hover:bg-[#060708]/80 text-white"
                                  disabled={addLoading}
                                >
                                  {addLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                  {addLoading ? 'Menyimpan...' : 'Tambah Modul'}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {sortedModules.length === 0 ? (
                          /* Empty State */
                          <div
                            className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#C6B5BF]/50 rounded-2xl bg-white text-center cursor-pointer hover:border-[#C6B5BF] hover:bg-[#FAF9FB] transition-all group"
                            onClick={() => setAddOpen(true)}
                          >
                            <div className="h-14 w-14 rounded-2xl bg-[#060708]/5 flex items-center justify-center mb-4 group-hover:bg-[#060708]/10 transition-colors">
                              <Plus className="h-7 w-7 text-[#060708]/30 group-hover:text-[#060708]/60" />
                            </div>
                            <p className="font-heading text-base font-semibold text-[#060708]">Tambah Modul Pertama</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">Klik di sini untuk mulai membangun silabus dan course outline kelas Anda.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sortedModules.map((mod, modIdx) => {
                              const isExpanded = expandedModuleId === mod.id
                              const subchapters = mod.subchapters || []
                              const moduleNum = String(modIdx + 1).padStart(2, '0')
                              const videoCount = subchapters.filter(s => s.type === 'video').length
                              const readingCount = subchapters.filter(s => s.type === 'reading').length
                              const quizCount = subchapters.filter(s => s.type === 'quiz').length

                              return (
                                <div
                                  key={mod.id}
                                  className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 ${
                                    isExpanded
                                      ? 'border-[#060708]/25 shadow-md'
                                      : 'border-[#E8E5E9] hover:border-[#C6B5BF] shadow-sm'
                                  }`}
                                >
                                  {editId === mod.id ? (
                                    /* Inline Edit Form */
                                    <div className="p-4">
                                      <form onSubmit={handleUpdateModule} className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                          <div className="col-span-2 space-y-1">
                                            <Label className="text-xs font-semibold">Judul Modul</Label>
                                            <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Urutan</Label>
                                            <Input type="number" min={1} value={editForm.order} onChange={e => setEditForm(f => ({ ...f, order: parseInt(e.target.value) }))} required />
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs font-semibold">Deskripsi</Label>
                                          <Textarea rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button type="submit" size="sm" className="bg-[#060708] hover:bg-[#060708]/80 text-white text-xs cursor-pointer" disabled={editLoading}>
                                            {editLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                            Simpan
                                          </Button>
                                          <Button type="button" size="sm" variant="outline" className="text-xs cursor-pointer" onClick={cancelEditModule}>
                                            Batal
                                          </Button>
                                        </div>
                                      </form>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Module Header Row */}
                                      <div
                                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors ${
                                          isExpanded
                                            ? 'bg-[#060708] text-white'
                                            : 'bg-white hover:bg-slate-50/80'
                                        }`}
                                        onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                                      >
                                        {/* Number Badge */}
                                        <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center font-heading text-sm font-bold border transition-colors ${
                                          isExpanded
                                            ? 'bg-white/15 border-white/25 text-white'
                                            : 'bg-[#FAF9FB] border-[#E8E5E9] text-[#060708]'
                                        }`}>
                                          {moduleNum}
                                        </div>

                                        {/* Title + Description */}
                                        <div className="flex-1 min-w-0">
                                          <h3 className={`font-heading font-semibold leading-tight text-sm ${
                                            isExpanded ? 'text-white' : 'text-[#060708]'
                                          }`}>
                                            {mod.title}
                                          </h3>
                                          {mod.description && (
                                            <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                                              isExpanded ? 'text-white/55' : 'text-muted-foreground'
                                            }`}>{mod.description}</p>
                                          )}
                                        </div>

                                        {/* Activity chips */}
                                        {subchapters.length > 0 && (
                                          <div className={`hidden sm:flex items-center gap-2 text-[10px] font-bold flex-shrink-0`}>
                                            {videoCount > 0 && (
                                              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                                                isExpanded ? 'bg-white/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                              }`}>
                                                <PlayCircle className="h-2.5 w-2.5" /> {videoCount}
                                              </span>
                                            )}
                                            {readingCount > 0 && (
                                              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                                                isExpanded ? 'bg-white/15 text-sky-300' : 'bg-sky-50 text-sky-700 border border-sky-100'
                                              }`}>
                                                <FileText className="h-2.5 w-2.5" /> {readingCount}
                                              </span>
                                            )}
                                            {quizCount > 0 && (
                                              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                                                isExpanded ? 'bg-white/15 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                              }`}>
                                                <HelpCircle className="h-2.5 w-2.5" /> {quizCount}
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Chevron */}
                                        {isExpanded
                                          ? <ChevronUp className="h-4 w-4 text-white/50 shrink-0" />
                                          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                        }

                                        {/* Context Menu — stop propagation so click doesn't expand */}
                                        <div onClick={e => e.stopPropagation()}>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger
                                              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent ${
                                                isExpanded
                                                  ? 'hover:bg-white/20 text-white/60'
                                                  : 'hover:bg-slate-100 text-slate-400'
                                              }`}
                                            >
                                              <MoreVertical className="h-3.5 w-3.5" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 text-xs">
                                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1.5">
                                                Modul {moduleNum}
                                              </DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => startEditModule(mod)}>
                                                <Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Judul & Deskripsi
                                              </DropdownMenuItem>
                                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => window.open(`/courses/${course.code}`, '_blank')}>
                                                <Eye className="h-3.5 w-3.5 text-slate-500" /> Preview di Halaman Mahasiswa
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => { openAddSubchapter(mod.id, 'video'); setExpandedModuleId(mod.id) }}>
                                                <PlayCircle className="h-3.5 w-3.5 text-emerald-600" /> Tambah Video
                                              </DropdownMenuItem>
                                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => { openAddSubchapter(mod.id, 'reading'); setExpandedModuleId(mod.id) }}>
                                                <FileText className="h-3.5 w-3.5 text-sky-600" /> Tambah Materi Bacaan
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                className="cursor-pointer gap-2 text-xs"
                                                onClick={() => handleOpenQuizEditor(mod.id)}
                                                disabled={!!quizLoading[mod.id]}
                                              >
                                                <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> Kelola Evaluasi / Quiz
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                className="cursor-pointer gap-2 text-xs text-[#CF3A1F] focus:text-[#CF3A1F]"
                                                onClick={() => handleGenerateQuiz(mod.id)}
                                                disabled={!!quizLoading[mod.id]}
                                              >
                                                <Sparkles className="h-3.5 w-3.5" /> Generate Quiz dengan AI
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                                onClick={() => handleDeleteModule(mod.id)}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" /> Hapus Modul
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>

                                      {/* Expanded Subchapters Panel */}
                                      {isExpanded && (
                                        <div className="border-t border-[#060708]/10 bg-[#FAF9FB] animate-in slide-in-from-top-2 duration-200">
                                          {/* Subchapter list */}
                                          <div className="p-3 space-y-1.5">
                                            {subchapters.length === 0 ? (
                                              <p className="text-xs text-muted-foreground text-center py-6">
                                                Belum ada aktivitas. Gunakan tombol di bawah untuk menambahkan materi.
                                              </p>
                                            ) : (
                                              subchapters.map((sub) => (
                                                <div
                                                  key={sub.id}
                                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#E8E5E9] bg-white hover:border-slate-300 hover:shadow-sm transition-all group/sub text-xs"
                                                >
                                                  {/* Type icon badge */}
                                                  <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                                                    sub.type === 'video' ? 'bg-emerald-50 border border-emerald-100' :
                                                    sub.type === 'reading' ? 'bg-sky-50 border border-sky-100' :
                                                    sub.type === 'quiz' ? 'bg-amber-50 border border-amber-100' :
                                                    'bg-purple-50 border border-purple-100'
                                                  }`}>
                                                    {sub.type === 'video' && <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />}
                                                    {sub.type === 'reading' && <FileText className="h-3.5 w-3.5 text-sky-600" />}
                                                    {sub.type === 'quiz' && <HelpCircle className="h-3.5 w-3.5 text-amber-500" />}
                                                    {sub.type === 'forum' && <MessageSquare className="h-3.5 w-3.5 text-purple-500" />}
                                                  </div>

                                                  {/* Title + meta */}
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[#060708] truncate">{sub.title}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
                                                      {sub.type} · {sub.duration} · #{sub.order}
                                                    </p>
                                                  </div>

                                                  {/* Row actions (visible on hover) */}
                                                  <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                                                    {sub.type !== 'forum' && (
                                                      <button
                                                        type="button"
                                                        title={sub.type === 'quiz' ? "Edit kuis" : "Edit materi"}
                                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                          if (sub.type === 'quiz') {
                                                            handleOpenQuizEditor(mod.id)
                                                          } else {
                                                            openEditSubchapter(sub)
                                                          }
                                                        }}
                                                      >
                                                        <Pencil className="h-3 w-3 text-slate-500" />
                                                      </button>
                                                    )}
                                                    {typeof sub.id === 'number' && (
                                                      <button
                                                        type="button"
                                                        title="Hapus"
                                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 cursor-pointer transition-colors"
                                                        onClick={() => handleDeleteSubChapter(sub)}
                                                      >
                                                        <Trash className="h-3 w-3 text-destructive" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>

                                          {/* Add Activity Action Bar */}
                                          <div className="px-3 pb-3 pt-2 flex items-center gap-2 flex-wrap border-t border-[#E8E5E9]">
                                            <button
                                              type="button"
                                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#C6B5BF] bg-white text-xs font-semibold text-[#060708] hover:border-[#060708] hover:bg-[#060708] hover:text-white transition-all cursor-pointer"
                                              onClick={() => openAddSubchapter(mod.id, 'video')}
                                            >
                                              <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                                              + Video
                                            </button>
                                            <button
                                              type="button"
                                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#C6B5BF] bg-white text-xs font-semibold text-[#060708] hover:border-[#060708] hover:bg-[#060708] hover:text-white transition-all cursor-pointer"
                                              onClick={() => openAddSubchapter(mod.id, 'reading')}
                                            >
                                              <FileText className="h-3.5 w-3.5 text-sky-500" />
                                              + Materi
                                            </button>
                                            <button
                                              type="button"
                                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#C6B5BF] bg-white text-xs font-semibold text-[#060708] hover:border-[#060708] hover:bg-[#060708] hover:text-white transition-all cursor-pointer"
                                              onClick={() => handleOpenQuizEditor(mod.id)}
                                              disabled={!!quizLoading[mod.id]}
                                            >
                                              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                                              + Evaluasi
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )
                            })}

                            {/* Footer: Add Module */}
                            <button
                              type="button"
                              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-[#C6B5BF]/50 text-xs font-semibold text-slate-400 hover:border-[#060708]/40 hover:text-[#060708] hover:bg-white transition-all cursor-pointer"
                              onClick={() => setAddOpen(true)}
                            >
                              <Plus className="h-4 w-4" />
                              Tambah Modul Baru
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeView === 'general' && (
                    <div className="space-y-6 max-w-5xl">
                      {/* Header Zone */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">General</h1>
                            <HelpCircle className="h-4 w-4 text-slate-400 hover:text-primary cursor-help" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Set basic information for your course page.</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => window.open(`/courses/${course.code}`, '_blank')}
                            className="h-9 px-4 text-xs font-semibold border-[#C6B5BF] hover:bg-[#C6B5BF]/10 text-primary cursor-pointer rounded-lg"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            onClick={handleSaveCourseSettings}
                            disabled={settingsSaving}
                            className="h-9 px-5 text-xs font-bold bg-[#060708] hover:bg-[#060708]/90 text-white cursor-pointer rounded-lg shadow-sm"
                          >
                            {settingsSaving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1.5" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Tabs selector */}
                      <div className="flex border-b border-[#E8E5E9] select-none">
                        <button
                          type="button"
                          onClick={() => setSettingsTab('details')}
                          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            settingsTab === 'details'
                              ? 'border-[#060708] text-[#060708]'
                              : 'border-transparent text-slate-400 hover:text-slate-655'
                          }`}
                        >
                          Course Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsTab('notifications')}
                          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            settingsTab === 'notifications'
                              ? 'border-[#060708] text-[#060708]'
                              : 'border-transparent text-slate-400 hover:text-slate-655'
                          }`}
                        >
                          Course Notification
                        </button>
                      </div>

                      {/* Tab contents */}
                      {settingsTab === 'details' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          {/* Left Column (Course Card Preview) */}
                          <div className="lg:col-span-4 space-y-3 sticky top-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Card Preview</h3>
                            
                            <Card className="bg-white border border-[#E8E5E9] rounded-2xl overflow-hidden shadow-xs">
                              {/* Simulated Thumbnail */}
                              <div className="relative aspect-video bg-[#060708] flex items-center justify-center p-4">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FAF9FB_1px,transparent_1px)] [background-size:16px_16px]" />
                                
                                <div className="z-10 text-center">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#C6B5BF] block mb-1">
                                    {generalForm.category || "Design"}
                                  </span>
                                  <h4 className="font-heading text-sm font-bold text-white line-clamp-2 px-4 leading-snug">
                                    {generalForm.title || "Untitled Course"}
                                  </h4>
                                </div>
                                
                                {generalForm.is_premium && (
                                  <Badge className="absolute top-3 right-3 bg-[#CF3A1F] hover:bg-[#CF3A1F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border-none">
                                    PREMIUM
                                  </Badge>
                                )}
                              </div>
                              
                              <CardContent className="p-4 space-y-3 font-sans">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border">
                                      {generalForm.code || "CODE"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{generalForm.department || "No Department"}</span>
                                  </div>
                                  <h4 className="font-heading text-sm font-bold text-[#060708] line-clamp-1">
                                    {generalForm.title || "Untitled Course"}
                                  </h4>
                                </div>
                                
                                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-2">
                                  <span>{generalForm.sks} SKS</span>
                                  <span>Semester {generalForm.semester}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-[11px] font-bold border-t border-slate-100 pt-2">
                                  <span className="text-slate-400 font-normal">Pengajar: <span className="text-slate-700 font-semibold">{generalForm.instructor_name || "Tony Stark"}</span></span>
                                  <span className="text-[#060708] font-bold">
                                    {generalForm.is_premium ? `Rp ${Number(generalForm.price).toLocaleString('id-ID')}` : "Gratis"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <div className="p-4 rounded-xl border border-[#C6B5BF]/40 bg-[#FAF9FB]/70 text-[10px] text-slate-500 font-sans leading-relaxed">
                              💡 <strong>Pratinjau Real-time:</strong> Tampilan di atas menunjukkan bagaimana kartu mata kuliah ini akan tampil pada katalog pencarian mahasiswa di platform Belajara.
                            </div>
                          </div>

                          {/* Right Column (Form fields) */}
                          <div className="lg:col-span-8">
                            <Card className="bg-white border border-[#E8E5E9] rounded-2xl shadow-xs">
                              <CardContent className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                  <Label htmlFor="course-title" className="text-xs font-semibold text-primary">Course Title</Label>
                                  <Input
                                    id="course-title"
                                    value={generalForm.title}
                                    onChange={e => setGeneralForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="cth: UI/UX Mastery Design"
                                    className="bg-white border border-border rounded-lg text-xs"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-code" className="text-xs font-semibold text-primary">Course Code (Read-Only)</Label>
                                    <Input
                                      id="course-code"
                                      value={generalForm.code}
                                      disabled
                                      className="bg-slate-50 border border-border rounded-lg text-xs cursor-not-allowed text-slate-450"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-category" className="text-xs font-semibold text-primary">Category</Label>
                                    <select
                                      id="course-category"
                                      value={generalForm.category}
                                      onChange={e => setGeneralForm(f => ({ ...f, category: e.target.value }))}
                                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-primary focus:outline-none cursor-pointer h-9"
                                    >
                                      <option value="Design">Design</option>
                                      <option value="Informatika">Informatika</option>
                                      <option value="Sains Data">Sains Data</option>
                                      <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                                      <option value="Sistem Informasi">Sistem Informasi</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-sks" className="text-xs font-semibold text-primary">SKS</Label>
                                    <Input
                                      id="course-sks"
                                      type="number"
                                      min={1}
                                      max={6}
                                      value={generalForm.sks}
                                      onChange={e => setGeneralForm(f => ({ ...f, sks: Number(e.target.value) || 1 }))}
                                      className="bg-white border border-border rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-semester" className="text-xs font-semibold text-primary">Semester</Label>
                                    <Input
                                      id="course-semester"
                                      type="number"
                                      min={1}
                                      max={8}
                                      value={generalForm.semester}
                                      onChange={e => setGeneralForm(f => ({ ...f, semester: Number(e.target.value) || 1 }))}
                                      className="bg-white border border-border rounded-lg text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-dept" className="text-xs font-semibold text-primary">Department</Label>
                                    <Input
                                      id="course-dept"
                                      value={generalForm.department}
                                      onChange={e => setGeneralForm(f => ({ ...f, department: e.target.value }))}
                                      placeholder="cth: Informatika"
                                      className="bg-white border border-border rounded-lg text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="course-instructor" className="text-xs font-semibold text-primary">Instructor Name</Label>
                                    <Input
                                      id="course-instructor"
                                      value={generalForm.instructor_name}
                                      onChange={e => setGeneralForm(f => ({ ...f, instructor_name: e.target.value }))}
                                      placeholder="cth: Tony Stark"
                                      className="bg-white border border-border rounded-lg text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="course-email" className="text-xs font-semibold text-primary">Instructor Email</Label>
                                  <Input
                                    id="course-email"
                                    type="email"
                                    value={generalForm.instructor_email}
                                    onChange={e => setGeneralForm(f => ({ ...f, instructor_email: e.target.value }))}
                                    placeholder="cth: instructor@belajara.id"
                                    className="bg-white border border-border rounded-lg text-xs"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="course-description" className="text-xs font-semibold text-primary">Course Description</Label>
                                  <Textarea
                                    id="course-description"
                                    rows={4}
                                    value={generalForm.description}
                                    onChange={e => setGeneralForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Deskripsi lengkap mengenai mata kuliah..."
                                    className="bg-white border border-border rounded-lg text-xs"
                                  />
                                </div>

                                <div className="border-t pt-4 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="course-premium"
                                      checked={generalForm.is_premium}
                                      onChange={e => setGeneralForm(f => ({ ...f, is_premium: e.target.checked }))}
                                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                    />
                                    <Label htmlFor="course-premium" className="text-xs font-bold text-primary cursor-pointer select-none">
                                      Aktifkan Akses Premium (Kelas Terverifikasi)
                                    </Label>
                                  </div>
                                  
                                  {generalForm.is_premium && (
                                    <div className="space-y-1.5 animate-in fade-in duration-200">
                                      <Label htmlFor="course-price" className="text-xs font-semibold text-primary">Harga Kelas (IDR) *</Label>
                                      <Input
                                        id="course-price"
                                        type="number"
                                        min={0}
                                        value={generalForm.price}
                                        onChange={e => setGeneralForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                                        placeholder="Harga dalam Rupiah"
                                        className="bg-white border border-border rounded-lg text-xs"
                                      />
                                      <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                                        Mahasiswa harus melakukan pembayaran via Midtrans sebesar nominal ini untuk mengakses modul premium.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <Card className="bg-white border border-[#E8E5E9] rounded-2xl shadow-xs">
                          <CardHeader>
                            <CardTitle className="font-heading text-sm font-bold text-[#060708]">Course Notification Settings</CardTitle>
                            <CardDescription className="text-xs">Kelola notifikasi otomatis yang dikirimkan ke mahasiswa maupun pengajar.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 font-sans text-xs">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id="notif-complete"
                                  defaultChecked
                                  className="h-4 w-4 text-[#060708] border-gray-300 rounded focus:ring-primary cursor-pointer mt-0.5"
                                />
                                <div>
                                  <Label htmlFor="notif-complete" className="font-semibold text-primary cursor-pointer">Kirim email ucapan selamat saat kelulusan kelas</Label>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                                    Sistem secara otomatis mengirim email ke mahasiswa ketika mereka berhasil menyelesaikan seluruh kuis evaluasi dengan passing grade.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3 border-t pt-3">
                                <input
                                  type="checkbox"
                                  id="notif-forum"
                                  defaultChecked
                                  className="h-4 w-4 text-[#060708] border-gray-300 rounded focus:ring-primary cursor-pointer mt-0.5"
                                />
                                <div>
                                  <Label htmlFor="notif-forum" className="font-semibold text-primary cursor-pointer">Notifikasi forum diskusi baru untuk Dosen</Label>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                                    Kirim notifikasi email ke email pengajar ({generalForm.instructor_email || "tonystark@lms.com"}) setiap kali ada mahasiswa memulai diskusi baru.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 border-t pt-3">
                                <input
                                  type="checkbox"
                                  id="notif-weekly"
                                  className="h-4 w-4 text-[#060708] border-gray-300 rounded focus:ring-primary cursor-pointer mt-0.5"
                                />
                                <div>
                                  <Label htmlFor="notif-weekly" className="font-semibold text-primary cursor-pointer">Laporan mingguan kemajuan mahasiswa (Weekly Digest)</Label>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                                    Kirim ringkasan mingguan berisi data aktivitas belajar mahasiswa dan rata-rata skor kuis mereka.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Access View */}
                  {activeView === 'access' && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">Pengaturan Akses Kelas</h1>
                            <Lock className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Kelola visibilitas, status premium, dan batasan pendaftaran peserta.</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveCourseSettings}
                          disabled={settingsSaving}
                          className="h-9 px-5 text-xs font-bold bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg shadow-sm cursor-pointer"
                        >
                          {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                          Simpan Akses
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Keanggotaan & Batasan</CardTitle>
                            <CardDescription className="text-[11px]">Tentukan tipe hak akses dan kuota mahasiswa.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="access-premium" className="font-bold text-xs text-primary cursor-pointer">Status Akses Premium</Label>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  Hanya mahasiswa premium yang dapat mengakses seluruh modul. Mahasiswa biasa hanya bisa melakukan audit.
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                id="access-premium"
                                checked={generalForm.is_premium}
                                onChange={e => setGeneralForm(prev => ({ ...prev, is_premium: e.target.checked }))}
                                className="h-4 w-4 text-[#060708] border-gray-300 rounded focus:ring-primary cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between border-b pb-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="access-audit" className="font-bold text-xs text-primary cursor-pointer">Izinkan Mode Audit Gratis</Label>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  Izinkan mahasiswa mempelajari sebagian materi secara gratis tanpa memperoleh sertifikat kelulusan.
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                id="access-audit"
                                defaultChecked={true}
                                className="h-4 w-4 text-[#060708] border-gray-300 rounded focus:ring-primary cursor-pointer"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Batas Kuota Kelas (Mahasiswa)</Label>
                                <Input
                                  type="number"
                                  defaultValue={150}
                                  placeholder="Contoh: 150"
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Metode Seleksi Peserta</Label>
                                <select className="w-full text-xs border rounded-md p-2 bg-white">
                                  <option value="auto">Penerimaan Otomatis</option>
                                  <option value="review">Peninjauan Manual</option>
                                </select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-[#E8E5E9] h-fit">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Status & Visibilitas</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>Status: Publik (Terbit)</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Mahasiswa dapat menemukan kelas ini di halaman eksplorasi.</p>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Ubah Status Kelas</Label>
                                <select 
                                  value={generalForm.price === 0 && !generalForm.is_premium ? "draft" : "public"} 
                                  onChange={() => {}}
                                  className="w-full text-xs border rounded-md p-2 bg-white"
                                >
                                  <option value="public">Publikasikan Ke Semua</option>
                                  <option value="draft">Simpan Sebagai Draf</option>
                                  <option value="private">Privat (Hanya Undangan)</option>
                                </select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Pricing View */}
                  {activeView === 'pricing' && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">Pengaturan Harga Kelas</h1>
                            <DollarSign className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Konfigurasikan nilai komersial kelas Anda serta diskon kupon aktif.</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveCourseSettings}
                          disabled={settingsSaving}
                          className="h-9 px-5 text-xs font-bold bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg shadow-sm cursor-pointer"
                        >
                          {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                          Simpan Harga
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Skema Tarif Kelas</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Mata Uang</Label>
                                <select className="w-full text-xs border rounded-md p-2 bg-white">
                                  <option value="IDR">Rupiah Indonesia (IDR)</option>
                                  <option value="USD">Dolar AS (USD)</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Harga Jual (Rp)</Label>
                                <Input
                                  type="number"
                                  value={generalForm.price}
                                  onChange={e => setGeneralForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                  placeholder="cth: 150000"
                                  className="text-xs font-mono"
                                />
                              </div>
                            </div>

                            <div className="bg-[#FAF9FB] p-3 rounded-lg border border-slate-100 flex items-start gap-2.5">
                              <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                Apabila status akses kelas diset ke Premium, Anda wajib mencantumkan harga jual di atas Rp 0 agar mahasiswa dapat melakukan transaksi melalui gerbang pembayaran Midtrans.
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Kupon Diskon Aktif</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <form onSubmit={handleAddCoupon} className="flex gap-2">
                              <Input
                                placeholder="KODE"
                                value={newCouponCode}
                                onChange={e => setNewCouponCode(e.target.value)}
                                className="text-xs"
                                required
                              />
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={newCouponDiscount}
                                onChange={e => setNewCouponDiscount(Number(e.target.value))}
                                className="text-xs w-16"
                                required
                              />
                              <Button type="submit" size="sm" className="bg-[#060708] text-white">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </form>

                            <div className="space-y-2 mt-2">
                              {coupons.map(coupon => (
                                <div key={coupon.code} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50 text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-mono font-bold text-slate-800">{coupon.code}</span>
                                    <span className="text-[9px] text-slate-400">Potongan {coupon.discount}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      type="button"
                                      onClick={() => handleToggleCoupon(coupon.code)}
                                      className={`h-5 px-2 rounded text-[9px] font-bold ${coupon.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                                    >
                                      {coupon.active ? "Aktif" : "Non-aktif"}
                                    </button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteCoupon(coupon.code)}
                                      className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive cursor-pointer"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* User Progress View */}
                  {activeView === 'progress' && (
                    <div className="space-y-6 max-w-5xl mx-auto w-full">
                      <div className="flex items-center justify-between border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">Kemajuan Belajar Mahasiswa</h1>
                            <Activity className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Pantau performa, riwayat login, dan penyelesaian sub-bab per mahasiswa.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Peserta Terdaftar</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">142 Mahasiswa</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">85% Full Credit &bull; 15% Audit</p>
                        </div>
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Aktif Hari Ini</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">18 Mahasiswa</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Sedang mengakses materi pembelajaran</p>
                        </div>
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Kemajuan Kelas</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">68.5%</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Mata kuliah terselesaikan rata-rata</p>
                        </div>
                      </div>

                      <Card className="bg-white border border-[#E8E5E9]">
                        <CardHeader className="p-4 flex flex-row items-center justify-between border-b">
                          <CardTitle className="text-sm font-bold text-[#060708]">Daftar Partisipan</CardTitle>
                          <Input placeholder="Cari mahasiswa..." className="text-xs max-w-xs h-8" />
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b text-slate-500 text-left font-semibold">
                                  <th className="p-3">Nama Lengkap</th>
                                  <th className="p-3">NIM</th>
                                  <th className="p-3">Mode Belajar</th>
                                  <th className="p-3">Kemajuan Pembelajaran</th>
                                  <th className="p-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {[
                                  { name: "Budi Santoso", nim: "2201010101", mode: "Full Credit", progress: 75, date: "Hari ini" },
                                  { name: "Siti Rahma", nim: "2201010102", mode: "Full Credit", progress: 100, date: "2 jam lalu" },
                                  { name: "Rian Hidayat", nim: "2201010103", mode: "Audit", progress: 50, date: "Kemarin" },
                                  { name: "Amanda Wijaya", nim: "2201010104", mode: "Full Credit", progress: 25, date: "3 hari lalu" },
                                  { name: "Farhan Alamsyah", nim: "2201010105", mode: "Audit", progress: 0, date: "1 minggu lalu" },
                                ].map((student, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-primary">{student.name}</td>
                                    <td className="p-3 font-mono text-slate-500">{student.nim}</td>
                                    <td className="p-3">
                                      <Badge variant="outline" className={student.mode === "Full Credit" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                                        {student.mode}
                                      </Badge>
                                    </td>
                                    <td className="p-3 w-1/3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div className="bg-[#060708] h-full" style={{ width: `${student.progress}%` }} />
                                        </div>
                                        <span className="font-bold text-[10px]">{student.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-right">
                                      <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-slate-100 cursor-pointer">Hubungi</Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Quiz Gradebook View */}
                  {activeView === 'gradebook' && (
                    <div className="space-y-6 max-w-5xl mx-auto w-full">
                      <div className="flex items-center justify-between border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">Quiz Gradebook</h1>
                            <FileSpreadsheet className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Daftar rekapitulasi penilaian kuis mandiri setiap modul pelajaran.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Nilai Kelas</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">79.2 / 100</h3>
                        </div>
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Rasio Kelulusan (&gt;60)</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">92.4%</h3>
                        </div>
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tertinggi</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">100</h3>
                        </div>
                        <div className="bg-white border rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Terendah</span>
                          <h3 className="font-heading text-2xl font-bold text-[#060708] mt-1">45</h3>
                        </div>
                      </div>

                      <Card className="bg-white border border-[#E8E5E9]">
                        <CardHeader className="p-4 border-b">
                          <CardTitle className="text-sm font-bold text-[#060708]">Matriks Penilaian Kuis</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-50 border-b text-slate-500 font-semibold">
                                  <th className="p-3">Mahasiswa</th>
                                  {course.modules?.map((mod, i) => (
                                    <th key={mod.id} className="p-3">Kuis M{i + 1}</th>
                                  ))}
                                  <th className="p-3">Rata-rata</th>
                                  <th className="p-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {[
                                  { name: "Budi Santoso", scores: [85, 90, 70, 80] },
                                  { name: "Siti Rahma", scores: [95, 100, 90, 95] },
                                  { name: "Rian Hidayat", scores: [70, 80, 0, 0] },
                                  { name: "Amanda Wijaya", scores: [60, 0, 0, 0] },
                                  { name: "Farhan Alamsyah", scores: [0, 0, 0, 0] },
                                ].map((student, idx) => {
                                  const modulesCount = course.modules?.length || 0
                                  const sliceScores = student.scores.slice(0, modulesCount)
                                  const completedScores = sliceScores.filter(s => s > 0)
                                  const avg = completedScores.length > 0 
                                    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length) 
                                    : 0
                                  const isPass = avg >= 60

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="p-3 font-semibold text-primary">{student.name}</td>
                                      {sliceScores.map((score, sIdx) => (
                                        <td key={sIdx} className="p-3">
                                          {score > 0 ? (
                                            <Badge variant="outline" className={`font-mono ${
                                              score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                              score >= 60 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                              "bg-red-50 text-red-700 border-red-200"
                                            }`}>
                                              {score}
                                            </Badge>
                                          ) : (
                                            <span className="text-slate-400 font-semibold font-mono">-</span>
                                          )}
                                        </td>
                                      ))}
                                      <td className="p-3 font-bold font-mono">{avg > 0 ? avg : "-"}</td>
                                      <td className="p-3">
                                        {avg > 0 ? (
                                          <Badge className={isPass ? "bg-[#060708] text-white hover:bg-[#060708]/80 border-none" : "bg-[#CF3A1F] text-white hover:bg-[#CF3A1F]/80 border-none"}>
                                            {isPass ? "Lulus" : "Mengulang"}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-slate-400 border-slate-300">Belum Uji</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Forum/Moderation View */}
                  {activeView === 'reviews' && (
                    <div className="space-y-6 max-w-6xl mx-auto w-full">
                      <div className="flex items-center justify-between border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">Forum Moderasi & Diskusi</h1>
                            <MessageSquare className="h-5 w-5 text-slate-500" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Interaksi langsung dengan mahasiswa, jawab pertanyaan, dan moderasi pesan kotor.</p>
                        </div>
                      </div>

                      {forumLoading ? (
                        <div className="flex justify-center items-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin text-[#C6B5BF]" />
                        </div>
                      ) : forumPosts.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-[#E8E5E9] rounded-2xl">
                          <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <h3 className="font-heading text-lg font-bold text-primary mb-1">Tidak Ada Diskusi</h3>
                          <p className="text-xs text-muted-foreground">Belum ada mahasiswa yang mengajukan diskusi/pertanyaan di kelas ini.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                          {/* Thread list (Left) */}
                          <div className="md:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Daftar Pertanyaan</h3>
                            {forumPosts.map(post => (
                              <button
                                key={post.id}
                                onClick={() => setActivePost(post)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                  activePost?.id === post.id 
                                    ? "bg-white border-[#060708] shadow-sm" 
                                    : "bg-white/60 border-[#E8E5E9] hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Badge className="bg-[#C6B5BF]/20 text-[#060708] border border-[#C6B5BF]/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    {post.author?.role || "Mahasiswa"}
                                  </Badge>
                                  <span className="text-[10px] text-slate-400 font-semibold">{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                                <h4 className="font-semibold text-xs text-[#060708] line-clamp-1">{post.title}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{post.content}</p>
                                <div className="flex items-center justify-between border-t mt-3 pt-2 text-[10px] text-slate-400">
                                  <span>Oleh: <span className="font-semibold text-slate-700">{post.author?.name}</span></span>
                                  <span className="font-semibold">{post.replies?.length || 0} Tanggapan</span>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Selected Thread details (Right) */}
                          <div className="md:col-span-7">
                            {activePost ? (
                              <div className="space-y-4">
                                <Card className="bg-white border border-[#E8E5E9]">
                                  <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-[#C6B5BF]/20 flex items-center justify-center font-bold text-xs text-[#060708] border border-[#C6B5BF]/30">
                                        {activePost.author?.avatar || "M"}
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-primary">{activePost.author?.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-semibold">{activePost.author?.role} &bull; {new Date(activePost.created_at).toLocaleDateString('id-ID')}</p>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeletePost(activePost.id)}
                                      className="text-xs text-[#CF3A1F] hover:bg-[#CF3A1F]/10 cursor-pointer h-8 gap-1.5"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                      Hapus Utas
                                    </Button>
                                  </CardHeader>
                                  <CardContent className="p-4 space-y-4">
                                    <div>
                                      <h3 className="font-heading text-sm font-bold text-[#060708] mb-1.5">{activePost.title}</h3>
                                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{activePost.content}</p>
                                    </div>

                                    {/* Timeline of replies */}
                                    <div className="space-y-3 pt-3 border-t">
                                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Tanggapan Diskusi</h4>
                                      {(activePost.replies || []).length === 0 ? (
                                        <p className="text-[10px] text-slate-400 italic">Belum ada balasan. Jadilah yang pertama menjawab!</p>
                                      ) : (
                                        <div className="space-y-3">
                                          {(activePost.replies || []).map((reply: any) => (
                                            <div key={reply.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-bold text-[10px] text-slate-800">{reply.author?.name}</span>
                                                  <Badge className={reply.author?.role === "Dosen Pengampu" ? "bg-purple-100 text-purple-800 border-none text-[8px]" : "bg-slate-200 text-slate-700 border-none text-[8px]"}>
                                                    {reply.author?.role}
                                                  </Badge>
                                                </div>
                                                <span className="text-[8px] text-slate-400 font-semibold">{new Date(reply.created_at).toLocaleDateString('id-ID')}</span>
                                              </div>
                                              <p className="text-[11px] text-slate-600 leading-relaxed">{reply.content}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Inline reply Box */}
                                    <div className="border-t pt-4 space-y-2">
                                      <Label className="text-xs font-semibold">Berikan Tanggapan / Balasan</Label>
                                      <Textarea
                                        placeholder="Ketik jawaban penjelasan akademis atau arahan di sini..."
                                        value={replyContents[activePost.id] || ""}
                                        onChange={e => {
                                          const txt = e.target.value
                                          setReplyContents(prev => ({ ...prev, [activePost.id]: txt }))
                                        }}
                                        rows={3}
                                        className="text-xs"
                                      />
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          onClick={() => handleCreateReply(activePost.id)}
                                          disabled={replyLoading[activePost.id]}
                                          className="bg-[#060708] hover:bg-[#060708]/90 text-white font-semibold text-xs cursor-pointer"
                                        >
                                          {replyLoading[activePost.id] && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                                          Kirim Balasan
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ) : (
                              <div className="text-center py-20 bg-white border border-[#E8E5E9] rounded-2xl text-muted-foreground text-xs">
                                Pilih salah satu pertanyaan di sebelah kiri untuk melihat tanggapan dan membalas.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI insights View */}
                  {activeView === 'ai-insights' && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full">
                      <div className="flex items-center justify-between border-b border-[#E8E5E9]/60 pb-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h1 className="font-heading text-2xl font-bold text-[#060708]">AI Course Insights</h1>
                            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Dapatkan masukan otomatis berdaya AI tentang penyusunan materi dan performa siswa.</p>
                        </div>
                      </div>

                      <Card className="bg-white border border-[#E8E5E9] shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b p-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                              <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-[#060708]">Rekomendasi Syllabus & Kuis Cerdas</CardTitle>
                              <CardDescription className="text-[11px]">Asisten AI menganalisis interaksi mahasiswa, waktu belajar, dan pola kegagalan ujian.</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          {!aiInsightsText ? (
                            <div className="text-center py-10 space-y-4">
                              <div className="max-w-md mx-auto space-y-2">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Belum ada analisis yang dijalankan untuk modul ini. Tekan tombol di bawah untuk menyinkronkan data mahasiswa secara anonim dan memicu mesin penganalisis kurikulum kami.
                                </p>
                              </div>
                              <Button
                                onClick={handleGenerateAIInsights}
                                disabled={aiInsightsLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm gap-2 cursor-pointer"
                              >
                                {aiInsightsLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Menganalisis Performa Kelas...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4" />
                                    Jalankan Analisis AI Belajara
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="prose prose-sm max-w-none text-xs bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed text-slate-700">
                                <MarkdownRenderer content={aiInsightsText} />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setAiInsightsText(null)}
                                  className="text-xs border-[#C6B5BF] cursor-pointer"
                                >
                                  Reset Analisis
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => showToast("success", "Rekomendasi AI berhasil disalin ke dokumen perencanaan dosen.")}
                                  className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs cursor-pointer"
                                >
                                  Salin Rekomendasi
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Secondary Views (Dashboard, Activity Matrix, Users, Certificates, Forms, Layout, Player settings, Video Library, Automations) */}
                  {!['outline', 'general', 'access', 'pricing', 'progress', 'gradebook', 'reviews', 'ai-insights'].includes(activeView) && (
                    <div className="space-y-6 max-w-4xl mx-auto w-full">
                      <div className="flex items-center gap-1.5 border-b border-[#E8E5E9]/60 pb-5">
                        <h1 className="font-heading text-2xl font-bold text-[#060708] capitalize">
                          {activeView === 'dashboard' ? 'Overview Dashboard' : 
                           activeView === 'activity' ? 'Activity Matrix' : 
                           activeView === 'users' ? 'Direktori Mahasiswa' : 
                           activeView === 'certificates' ? 'Sertifikat Kelulusan' : 
                           activeView === 'forms' ? 'Course Feedback Forms' : 
                           activeView === 'layout' ? 'Tata Letak Pemutar' : 
                           activeView === 'player' ? 'Pengaturan Workspace Player' : 
                           activeView === 'video' ? 'Video Media Library' : 
                           activeView === 'automations' ? 'Integrasi & Otomasi' : activeView}
                        </h1>
                      </div>

                      {/* View Specific Templates */}
                      {activeView === 'dashboard' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white border rounded-xl p-4 shadow-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Pendapatan</span>
                              <h3 className="font-heading text-xl font-bold text-[#060708] mt-1">Rp 7.100.000</h3>
                              <p className="text-[9px] text-emerald-600 mt-0.5">&uarr; 12% dari bulan lalu</p>
                            </div>
                            <div className="bg-white border rounded-xl p-4 shadow-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Penyelesaian Kelas</span>
                              <h3 className="font-heading text-xl font-bold text-[#060708] mt-1">42 Mahasiswa</h3>
                              <p className="text-[9px] text-slate-400 mt-0.5">Berhasil lulus seluruh kuis</p>
                            </div>
                            <div className="bg-white border rounded-xl p-4 shadow-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Waktu Tonton Rata-rata</span>
                              <h3 className="font-heading text-xl font-bold text-[#060708] mt-1">2.4 Jam / Minggu</h3>
                              <p className="text-[9px] text-slate-400 mt-0.5">Per-mahasiswa aktif</p>
                            </div>
                            <div className="bg-white border rounded-xl p-4 shadow-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Kepuasan Kelas</span>
                              <h3 className="font-heading text-xl font-bold text-[#060708] mt-1">4.8 / 5.0</h3>
                              <p className="text-[9px] text-slate-400 mt-0.5">Berdasarkan 38 umpan balik</p>
                            </div>
                          </div>

                          <Card className="bg-white border border-[#E8E5E9]">
                            <CardHeader>
                              <CardTitle className="text-sm font-bold text-[#060708]">Tren Pendaftaran Bulanan</CardTitle>
                            </CardHeader>
                            <CardContent className="h-48 flex items-end gap-3 pt-6 font-sans">
                              {[
                                { label: "Jan", val: 30 },
                                { label: "Feb", val: 45 },
                                { label: "Mar", val: 65 },
                                { label: "Apr", val: 85 },
                                { label: "Mei", val: 120 },
                                { label: "Jun", val: 142 },
                              ].map((bar, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                  <div className="bg-[#060708] w-full rounded-t-lg transition-all duration-500" style={{ height: `${(bar.val / 150) * 100}%` }} />
                                  <span className="text-[9px] text-slate-500 font-semibold">{bar.label} ({bar.val})</span>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {activeView === 'activity' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Matriks Jam Belajar Terpadu</CardTitle>
                            <CardDescription className="text-[11px]">Visualisasi heatmap jam aktif mahasiswa mengakses platform Belajara.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 font-sans text-xs">
                            <div className="grid grid-cols-8 gap-2 text-center text-[10px] font-semibold text-slate-400 border-b pb-2">
                              <div>Jam / Hari</div>
                              <div>Senin</div>
                              <div>Selasa</div>
                              <div>Rabu</div>
                              <div>Kamis</div>
                              <div>Jumat</div>
                              <div>Sabtu</div>
                              <div>Minggu</div>
                            </div>
                            {[
                              { hour: "08:00 - 12:00", vals: [3, 2, 4, 3, 2, 1, 0] },
                              { hour: "12:00 - 16:00", vals: [4, 5, 3, 4, 3, 2, 1] },
                              { hour: "16:00 - 20:00", vals: [6, 7, 8, 6, 5, 3, 2] },
                              { hour: "20:00 - 24:00", vals: [8, 9, 10, 9, 8, 5, 4] },
                            ].map((row, rIdx) => (
                              <div key={rIdx} className="grid grid-cols-8 gap-2 items-center text-center">
                                <div className="font-semibold text-slate-500 text-[10px] text-left">{row.hour}</div>
                                {row.vals.map((v, vIdx) => {
                                  let bg = "bg-slate-50 border-slate-100"
                                  if (v > 7) bg = "bg-purple-855 text-white"
                                  else if (v > 4) bg = "bg-[#060708] text-white"
                                  else if (v > 2) bg = "bg-[#C6B5BF] text-[#060708]"
                                  else if (v > 0) bg = "bg-[#C6B5BF]/30 text-slate-700"
                                  return (
                                    <div key={vIdx} className={`p-2 rounded-lg border text-[10px] font-bold ${bg}`}>
                                      {v}x
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                            <div className="flex gap-4 justify-end text-[10px] text-slate-400 font-semibold pt-4 border-t">
                              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-slate-50 border rounded" /> 0-2 sesi</span>
                              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-[#C6B5BF]/30 border rounded" /> 3-4 sesi</span>
                              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-[#C6B5BF] rounded" /> 5-7 sesi</span>
                              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-purple-800 rounded" /> 8+ sesi</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'users' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-[#060708]">Daftar Registrasi Akademik</CardTitle>
                            <Input placeholder="Cari nama atau NIM..." className="text-xs max-w-xs h-8" />
                          </CardHeader>
                          <CardContent className="p-0">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-50 border-b text-slate-500 font-semibold">
                                  <th className="p-3">Nama</th>
                                  <th className="p-3">NIM</th>
                                  <th className="p-3">Email</th>
                                  <th className="p-3">Semester</th>
                                  <th className="p-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {[
                                  { name: "Budi Santoso", nim: "2201010101", email: "budi@gmail.com", sem: 3, stat: "Aktif" },
                                  { name: "Siti Rahma", nim: "2201010102", email: "siti@gmail.com", sem: 3, stat: "Aktif" },
                                  { name: "Rian Hidayat", nim: "2201010103", email: "rian@gmail.com", sem: 3, stat: "Aktif" },
                                  { name: "Amanda Wijaya", nim: "2201010104", email: "amanda@gmail.com", sem: 3, stat: "Aktif" },
                                  { name: "Farhan Alamsyah", nim: "2201010105", email: "farhan@gmail.com", sem: 3, stat: "Tidak Aktif" },
                                ].map((u, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-primary">{u.name}</td>
                                    <td className="p-3 font-mono text-slate-500">{u.nim}</td>
                                    <td className="p-3 font-mono">{u.email}</td>
                                    <td className="p-3">Semester {u.sem}</td>
                                    <td className="p-3">
                                      <Badge className={u.stat === "Aktif" ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"}>
                                        {u.stat}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'certificates' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Penerbitan Sertifikat Kelulusan Elektronik</CardTitle>
                            <CardDescription className="text-[11px]">Mahasiswa yang menyelesaikan seluruh kuis dengan nilai minimal kriteria kelayakan akan berhak menerima sertifikat.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="cert-auto" className="font-bold text-xs text-primary cursor-pointer">Terbitkan Otomatis Saat Lulus</Label>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  Kirim e-sertifikat berformat PDF ke email mahasiswa langsung ketika kuis bab terakhir dinyatakan lulus.
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                id="cert-auto"
                                checked={autoIssue}
                                onChange={e => setAutoIssue(e.target.checked)}
                                className="h-4 w-4 border-gray-300 text-[#060708] rounded cursor-pointer"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Batas Minimum Kelulusan (Kuis Avg)</Label>
                                <Input
                                  type="number"
                                  value={minPassScore}
                                  onChange={e => setMinPassScore(Number(e.target.value) || 0)}
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Pilih Desain Template</Label>
                                <select
                                  value={certTemplate}
                                  onChange={e => setCertTemplate(e.target.value)}
                                  className="w-full text-xs border rounded-md p-2 bg-white"
                                >
                                  <option value="modern">Belajara Modern Minimalist (Playfair)</option>
                                  <option value="classic">Akademis Klasik (Serif)</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end pt-3">
                              <Button
                                size="sm"
                                onClick={handleSaveCertificateSettings}
                                className="bg-[#060708] text-white text-xs cursor-pointer"
                              >
                                Perbarui Sertifikat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'forms' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Formulir Evaluasi & Umpan Balik</CardTitle>
                            <CardDescription className="text-[11px]">Kumpulkan kritik, saran, serta tingkat kepuasan dari mahasiswa di akhir kelas.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                                <span className="font-bold text-[#060708]">Pertanyaan 1 (Skala 1-5):</span>
                                <p className="text-slate-500 mt-1">Bagaimana tingkat kejelasan materi pembelajaran yang disampaikan?</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg border text-xs">
                                <span className="font-bold text-[#060708]">Pertanyaan 2 (Esai):</span>
                                <p className="text-slate-500 mt-1">Tuliskan kendala teknis atau saran perbaikan untuk kuis mandiri kelas ini.</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => showToast("success", "Formulir umpan balik berhasil diaktifkan.")} className="bg-[#060708] text-white text-xs cursor-pointer">
                              Aktifkan Kuesioner
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'layout' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Tata Letak & Halaman Kelas</CardTitle>
                            <CardDescription className="text-[11px]">Sesuaikan tampilan visual halaman utama katalog kelas bagi calon pendaftar.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Tipe Navigasi Kelas</Label>
                                <select
                                  value={navType}
                                  onChange={e => setNavType(e.target.value)}
                                  className="w-full text-xs border rounded-md p-2 bg-white"
                                >
                                  <option value="sticky">Sticky Sidebar Navigation</option>
                                  <option value="top">Top Bar Course Navigation</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Header Cover Pattern</Label>
                                <select
                                  value={coverPattern}
                                  onChange={e => setCoverPattern(e.target.value)}
                                  className="w-full text-xs border rounded-md p-2 bg-white"
                                >
                                  <option value="solid">Minimalist Off-White (#FAF9FB)</option>
                                  <option value="mesh">Sophisticated Mauve Gradient</option>
                                </select>
                              </div>
                            </div>
                            <Button size="sm" onClick={handleSaveLayoutSettings} className="bg-[#060708] text-white text-xs cursor-pointer">
                              Simpan Tata Letak
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'player' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Konfigurasi Workspace Player</CardTitle>
                            <CardDescription className="text-[11px]">Sesuaikan opsi interaktivitas antarmuka pemutar materi mahasiswa.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id="play-disc"
                                  checked={showChat}
                                  onChange={e => setShowChat(e.target.checked)}
                                  className="h-4 w-4 border-gray-300 text-[#060708] rounded cursor-pointer"
                                />
                                <Label htmlFor="play-disc" className="text-xs font-semibold cursor-pointer">Tampilkan Kolom Chat & Diskusi Modul</Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id="play-auto"
                                  checked={autoplay}
                                  onChange={e => setAutoplay(e.target.checked)}
                                  className="h-4 w-4 border-gray-300 text-[#060708] rounded cursor-pointer"
                                />
                                <Label htmlFor="play-auto" className="text-xs font-semibold cursor-pointer">Autoplay Video (Putar Otomatis Sub-bab Selanjutnya)</Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id="play-download"
                                  checked={allowDownload}
                                  onChange={e => setAllowDownload(e.target.checked)}
                                  className="h-4 w-4 border-gray-300 text-[#060708] rounded cursor-pointer"
                                />
                                <Label htmlFor="play-download" className="text-xs font-semibold cursor-pointer">Izinkan Pengunduhan Berkas PDF & Bahan Bacaan</Label>
                              </div>
                            </div>
                            <Button size="sm" onClick={handleSavePlayerSettings} className="bg-[#060708] text-white text-xs cursor-pointer">
                              Simpan Workspace Player
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'video' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-[#060708]">Perpustakaan Video (Video Library)</CardTitle>
                            <Button size="sm" className="bg-[#060708] text-white text-xs gap-1.5 cursor-pointer">
                              <Plus className="h-3.5 w-3.5" />
                              Unggah Video
                            </Button>
                          </CardHeader>
                          <CardContent className="p-0">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-50 border-b text-slate-500 font-semibold">
                                  <th className="p-3">Nama Berkas</th>
                                  <th className="p-3">Resolusi</th>
                                  <th className="p-3">Durasi</th>
                                  <th className="p-3">Tanggal Unggah</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-slate-600">
                                <tr className="hover:bg-slate-50">
                                  <td className="p-3 font-semibold text-primary">logika-matematika-proposisi.mp4</td>
                                  <td className="p-3 font-mono">1080p (FHD)</td>
                                  <td className="p-3">12:45</td>
                                  <td className="p-3">01 Jun 2026</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                  <td className="p-3 font-semibold text-primary">induksi-matematika-pembuktian.mp4</td>
                                  <td className="p-3 font-mono">1080p (FHD)</td>
                                  <td className="p-3">18:20</td>
                                  <td className="p-3">02 Jun 2026</td>
                                </tr>
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      )}

                      {activeView === 'automations' && (
                        <Card className="bg-white border border-[#E8E5E9]">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#060708]">Otomasi & Integrasi Alur Kerja</CardTitle>
                            <CardDescription className="text-[11px]">Hubungkan aktivitas kelas Anda dengan webhook luar dan notifikasi eksternal.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                              <div className="space-y-0.5">
                                <Label htmlFor="automations-webhook" className="font-bold text-xs text-primary cursor-pointer">Integrasikan dengan Discord/Slack Webhook</Label>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  Kirim peringatan instan ke kanal koordinasi dosen setiap kali ada transaksi pendaftaran baru.
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                id="automations-webhook"
                                checked={webhookEnabled}
                                onChange={e => setWebhookEnabled(e.target.checked)}
                                className="h-4 w-4 border-gray-300 text-[#060708] rounded cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Slack/Discord Webhook URL</Label>
                              <Input
                                value={webhookUrl}
                                onChange={e => setWebhookUrl(e.target.value)}
                                placeholder="https://hooks.slack.com/services/..."
                                className="text-xs"
                              />
                            </div>

                            <div className="flex justify-end pt-3">
                              <Button size="sm" onClick={handleSaveAutomationSettings} className="bg-[#060708] text-white text-xs cursor-pointer">
                                Simpan Integrasi
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        {/* ──────────────────────────────────────────────────────────────────
            Sub-Chapter: FULL-WINDOW Editor (Reading type only)
        ────────────────────────────────────────────────────────────────── */}
        {subchapterOpen && subchapterForm.type === "reading" && (
          <div className="fixed inset-0 z-[150] flex flex-col bg-[#FAF9FB] animate-in fade-in duration-200">

            {/* Top Navigation Bar */}
            <header className="shrink-0 h-14 bg-white border-b border-[#E8E5E9] flex items-center px-6 gap-4 shadow-sm">
              {/* Left: Course Breadcrumb */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => { setSubchapterOpen(false) }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E8E5E9] text-slate-500 hover:text-[#060708] hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                  title="Tutup Editor"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="w-px h-5 bg-[#E8E5E9] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Editor Materi Kuliah
                  </p>
                  <p className="text-xs font-bold text-[#060708] truncate max-w-xs">
                    {subchapterForm.title || "Sub-bab Baru (Belum Berjudul)"}
                  </p>
                </div>
              </div>

              {/* Center: Word/Char Stats */}
              <div className="hidden md:flex items-center gap-4 text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-[#060708]">
                    {((subchapterForm.content || "").trim().split(/\s+/).filter(Boolean).length).toLocaleString()}
                  </span> kata
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-[#060708]">
                    {((subchapterForm.content || "").length).toLocaleString()}
                  </span> karakter
                </span>
                <span className="flex items-center gap-1">
                  ~<span className="font-bold text-[#060708]">
                    {Math.max(1, Math.ceil(((subchapterForm.content || "").trim().split(/\s+/).filter(Boolean).length) / 200))}
                  </span> mnt baca
                </span>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Restore Draft */}
                {typeof window !== "undefined" && localStorage.getItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const saved = localStorage.getItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`)
                      if (saved) {
                        setSubchapterForm(f => ({ ...f, content: saved }))
                        showToast("success", "Draf berhasil dipulihkan dari penyimpanan lokal.")
                      }
                    }}
                    className="h-8 text-[10px] gap-1 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100/70 cursor-pointer"
                  >
                    <BookOpen className="h-3 w-3" />
                    Pulihkan Draf
                  </Button>
                )}

                {/* AI Toggle */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  className={`h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    aiPanelOpen
                      ? "bg-[#060708] text-white hover:bg-[#060708]/90 border-[#060708]"
                      : "border-[#C6B5BF] text-[#060708] hover:bg-[#C6B5BF]/10"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Asisten AI
                </Button>

                <div className="w-px h-5 bg-[#E8E5E9]" />

                {/* Cancel */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubchapterOpen(false)}
                  className="h-8 text-xs border-[#E8E5E9] text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </Button>

                {/* Save */}
                <Button
                  type="button"
                  onClick={async () => {
                    if (!subchapterModuleId) return
                    setSubchapterLoading(true)
                    try {
                      if (subchapterEditId !== null && typeof subchapterEditId === "number") {
                        await api.instructor.updateSubChapter(subchapterEditId, {
                          ...subchapterForm,
                          order: Number(subchapterForm.order)
                        })
                        showToast("success", "Sub-bab berhasil diperbarui.")
                      } else {
                        await api.instructor.createSubChapter(subchapterModuleId, {
                          ...subchapterForm,
                          order: Number(subchapterForm.order)
                        })
                        showToast("success", "Sub-bab berhasil ditambahkan.")
                      }
                      localStorage.removeItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`)
                      setSubchapterOpen(false)
                      fetchCourse()
                    } catch (err: any) {
                      showToast("error", err.message || "Gagal menyimpan sub-bab.")
                    } finally {
                      setSubchapterLoading(false)
                    }
                  }}
                  disabled={subchapterLoading}
                  className="h-8 text-xs bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg cursor-pointer font-semibold gap-1.5"
                >
                  {subchapterLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Save className="h-3.5 w-3.5" />
                  }
                  Simpan Materi
                </Button>
              </div>
            </header>

            {/* Meta Fields Strip */}
            <div className="shrink-0 px-6 py-3 border-b border-[#E8E5E9] bg-white">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-0.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Judul Sub-bab</Label>
                  <Input
                    value={subchapterForm.title}
                    onChange={e => setSubchapterForm(f => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="cth: Pengenalan Logika Kebenaran dan Proposisi"
                    className="h-8 text-sm font-semibold rounded-lg bg-[#FAF9FB] border-[#E8E5E9] focus-visible:ring-1"
                  />
                </div>
                <div className="w-28 space-y-0.5 shrink-0">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Urutan</Label>
                  <Input
                    type="number" min={1}
                    value={subchapterForm.order}
                    onChange={e => setSubchapterForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                    required
                    className="h-8 text-xs rounded-lg bg-[#FAF9FB] border-[#E8E5E9]"
                  />
                </div>
                <div className="w-36 space-y-0.5 shrink-0">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Estimasi Durasi</Label>
                  <Input
                    value={subchapterForm.duration}
                    onChange={e => setSubchapterForm(f => ({ ...f, duration: e.target.value }))}
                    required
                    placeholder="15 mnt"
                    className="h-8 text-xs rounded-lg bg-[#FAF9FB] border-[#E8E5E9]"
                  />
                </div>
              </div>
            </div>

            {/* Main Editor Body */}
            <div className="flex-1 flex overflow-hidden">

              {/* Markdown Editor Column */}
              <div className={`flex flex-col border-r border-[#E8E5E9] transition-all duration-300 ${aiPanelOpen ? "w-[40%]" : "w-1/2"}`}>
                {/* Markdown Toolbar */}
                <div className="shrink-0 flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-[#E8E5E9] bg-white">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mr-2">Markdown</span>
                  {[
                    { action: "bold", icon: <Bold className="h-3.5 w-3.5" />, title: "Tebal (Bold)" },
                    { action: "italic", icon: <Italic className="h-3.5 w-3.5" />, title: "Miring (Italic)" },
                  ].map(btn => (
                    <button key={btn.action} type="button" onClick={() => insertMarkdown(btn.action)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title={btn.title}>
                      {btn.icon}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  {["H1","H2","H3"].map(h => (
                    <button key={h} type="button" onClick={() => insertMarkdown(h.toLowerCase())}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer" title={`Heading ${h[1]}`}>
                      {h}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  {[
                    { action: "code-block", icon: <Code className="h-3.5 w-3.5" />, title: "Code Block" },
                    { action: "bullet", icon: <List className="h-3.5 w-3.5" />, title: "Bullet List" },
                    { action: "number", icon: <ListOrdered className="h-3.5 w-3.5" />, title: "Numbered List" },
                    { action: "quote", icon: <Quote className="h-3.5 w-3.5" />, title: "Blockquote" },
                  ].map(btn => (
                    <button key={btn.action} type="button" onClick={() => insertMarkdown(btn.action)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title={btn.title}>
                      {btn.icon}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  {[
                    { action: "link", icon: <Link className="h-3.5 w-3.5" />, title: "Sisipkan Tautan" },
                    { action: "image", icon: <Image className="h-3.5 w-3.5" />, title: "Sisipkan Gambar" },
                    { action: "table", icon: <Table className="h-3.5 w-3.5" />, title: "Sisipkan Tabel" },
                  ].map(btn => (
                    <button key={btn.action} type="button" onClick={() => insertMarkdown(btn.action)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title={btn.title}>
                      {btn.icon}
                    </button>
                  ))}
                  <button type="button" onClick={() => insertMarkdown("hr")}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer" title="Garis Pemisah">
                    ---
                  </button>
                </div>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={subchapterForm.content}
                  onChange={e => setSubchapterForm(f => ({ ...f, content: e.target.value }))}
                  required
                  placeholder={"# Judul Materi Kuliah\n\nTulis konten materi menggunakan format Markdown di sini. Dukung bold, italic, heading, code block, link, tabel, dan lainnya..."}
                  className="flex-1 resize-none rounded-none border-none bg-[#FAF9FB] font-mono text-sm leading-relaxed text-[#060708] p-6 focus-visible:ring-0 focus-visible:outline-none min-h-0"
                />
              </div>

              {/* Live Preview Column */}
              <div className={`flex flex-col transition-all duration-300 ${aiPanelOpen ? "w-[35%]" : "w-1/2"} border-r border-[#E8E5E9]`}>
                <div className="shrink-0 px-6 py-2.5 border-b border-[#E8E5E9] bg-white flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pratinjau Langsung</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                  <h1 className="text-2xl font-bold font-heading border-b border-[#E8E5E9] pb-3 mb-5 text-[#060708]">
                    {subchapterForm.title || "Judul Sub-bab"}
                  </h1>
                  {subchapterForm.content ? (
                    <div className="prose prose-slate max-w-none leading-relaxed">
                      <MarkdownRenderer content={subchapterForm.content} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <Edit3 className="h-10 w-10 text-slate-200 mb-3" />
                      <p className="text-sm font-semibold text-slate-400">Pratinjau akan muncul di sini</p>
                      <p className="text-xs text-slate-300 mt-1">Mulai menulis di panel kiri atau gunakan Asisten AI</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Assistant Panel (collapsible) */}
              {aiPanelOpen && (
                <div className="w-[25%] flex flex-col bg-[#060708] text-white animate-in slide-in-from-right-4 duration-300">
                  <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#C6B5BF] animate-pulse" />
                      <span className="text-xs font-bold font-heading">Asisten AI Belajara</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiPanelOpen(false)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-[#C6B5BF] mb-3" />
                        <p className="text-[11px] font-medium text-slate-200 animate-pulse">{aiStatusMsg}</p>
                        <p className="text-[9px] text-slate-500 mt-1">Sedang menyusun materi kuliah...</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Topik Fokus Materi</Label>
                          <Textarea
                            value={aiTopic}
                            onChange={e => setAiTopic(e.target.value)}
                            placeholder="cth: Cara kerja Quicksort dan kompleksitas Big-O"
                            className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs p-2.5 h-24 resize-none focus-visible:ring-1 focus-visible:ring-[#C6B5BF]/50 placeholder:text-slate-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jenis Draf</Label>
                          <select
                            value={aiTemplateType}
                            onChange={e => setAiTemplateType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C6B5BF]/50 cursor-pointer"
                          >
                            <option value="theory">Pembahasan Teoretis</option>
                            <option value="code">Praktik & Contoh Kode</option>
                            <option value="case_study">Studi Kasus Industri</option>
                            <option value="evaluation">Latihan Soal & Pembahasan</option>
                          </select>
                        </div>

                        <Button
                          type="button"
                          onClick={handleAIGenerateDraft}
                          className="w-full bg-[#FAF9FB] hover:bg-white text-[#060708] font-bold text-xs h-9 rounded-lg cursor-pointer gap-1.5 shadow-md"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#C6B5BF]" />
                          Buat Draf AI
                        </Button>

                        <div className="border-t border-slate-800 pt-4 space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Tips Penulisan</h5>
                          <ul className="space-y-1.5 text-[10px] text-slate-400">
                            <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />Gunakan heading untuk struktur materi</li>
                            <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />Sematkan code block untuk algoritma</li>
                            <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />Gunakan tabel untuk merangkum data</li>
                            <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />Tambahkan referensi dengan format link</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            Sub-Chapter: Compact Dialog (Video / Forum types)
        ────────────────────────────────────────────────────────────────── */}
        {subchapterOpen && subchapterForm.type !== "reading" && (
          <Dialog open={subchapterOpen} onOpenChange={setSubchapterOpen}>
            <DialogContent className="max-w-2xl bg-white max-h-[85vh] flex flex-col p-6 overflow-hidden">
              <DialogHeader className="border-b pb-3 shrink-0">
                <DialogTitle className="font-heading text-lg font-bold text-[#060708]">
                  {subchapterEditId !== null ? "Edit Sub-bab" : "Tambah Sub-bab Baru"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!subchapterModuleId) return
                setSubchapterLoading(true)
                try {
                  if (subchapterEditId !== null && typeof subchapterEditId === "number") {
                    await api.instructor.updateSubChapter(subchapterEditId, {
                      ...subchapterForm,
                      order: Number(subchapterForm.order)
                    })
                    showToast("success", "Sub-bab berhasil diperbarui.")
                  } else {
                    await api.instructor.createSubChapter(subchapterModuleId, {
                      ...subchapterForm,
                      order: Number(subchapterForm.order)
                    })
                    showToast("success", "Sub-bab berhasil ditambahkan.")
                  }
                  setSubchapterOpen(false)
                  fetchCourse()
                } catch (err: any) {
                  showToast("error", err.message || "Gagal menyimpan sub-bab.")
                } finally {
                  setSubchapterLoading(false)
                }
              }} className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">

                {/* Meta Fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Judul Sub-bab *</Label>
                    <Input
                      value={subchapterForm.title}
                      onChange={e => setSubchapterForm(f => ({ ...f, title: e.target.value }))}
                      required
                      placeholder="cth: Pengenalan Logika"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urutan *</Label>
                    <Input
                      type="number" min={1}
                      value={subchapterForm.order}
                      onChange={e => setSubchapterForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                      required
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durasi *</Label>
                    <Input
                      value={subchapterForm.duration}
                      onChange={e => setSubchapterForm(f => ({ ...f, duration: e.target.value }))}
                      required
                      placeholder="15 mnt"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Video URL Field */}
                {subchapterForm.type === "video" && (
                  <div className="space-y-2 border border-border bg-[#FAF9FB] p-5 rounded-xl">
                    <Label className="text-xs font-bold text-[#060708]">URL Sematan Video (Iframe/YouTube) *</Label>
                    <Input
                      value={subchapterForm.video_url}
                      onChange={e => setSubchapterForm(f => ({ ...f, video_url: e.target.value }))}
                      required
                      placeholder="https://www.youtube.com/embed/..."
                      className="h-9 text-xs rounded-lg bg-white mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                      Pastikan menggunakan link embed YouTube (mengandung kata <strong>/embed/</strong>) agar dapat diputar dengan lancar oleh mahasiswa.
                    </p>
                  </div>
                )}

                {/* Forum placeholder */}
                {subchapterForm.type === "forum" && (
                  <div className="space-y-2 border border-border bg-[#FAF9FB] p-5 rounded-xl">
                    <Label className="text-xs font-bold text-[#060708]">Sub-bab Forum Diskusi</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sub-bab ini akan membuka ruang diskusi interaktif bagi mahasiswa untuk bertanya dan berdiskusi.
                      Tidak ada konten tambahan yang perlu ditambahkan — cukup simpan sub-bab ini.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-3 shrink-0 mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSubchapterOpen(false)}
                    className="h-8 text-xs rounded-lg cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 text-xs bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg cursor-pointer font-semibold"
                    disabled={subchapterLoading}
                  >
                    {subchapterLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Simpan Sub-bab
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Quiz Manual Editor Dialog */}
        {/* Quiz Manual Editor Dialog */}
        {quizOpen && (
          <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
            <DialogContent className="max-w-3xl bg-white max-h-[90vh] flex flex-col p-6 overflow-hidden">
              <DialogHeader className="border-b pb-3 shrink-0 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="font-heading text-lg font-bold text-[#060708]">
                    Kelola Soal Evaluasi Manual
                  </DialogTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                    Edit daftar soal evaluasi, pilihan ganda, kunci jawaban, dan penjelasan.
                  </p>
                </div>
                <div className="flex gap-2 mr-6 shrink-0">
                  <Button
                    type="button"
                    onClick={() => handleGenerateQuiz(quizModuleId!)}
                    disabled={!!quizLoading[quizModuleId!]}
                    size="xs"
                    className="bg-[#CF3A1F]/10 text-[#CF3A1F] border border-[#CF3A1F]/20 hover:bg-[#CF3A1F] hover:text-white gap-1.5 cursor-pointer h-7 text-[10px] font-semibold"
                  >
                    {quizLoading[quizModuleId!]
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Sparkles className="h-3 w-3" />
                    }
                    Generate dengan AI
                  </Button>
                  <Button
                    type="button"
                    onClick={addQuizQuestion}
                    size="xs"
                    className="bg-[#060708] text-white hover:bg-[#060708]/90 gap-1.5 cursor-pointer h-7 text-[10px]"
                  >
                    + Tambah Soal
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 min-h-0">
                {quizQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-primary">Belum Ada Soal Evaluasi</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-normal">
                      Evaluasi ini belum memiliki soal. Klik &ldquo;Tambah Soal&rdquo; di kanan atas atau klik &ldquo;Generate AI&rdquo; pada modul untuk membuat evaluasi otomatis.
                    </p>
                  </div>
                ) : (
                  quizQuestions.map((q, qIdx) => (
                    <Card key={qIdx} className="border border-border p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4 border-b pb-2">
                        <span className="text-xs font-bold text-primary">Soal Nomor {qIdx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeQuizQuestion(qIdx)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive cursor-pointer"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-primary">Pertanyaan Soal</Label>
                        <Input
                          value={q.question}
                          onChange={e => updateQuestionText(qIdx, e.target.value)}
                          placeholder="Pertanyaan..."
                          className="h-8 text-xs bg-white rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Opsi A</Label>
                          <Input
                            value={q.options?.A || ""}
                            onChange={e => updateQuestionOption(qIdx, "A", e.target.value)}
                            placeholder="Opsi A..."
                            className="h-8 text-xs bg-white rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Opsi B</Label>
                          <Input
                            value={q.options?.B || ""}
                            onChange={e => updateQuestionOption(qIdx, "B", e.target.value)}
                            placeholder="Opsi B..."
                            className="h-8 text-xs bg-white rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Opsi C</Label>
                          <Input
                            value={q.options?.C || ""}
                            onChange={e => updateQuestionOption(qIdx, "C", e.target.value)}
                            placeholder="Opsi C..."
                            className="h-8 text-xs bg-white rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Opsi D</Label>
                          <Input
                            value={q.options?.D || ""}
                            onChange={e => updateQuestionOption(qIdx, "D", e.target.value)}
                            placeholder="Opsi D..."
                            className="h-8 text-xs bg-white rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Kunci Jawaban</Label>
                          <select
                            value={q.correct_answer}
                            onChange={e => updateQuestionCorrect(qIdx, e.target.value)}
                            className="w-full bg-white border border-border rounded-lg px-2 py-1 text-xs text-primary focus:outline-none cursor-pointer h-8"
                          >
                            <option value="A">Opsi A</option>
                            <option value="B">Opsi B</option>
                            <option value="C">Opsi C</option>
                            <option value="D">Opsi D</option>
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-bold text-primary">Pembahasan / Penjelasan Soal</Label>
                          <Input
                            value={q.explanation || ""}
                            onChange={e => updateQuestionExplanation(qIdx, e.target.value)}
                            placeholder="Penjelasan..."
                            className="h-8 text-xs bg-white rounded-lg"
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuizOpen(false)}
                  className="h-8 text-xs rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveQuiz}
                  className="h-8 text-xs bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg cursor-pointer"
                  disabled={quizSaving || quizQuestions.length === 0}
                >
                  {quizSaving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Simpan Evaluasi ({quizQuestions.length} Soal)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
