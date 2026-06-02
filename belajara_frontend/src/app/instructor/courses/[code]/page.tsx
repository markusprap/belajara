"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Loader2, Pencil, Trash2, Sparkles, CheckCircle2,
  AlertCircle, ChevronLeft, GripVertical,
} from "lucide-react"
import { api, getToken } from "@/lib/api"

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
  modules?: CourseModule[]
}

type Toast = { type: "success" | "error"; message: string } | null

const EMPTY_MODULE = { title: "", description: "", order: 1 }

export default function CourseManagePage() {
  const params = useParams<{ code: string }>()
  const code = params?.code as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [toast, setToast] = React.useState<Toast>(null)

  // Module add dialog
  const [addOpen, setAddOpen] = React.useState(false)
  const [addForm, setAddForm] = React.useState(EMPTY_MODULE)
  const [addLoading, setAddLoading] = React.useState(false)

  // Module edit state
  const [editId, setEditId] = React.useState<number | null>(null)
  const [editForm, setEditForm] = React.useState(EMPTY_MODULE)
  const [editLoading, setEditLoading] = React.useState(false)

  // Quiz generate loading per module
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
        const all: Course[] = await res.json()
        const found = all.find(c => c.code === code) || null
        setCourse(found)
      }
    } catch {
      showToast("error", "Tidak dapat terhubung ke server.")
    }
    setLoading(false)
  }

  React.useEffect(() => { fetchCourse() }, [code])

  // ─── Add Module ────────────────────────────────────────────────────────────
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

  // ─── Edit Module ───────────────────────────────────────────────────────────
  const startEdit = (mod: CourseModule) => {
    setEditId(mod.id)
    setEditForm({ title: mod.title, description: mod.description, order: mod.order })
  }

  const cancelEdit = () => { setEditId(null); setEditForm(EMPTY_MODULE) }

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
      showToast("error", err.message || "Gagal memperbarui modul.")
    }
    setEditLoading(false)
  }

  // ─── Delete Module ─────────────────────────────────────────────────────────
  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("Hapus modul ini? Tindakan tidak dapat diurungkan.")) return
    try {
      await api.instructor.deleteModule(moduleId)
      showToast("success", "Modul berhasil dihapus.")
      fetchCourse()
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus modul.")
    }
  }

  // ─── Generate Quiz ─────────────────────────────────────────────────────────
  const handleGenerateQuiz = async (moduleId: number) => {
    setQuizLoading(prev => ({ ...prev, [moduleId]: true }))
    try {
      await api.instructor.generateQuiz(moduleId)
      showToast("success", "Kuis AI berhasil di-generate! Mahasiswa sudah bisa mengaksesnya.")
    } catch (err: any) {
      showToast("error", err.message || "Gagal men-generate kuis.")
    }
    setQuizLoading(prev => ({ ...prev, [moduleId]: false }))
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
            Portal Dosen
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
              <h3 className="font-heading text-xl font-bold text-[#060708]">Kelas Tidak Ditemukan</h3>
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-bold text-[#060708]">
                    Silabus & Modul
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
                            placeholder="cth: Pengantar Algoritma"
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
                          <Label className="text-xs font-semibold">Urutan</Label>
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
                    <p className="text-sm text-muted-foreground mt-1">Tambahkan modul pertama untuk silabus ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedModules.map((mod) => (
                      <Card key={mod.id} className="bg-white border border-border shadow-sm">
                        {editId === mod.id ? (
                          /* Edit inline form */
                          <CardContent className="pt-4">
                            <form onSubmit={handleUpdateModule} className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                  <Label className="text-xs font-semibold">Judul</Label>
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
                                  className="bg-[#060708] hover:bg-[#060708]/80 text-white"
                                  disabled={editLoading}
                                >
                                  {editLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                  Simpan
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                                  Batal
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        ) : (
                          /* Normal view */
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C6B5BF]/20 border border-[#C6B5BF]/30 flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#060708]">{mod.order}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-heading font-semibold text-[#060708] leading-tight">{mod.title}</h3>
                                  {mod.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs border-[#C6B5BF] hover:bg-[#C6B5BF]/10 text-[#060708]"
                                  onClick={() => handleGenerateQuiz(mod.id)}
                                  disabled={quizLoading[mod.id]}
                                  title="Generate Kuis AI untuk modul ini"
                                >
                                  {quizLoading[mod.id]
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Sparkles className="h-3 w-3 text-[#CF3A1F]" />
                                  }
                                  Kuis AI
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-[#C6B5BF]/20"
                                  onClick={() => startEdit(mod)}
                                  title="Edit modul"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-[#CF3A1F]/10"
                                  onClick={() => handleDeleteModule(mod.id)}
                                  title="Hapus modul"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[#CF3A1F]" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
