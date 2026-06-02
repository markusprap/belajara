"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
  Save, Eye, Edit3
} from "lucide-react"
import { api, getToken } from "@/lib/api"

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

export default function CourseManagePage() {
  const params = useParams<{ code: string }>()
  const code = params?.code as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [toast, setToast] = React.useState<Toast>(null)

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
      const res = await fetch(`http://localhost:8001/api/courses/`, {
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
      <AppSidebar />
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

        {/* Body */}
        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB]">
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
              {/* Course Header Card */}
              <Card className="bg-white border border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C6B5BF]/20 text-[#060708] border border-[#C6B5BF]/30">
                          {course.code}
                        </span>
                        <span className="text-xs text-muted-foreground">{course.department}</span>
                      </div>
                      <CardTitle className="font-heading text-2xl text-[#060708]">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.sks} SKS &bull; Semester {course.semester}
                      </p>
                    </div>
                  </div>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{course.description}</p>
                  )}
                </CardHeader>
              </Card>

              {/* Modules Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold text-[#060708]">
                    Silabus & Modul Kuliah
                    <span className="ml-2 text-sm font-normal text-muted-foreground font-sans">
                      ({sortedModules.length} modul)
                    </span>
                  </h2>
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#060708] hover:bg-[#060708]/80 text-white gap-2">
                        <Plus className="h-4 w-4" /> Tambah Modul
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
                          {addLoading ? "Menyimpan..." : "Tambah Modul"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {sortedModules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[#C6B5BF]/50 rounded-xl bg-white text-center">
                    <GripVertical className="h-10 w-10 text-[#C6B5BF] mb-3" />
                    <p className="font-heading text-lg font-semibold text-[#060708]">Belum Ada Modul</p>
                    <p className="text-sm text-muted-foreground mt-1">Tambahkan modul pertama untuk mulai mengelola sub-bab.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedModules.map((mod) => {
                      const isExpanded = expandedModuleId === mod.id
                      const subchapters = mod.subchapters || []

                      return (
                        <Card key={mod.id} className="bg-white border border-border shadow-sm overflow-hidden">
                          {editId === mod.id ? (
                            /* Inline Module Edit */
                            <CardContent className="pt-4">
                              <form onSubmit={handleUpdateModule} className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 space-y-1">
                                    <Label className="text-xs font-semibold">Judul Modul</Label>
                                    <Input
                                      value={editForm.title}
                                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Urutan</Label>
                                    <Input
                                      type="number" min={1}
                                      value={editForm.order}
                                      onChange={e => setEditForm(f => ({ ...f, order: parseInt(e.target.value) }))}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-semibold">Deskripsi</Label>
                                  <Textarea
                                    rows={2}
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-[#060708] hover:bg-[#060708]/80 text-white text-xs cursor-pointer"
                                    disabled={editLoading}
                                  >
                                    {editLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                    Simpan
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" className="text-xs cursor-pointer" onClick={cancelEditModule}>
                                    Batal
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          ) : (
                            /* Normal Module Row */
                            <>
                              <CardContent className="p-4 flex items-center justify-between gap-4 border-b border-border bg-slate-50/50">
                                <div
                                  className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none"
                                  onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C6B5BF]/20 border border-[#C6B5BF]/30 flex items-center justify-center">
                                    <span className="text-xs font-bold text-[#060708]">{mod.order}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-heading font-semibold text-[#060708] leading-tight flex items-center gap-1.5">
                                      {mod.title}
                                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </h3>
                                    {mod.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenQuizEditor(mod.id)}
                                    disabled={quizLoading[mod.id]}
                                    className="gap-1 text-xs border-[#C6B5BF] hover:bg-[#C6B5BF]/10 text-primary cursor-pointer h-8"
                                  >
                                    {quizLoading[mod.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5 text-accent" />}
                                    Kelola Evaluasi
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateQuiz(mod.id)}
                                    disabled={quizLoading[mod.id]}
                                    className="gap-1 text-xs border-[#C6B5BF] hover:bg-[#C6B5BF]/10 text-[#CF3A1F] cursor-pointer h-8"
                                    title="Generate Evaluasi otomatis menggunakan AI"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    Generate AI
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-[#C6B5BF]/20 cursor-pointer"
                                    onClick={() => startEditModule(mod)}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 cursor-pointer"
                                    onClick={() => handleDeleteModule(mod.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </CardContent>

                              {/* Nested Subchapters Content */}
                              {isExpanded && (
                                <div className="bg-white p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daftar Sub-bab Materi Kuliah</h4>
                                    <div className="flex gap-2">
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        className="h-7 text-[10px] gap-1 cursor-pointer"
                                        onClick={() => openAddSubchapter(mod.id, "video")}
                                      >
                                        <PlayCircle className="h-3 w-3 text-emerald-600" />
                                        + Video
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        className="h-7 text-[10px] gap-1 cursor-pointer"
                                        onClick={() => openAddSubchapter(mod.id, "reading")}
                                      >
                                        <FileText className="h-3 w-3 text-blue-600" />
                                        + Materi
                                      </Button>
                                    </div>
                                  </div>

                                  {subchapters.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada materi sub-bab. Silakan tambahkan materi video atau materi kuliah di atas.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {subchapters.map((sub, sIdx) => {
                                        return (
                                          <div
                                            key={sub.id}
                                            className="p-2.5 rounded-lg border border-border hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs bg-[#FAF9FB]"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              {sub.type === "video" ? (
                                                <PlayCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                                              ) : sub.type === "reading" ? (
                                                <FileText className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                                              ) : sub.type === "quiz" ? (
                                                <HelpCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                                              ) : (
                                                <MessageSquare className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                                              )}
                                              <div className="min-w-0">
                                                <p className="font-semibold text-primary truncate leading-snug">{sub.title}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wide">
                                                  Urutan {sub.order} &bull; {sub.duration} &bull; {sub.type}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {sub.type !== "quiz" && sub.type !== "forum" && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  className="h-7 w-7 p-0 cursor-pointer hover:bg-slate-200"
                                                  onClick={() => openEditSubchapter(sub)}
                                                  title="Edit materi sub-bab"
                                                >
                                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                                </Button>
                                              )}
                                              {typeof sub.id === "number" && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  className="h-7 w-7 p-0 cursor-pointer hover:bg-destructive/10"
                                                  onClick={() => handleDeleteSubChapter(sub)}
                                                  title="Hapus sub-bab"
                                                >
                                                  <Trash className="h-3 w-3 text-destructive" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sub-Chapter Add/Edit Dialog */}
        {subchapterOpen && (
          <Dialog open={subchapterOpen} onOpenChange={setSubchapterOpen}>
            <DialogContent className="max-w-2xl bg-white max-h-[85vh] flex flex-col p-6 overflow-hidden">
              <DialogHeader className="border-b pb-3 shrink-0">
                <DialogTitle className="font-heading text-lg font-bold text-[#060708]">
                  {subchapterEditId !== null ? "Edit Sub-bab" : "Tambah Sub-bab Baru"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSaveSubChapter} className="flex-1 flex flex-col overflow-hidden space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Judul Sub-bab *</Label>
                    <Input
                      value={subchapterForm.title}
                      onChange={e => setSubchapterForm(f => ({ ...f, title: e.target.value }))}
                      required
                      placeholder="cth: Pengenalan Logika Kebenaran"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Urutan *</Label>
                      <Input
                        type="number" min={1}
                        value={subchapterForm.order}
                        onChange={e => setSubchapterForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                        required
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Durasi estimasi *</Label>
                      <Input
                        value={subchapterForm.duration}
                        onChange={e => setSubchapterForm(f => ({ ...f, duration: e.target.value }))}
                        required
                        placeholder="10 mnt"
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  {subchapterForm.type === "video" ? (
                    <div className="space-y-1 shrink-0">
                      <Label className="text-xs font-semibold">URL Sematan Video (Iframe/YouTube) *</Label>
                      <Input
                        value={subchapterForm.video_url}
                        onChange={e => setSubchapterForm(f => ({ ...f, video_url: e.target.value }))}
                        required
                        placeholder="https://www.youtube.com/embed/..."
                        className="h-8 text-xs rounded-lg"
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Pastikan menggunakan link embed YouTube (mengandung kata <strong>/embed/</strong>) agar dapat diputar dengan lancar oleh mahasiswa.
                      </p>
                    </div>
                  ) : subchapterForm.type === "reading" ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-1">
                      <div className="flex items-center justify-between shrink-0">
                        <Label className="text-xs font-semibold">Konten Materi Kuliah (Format Markdown) *</Label>
                        <div className="flex rounded-md border border-border p-0.5 bg-slate-100 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setMarkdownPreview(false)}
                            className={`px-2 py-0.5 rounded-sm cursor-pointer transition-all ${!markdownPreview ? "bg-white text-primary shadow-xs" : "text-muted-foreground"}`}
                          >
                            Tulis (Markdown)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarkdownPreview(true)}
                            className={`px-2 py-0.5 rounded-sm cursor-pointer transition-all ${markdownPreview ? "bg-white text-primary shadow-xs" : "text-muted-foreground"}`}
                          >
                            Pratinjau
                          </button>
                        </div>
                      </div>

                      {!markdownPreview ? (
                        <Textarea
                          value={subchapterForm.content}
                          onChange={e => setSubchapterForm(f => ({ ...f, content: e.target.value }))}
                          required
                          placeholder="# Judul Materi Kuliah&#10;&#10;Tulis materi teks di sini dengan format Markdown..."
                          className="flex-1 text-xs rounded-lg p-3 font-mono resize-none focus-visible:ring-1"
                        />
                      ) : (
                        <div className="flex-1 rounded-lg border border-border bg-[#FAF9FB] p-3 text-xs overflow-y-auto leading-relaxed prose prose-slate max-w-none">
                          <h1 className="text-base font-bold font-heading border-b pb-1.5 mb-2">{subchapterForm.title}</h1>
                          <p className="whitespace-pre-wrap font-semibold text-primary font-sans">{subchapterForm.content || "Belum ada konten."}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 shrink-0">
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
                    className="h-8 text-xs bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg cursor-pointer"
                    disabled={subchapterLoading}
                  >
                    {subchapterLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Simpan Materi Kuliah
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

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
                <Button
                  type="button"
                  onClick={addQuizQuestion}
                  size="xs"
                  className="bg-[#060708] text-white hover:bg-[#060708]/90 gap-1.5 cursor-pointer h-7 mr-6 text-[10px]"
                >
                  + Tambah Soal
                </Button>
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
