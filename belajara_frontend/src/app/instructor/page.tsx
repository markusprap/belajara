"use client"

import * as React from "react"
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
import { GraduationCap, Plus, BookOpen, ChevronRight, Loader2, AlertCircle } from "lucide-react"
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
  is_premium?: boolean
  modules?: CourseModule[]
}

const EMPTY_FORM = {
  code: "", title: "", description: "", department: "",
  sks: 3, semester: 1, price: "0", is_premium: false,
}

export default function InstructorPage() {
  const [courses, setCourses] = React.useState<Course[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY_FORM)

  const fetchCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const res = await fetch("http://localhost:8001/api/courses/", {
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.instructor.createCourse({
        ...form,
        sks: Number(form.sks),
        semester: Number(form.semester),
      })
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      fetchCourses()
    } catch (err: any) {
      alert(err.message || "Gagal membuat kelas.")
    }
    setCreating(false)
  }

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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white gap-2 shadow-sm">
                  <Plus className="h-4 w-4" /> Tambah Mata Kuliah
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl text-[#060708]">
                    Buat Mata Kuliah Baru
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Kode Mata Kuliah</Label>
                      <Input
                        placeholder="IF101"
                        value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">SKS</Label>
                      <Input
                        type="number" min={1} max={6}
                        value={form.sks}
                        onChange={e => setForm(f => ({ ...f, sks: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Mata Kuliah</Label>
                    <Input
                      placeholder="Algoritma & Struktur Data"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Deskripsi</Label>
                    <Textarea
                      placeholder="Deskripsi singkat mata kuliah..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Departemen</Label>
                      <Input
                        placeholder="Informatika"
                        value={form.department}
                        onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Semester</Label>
                      <Input
                        type="number" min={1} max={8}
                        value={form.semester}
                        onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white"
                    disabled={creating}
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {creating ? "Membuat..." : "Buat Mata Kuliah"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Mata Kuliah</p>
                <p className="text-3xl font-heading font-bold text-[#060708] mt-1">{courses.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Modul</p>
                <p className="text-3xl font-heading font-bold text-[#060708] mt-1">
                  {courses.reduce((sum, c) => sum + (c.modules?.length ?? 0), 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mata Kuliah Premium</p>
                <p className="text-3xl font-heading font-bold text-[#CF3A1F] mt-1">
                  {courses.filter(c => c.is_premium).length}
                </p>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map(course => (
                <Card
                  key={course.code}
                  className="bg-white border border-border shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C6B5BF]/20 text-[#060708] border border-[#C6B5BF]/30">
                            {course.code}
                          </span>
                          {course.is_premium && (
                            <Badge className="text-[10px] bg-[#CF3A1F]/10 text-[#CF3A1F] border border-[#CF3A1F]/30 font-semibold">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="font-heading text-lg text-[#060708] leading-tight line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {course.department} &bull; {course.sks} SKS &bull; Semester {course.semester}
                        </CardDescription>
                      </div>
                      <BookOpen className="h-5 w-5 text-[#C6B5BF] shrink-0 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                      {course.description || "Tidak ada deskripsi."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{course.modules?.length ?? 0} modul</span>
                    </div>
                    <a href={`/instructor/courses/${course.code}`}>
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-sm border-[#C6B5BF] hover:bg-[#C6B5BF]/10 group-hover:border-[#060708] transition-colors"
                      >
                        Kelola Silabus
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
