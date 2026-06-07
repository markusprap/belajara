"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, AlertCircle, Sparkles, BookOpen, GraduationCap, DollarSign } from "lucide-react"
import { api } from "@/lib/api"

// Cover gradient helper matching main page
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
  if (!code) return COVER_PALETTES[0]
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length]
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [form, setForm] = React.useState({
    code: "",
    title: "",
    description: "",
    department: "",
    sks: 3,
    semester: 1,
    level: "beginner",
    is_premium: false,
    price: "0",
  })
  const [creating, setCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    // Validation
    if (!form.code.trim()) {
      setError("Kode mata kuliah wajib diisi.")
      setCreating(false)
      return
    }
    if (!form.title.trim()) {
      setError("Nama mata kuliah wajib diisi.")
      setCreating(false)
      return
    }

    try {
      await api.instructor.createCourse({
        ...form,
        sks: Number(form.sks),
        semester: Number(form.semester),
        price: form.is_premium ? Number(form.price) : 0,
      })
      router.push("/instructor")
    } catch (err: any) {
      setError(err.message || "Gagal membuat kelas. Silakan periksa kembali data Anda.")
    } finally {
      setCreating(false)
    }
  }

  const livePalette = getCoverPalette(form.code)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/instructor")}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#060708] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Portal
            </button>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <span className="font-heading text-sm font-semibold text-[#060708]">Buat Kelas Baru</span>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9FB] p-6 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-[#060708]">Buat Mata Kuliah Baru</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Lengkapi formulir di bawah ini untuk mendaftarkan mata kuliah baru ke sistem pembelajaran Belajara.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info Card */}
                  <Card className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                      <CardTitle className="font-heading text-base text-[#060708]">Informasi Dasar</CardTitle>
                      <CardDescription className="text-xs">Kode, nama, departemen, dan semester dari mata kuliah Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#060708]">Kode Mata Kuliah <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="cth: IF101 atau MKB201"
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                            required
                            className="h-10 border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#060708]">Departemen / Program Studi <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="cth: Informatika"
                            value={form.department}
                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                            required
                            className="h-10 border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#060708]">Nama Mata Kuliah <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="cth: Struktur Data & Algoritma Lanjut"
                          value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                          required
                          className="h-10 border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#060708]">Bobot SKS <span className="text-red-500">*</span></Label>
                          <select
                            value={form.sks}
                            onChange={e => setForm(f => ({ ...f, sks: parseInt(e.target.value) || 3 }))}
                            className="w-full h-10 bg-white border border-[#C6B5BF]/60 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#060708] cursor-pointer"
                          >
                            <option value={1}>1 SKS</option>
                            <option value={2}>2 SKS</option>
                            <option value={3}>3 SKS</option>
                            <option value={4}>4 SKS</option>
                            <option value={5}>5 SKS</option>
                            <option value={6}>6 SKS</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#060708]">Semester <span className="text-red-500">*</span></Label>
                          <Input
                            type="number" min={1} max={8}
                            value={form.semester}
                            onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) || 1 }))}
                            required
                            className="h-10 border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#060708]">Tingkat Kesulitan <span className="text-red-500">*</span></Label>
                          <select
                            value={form.level}
                            onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                            className="w-full h-10 bg-white border border-[#C6B5BF]/60 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#060708] cursor-pointer"
                          >
                            <option value="beginner">Pemula (Beginner)</option>
                            <option value="intermediate">Menengah (Intermediate)</option>
                            <option value="advanced">Mahir (Advanced)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-bold text-[#060708]">Deskripsi Lengkap Mata Kuliah</Label>
                        <Textarea
                          placeholder="Tulis silabus, tujuan pembelajaran, atau materi yang akan dipelajari mahasiswa dalam mata kuliah ini secara detail..."
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          rows={5}
                          className="border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monetization & Access Card */}
                  <Card className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                      <CardTitle className="font-heading text-base text-[#060708]">Akses & Pengaturan Harga</CardTitle>
                      <CardDescription className="text-xs">Tentukan apakah kelas ini dapat diakses secara gratis atau berbayar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => setForm(f => ({ ...f, is_premium: false }))}
                          className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                            !form.is_premium
                              ? "border-[#060708] bg-[#060708]/5 text-[#060708]"
                              : "border-border hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider block mb-1">Audit Gratis</span>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Mahasiswa dapat mengakses materi secara gratis. Tidak ada integrasi pembayaran.
                            </p>
                          </div>
                          <span className="text-sm font-bold mt-4 block">Rp 0</span>
                        </div>

                        <div
                          onClick={() => setForm(f => ({ ...f, is_premium: true }))}
                          className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                            form.is_premium
                              ? "border-[#CF3A1F] bg-[#CF3A1F]/5 text-[#CF3A1F]"
                              : "border-border hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold uppercase tracking-wider block">Premium (Berbayar)</span>
                              <Badge className="bg-[#CF3A1F] text-white text-[9px] scale-90">Midtrans</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Akses bersertifikat. Pembayaran diproses otomatis melalui Midtrans gateway.
                            </p>
                          </div>
                          <span className="text-sm font-bold mt-4 block text-[#CF3A1F]">Berbayar</span>
                        </div>
                      </div>

                      {form.is_premium && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                          <Label className="text-xs font-bold text-[#060708]">Harga Kelas (Rupiah) <span className="text-[#CF3A1F]">*</span></Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
                            <Input
                              type="number" min={10000} step={5000}
                              placeholder="cth: 150000"
                              value={form.price}
                              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                              required
                              className="pl-8 h-10 border-[#C6B5BF]/60 focus-visible:ring-1 focus-visible:ring-[#060708] rounded-xl"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">Minimal Rp 10.000 untuk kelas premium.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Row */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/instructor")}
                      className="h-10 px-6 rounded-xl border-[#C6B5BF] hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                      disabled={creating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="h-10 px-8 bg-[#060708] hover:bg-[#060708]/90 text-white rounded-xl font-semibold cursor-pointer text-xs gap-2"
                      disabled={creating}
                    >
                      {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                      {creating ? "Membuat Kelas..." : "Buat Kelas Baru"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sidebar Preview Column */}
              <div className="space-y-6">
                <div className="sticky top-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live Preview Kartu</h3>
                  
                  {/* Detailed Preview Card */}
                  <Card className="bg-white border border-border shadow-md rounded-2xl overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div>
                      {/* Banner Gradient Preview */}
                      <div
                        className="h-28 w-full relative transition-all duration-300"
                        style={{ background: `linear-gradient(135deg, ${livePalette[0]} 0%, ${livePalette[1]} 60%, ${livePalette[2]} 100%)` }}
                      >
                        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                            {form.code || "KODE"}
                          </span>
                          {form.is_premium && (
                            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#CF3A1F] text-white shadow-sm">
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pt-4 pb-2">
                        <div>
                          <CardTitle className="font-heading text-base text-[#060708] leading-snug line-clamp-2">
                            {form.title || "Judul Mata Kuliah"}
                          </CardTitle>
                          <CardDescription className="text-[11px] mt-1 flex items-center gap-1 flex-wrap">
                            <span>{form.department || "Departemen"}</span>
                            <span>&bull;</span>
                            <span>{form.sks} SKS</span>
                            <span>&bull;</span>
                            <span>Semester {form.semester}</span>
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {form.description || "Tulis deskripsi kelas di form sebelah kiri untuk melihat preview teks deskripsi di sini."}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-4 flex-wrap text-[10px] font-bold">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <BookOpen className="h-2.5 w-2.5" /> 0 Modul
                          </span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                            <GraduationCap className="h-2.5 w-2.5" /> 0 Mahasiswa
                          </span>
                          {form.is_premium && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                              <DollarSign className="h-2.5 w-2.5" /> Rp {Number(form.price || 0).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    <div className="px-6 pb-4 pt-0">
                      <Button
                        variant="outline"
                        disabled
                        className="w-full gap-1.5 text-xs h-9 border-[#C6B5BF] bg-slate-50 text-slate-400 font-semibold"
                      >
                        Kelola Kelas
                      </Button>
                    </div>
                  </Card>

                  {/* Guide Info */}
                  <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] leading-relaxed text-slate-500 space-y-2">
                    <p className="font-bold text-[#060708] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#CF3A1F]" />
                      Tips Pembuatan Kelas
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Gunakan kode yang unik dan singkat (contoh: <code>IF302</code>).</li>
                      <li>Berikan deskripsi detail tentang materi pembelajaran untuk memikat mahasiswa.</li>
                      <li>Sertakan bobot SKS yang sesuai dengan kurikulum nasional.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
