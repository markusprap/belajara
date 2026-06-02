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
  Save, Eye, Edit3, Bold, Italic, Code, List, ListOrdered, Quote, Link,
  Image, Table, Maximize2, Minimize2, Wand2, Columns
} from "lucide-react"
import { api, getToken } from "@/lib/api"
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
      alert("Harap masukkan topik fokus materi.")
      return
    }

    setAiLoading(true)
    const messages = [
      "Mengumpulkan data topik akademis...",
      "Menyusun silabus pembelajaran...",
      "Menghasilkan konten edukasi Markdown...",
      "Membuat code snippet & visualisasi tabel...",
      "Melakukan formatting Qurtuba Aesthetic...",
      "Menyelesaikan draf materi kuliah..."
    ]

    let currentMsgIdx = 0
    setAiStatusMsg(messages[0])

    const interval = setInterval(() => {
      currentMsgIdx++
      if (currentMsgIdx < messages.length) {
        setAiStatusMsg(messages[currentMsgIdx])
      }
    }, 800)

    await new Promise(resolve => setTimeout(resolve, 3500))
    clearInterval(interval)

    const title = subchapterForm.title || "Materi Kuliah Baru"
    let content = ""

    if (aiTemplateType === "theory") {
      content = `# Pembahasan Mendalam: ${title}

Materi ini dirancang untuk membekali mahasiswa dengan pemahaman konseptual yang kuat mengenai **${aiTopic}**.

## 1. Pendahuluan & Konsep Dasar
Secara umum, ${aiTopic} merujuk pada prinsip penting di mana kita mengelola data, struktur program, atau metodologi penyelesaian masalah secara optimal.

> **Definisi:** ${aiTopic} adalah konsep teoretis yang mendefinisikan hubungan terstruktur antara elemen-elemen instruksi dalam menyelesaikan problem komputasi atau akademik secara efisien.

## 2. Karakteristik Utama
Ada beberapa aspek penting yang harus Anda pahami:
- **Efisiensi:** Mengurangi waktu pengerjaan (time complexity) dan penggunaan memori (space complexity).
- **Keterbacaan (Readability):** Mempermudah kolaborasi antar pengembang.
- **Skalabilitas:** Menjamin sistem tetap berjalan lancar saat ukuran input data meningkat secara eksponensial.

## 3. Perbandingan Metode Terkait
Berikut adalah perbandingan ringkas antara pendekatan konvensional dan pendekatan modern terkait topik ini:

| Kriteria Analisis | Metode Konvensional | Pendekatan Modern |
|---|---|---|
| Kompleksitas | Cenderung tinggi / O(n^2) | Lebih rendah / O(n log n) |
| Konsumsi Memori | Sangat besar | Efisien & adaptif |
| Implementasi | Manual dan prosedural | Berorientasi objek & deklaratif |

## 4. Kesimpulan & Diskusi
Memahami dasar dari ${aiTopic} adalah pondasi utama sebelum melangkah ke teknik yang lebih rumit. Pastikan Anda mencoba latihan di bagian bawah.

---
**Pertanyaan Diskusi:** Mengapa pendekatan modern jauh lebih direkomendasikan pada sistem berskala enterprise dibandingkan metode konvensional? Tulis jawaban Anda di forum diskusi kelas!`
    } else if (aiTemplateType === "code") {
      content = `# Tutorial & Praktik Pemrograman: ${title}

Dalam modul praktis ini, kita akan mengimplementasikan secara langsung konsep **${aiTopic}** menggunakan bahasa pemrograman terpopuler.

## 1. Persiapan Lingkungan Pengembangan
Pastikan Anda sudah menginstal runtime compiler yang sesuai. Kita akan menggunakan kode Python/JavaScript terstruktur.

## 2. Alur Algoritma
Langkah-langkah implementasi:
1. Membaca input dataset secara terstruktur.
2. Melakukan deklarasi variabel dan struktur data pendukung.
3. Melakukan iterasi/pemrosesan logika utama dari ${aiTopic}.
4. Mengembalikan nilai output yang tervalidasi.

## 3. Implementasi Kode Lengkap
Di bawah ini adalah contoh kode lengkap untuk menyelesaikan studi kasus:

\`\`\`python
# Implementasi ${aiTopic}
# Dibuat otomatis oleh Asisten AI Belajara

def jalankan_logika_materi(data_input, opsi_tambahan=True):
    """
    Fungsi utama untuk memproses ${aiTopic}.
    Parameter:
      data_input (list): Data mentah yang akan diproses.
      opsi_tambahan (bool): Konfigurasi mode optimal.
    """
    print(f"[Belajara-AI] Memulai pemrosesan ${aiTopic}...")
    
    if not data_input:
        return []
        
    hasil_proses = []
    for indeks, item in enumerate(data_input):
        # Proses pemetaan logika utama
        nilai_kalkulasi = item * 2 if opsi_tambahan else item
        hasil_proses.append({
            "indeks": indeks,
            "nilai_awal": item,
            "nilai_akhir": nilai_kalkulasi
        })
        
    print("[Belajara-AI] Pemrosesan selesai dengan sukses.")
    return hasil_proses

# Pengujian kode
if __name__ == "__main__":
    dataset_uji = [12, 45, 78, 23, 56]
    hasil = jalankan_logika_materi(dataset_uji)
    print("Hasil kalkulasi:", hasil)
\`\`\`

## 4. Analisis Kode
Dari kode di atas, kita dapat melihat bahwa:
- Loop berjalan linear dengan kompleksitas waktu **O(n)**.
- Penggunaan list sekunder menghasilkan kompleksitas ruang **O(n)**.

---
**Tugas Praktikum:** Modifikasi fungsi di atas agar mendukung pencarian data secara spesifik (filtering) sebelum dikembalikan ke user!`
    } else if (aiTemplateType === "case_study") {
      content = `# Analisis Kasus Nyata: Implementasi ${title}

Studi kasus ini meninjau bagaimana konsep **${aiTopic}** diimplementasikan di industri teknologi skala besar (enterprise).

## 1. Latar Belakang Masalah
Banyak perusahaan teknologi menghadapi kendala performa ketika skala transaksi data meningkat tajam. Masalah utama meliputi:
- Terjadinya bottleneck pada query database.
- Latensi respon server yang melebihi batas toleransi user (>200ms).
- Penumpukan beban memori akibat eksekusi algoritma yang tidak efisien.

## 2. Solusi dengan ${aiTopic}
Dengan mengadopsi teknik ${aiTopic}, tim engineer berhasil merestrukturisasi alur sistem dengan hasil sebagai berikut:
- Mengganti loop nested yang berat menjadi operasi terindeks.
- Melakukan caching memori pada data yang sering diakses.

## 3. Hasil & Metrik Performa
Berikut adalah perbandingan data performa sistem sebelum dan sesudah optimasi:

| Indikator Performa | Sebelum Optimasi | Setelah Optimasi | Dampak Perubahan |
|---|---|---|---|
| Latensi API | 480 ms | 45 ms | Naik 90% Lebih Cepat |
| RAM Server | 8.4 GB | 2.1 GB | Hemat 75% Resources |
| Throughput | 1,200 req/s | 8,500 req/s | Skalabilitas 7x Lipat |

## 4. Kesimpulan Praktis
Pelajaran penting dari studi kasus ini adalah bahwa pilihan arsitektur dan pemahaman terhadap ${aiTopic} memiliki dampak finansial nyata bagi efisiensi operasional server perusahaan cloud.

---
**Refleksi:** Coba hitung potensi penghematan biaya server bulanan jika resource yang digunakan berkurang sebesar 75%!`
    } else {
      content = `# Latihan Soal & Evaluasi: ${title}

Gunakan latihan mandiri ini untuk menguji pemahaman Anda mengenai topik **${aiTopic}**.

## Soal 1: Pemahaman Teoretis
Jelaskan perbedaan mendasar antara implementasi konvensional dan implementasi modern pada konsep ${aiTopic}, khususnya terkait efisiensi pemrosesan data!

### Pembahasan
> Pendekatan modern memanfaatkan struktur data indeks (seperti hash map atau tree) yang memungkinkan operasi pencarian dan pembaruan data berjalan dalam waktu **O(1)** atau **O(log n)**, dibandingkan pencarian linear **O(n)** pada metode konvensional.

---

## Soal 2: Analisis Kode Program
Diberikan cuplikan kode berikut:

\`\`\`javascript
function hitungData(n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      count++;
    }
  }
  return count;
}
\`\`\`

Tentukan kompleksitas waktu dari fungsi di atas dalam notasi Big O dan berikan alasannya!

### Pembahasan
Fungsi tersebut memiliki dua loop bersarang (nested loop) yang masing-masing beriterasi sebanyak \`n\` kali. Oleh karena itu, jumlah total operasi adalah $n \times n = n^2$. Notasi Big O-nya adalah **O(n^2)** (Kuadratik).

---
**Tips Belajar:** Coba tulis ulang fungsi di atas agar berjalan dalam kompleksitas linear **O(n)** dengan teknik memoization!`
    }

    setSubchapterForm(f => ({
      ...f,
      content: (f.content ? f.content + "\n\n" : "") + content
    }))
    setAiLoading(false)
    setAiTopic("")
    setAiPanelOpen(false)
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
            <DialogContent className={`bg-white flex flex-col p-6 overflow-hidden transition-all duration-300 ${
              subchapterForm.type === "reading" 
                ? editorFullScreen
                  ? "fixed inset-0 z-[100] w-screen max-w-none h-screen max-h-none rounded-none left-0 top-0 translate-x-0 translate-y-0"
                  : "w-[95vw] max-w-7xl h-[90vh] max-h-[90vh]" 
                : "max-w-2xl max-h-[85vh]"
            }`}>
              <DialogHeader className="border-b pb-3 shrink-0 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="font-heading text-lg font-bold text-[#060708]">
                    {subchapterEditId !== null ? "Edit Sub-bab" : "Tambah Sub-bab Baru"}
                  </DialogTitle>
                  {subchapterForm.type === "reading" && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      Gunakan Markdown workspace di bawah ini untuk membuat buku pelajaran mandiri yang komprehensif.
                    </p>
                  )}
                </div>
                {subchapterForm.type === "reading" && typeof window !== "undefined" && localStorage.getItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      const saved = localStorage.getItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`)
                      if (saved) {
                        setSubchapterForm(f => ({ ...f, content: saved }))
                        showToast("success", "Draf berhasil dipulihkan dari penyimpanan lokal.")
                      }
                    }}
                    className="h-7 text-[10px] gap-1 mr-6 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100/70"
                  >
                    <BookOpen className="h-3 w-3" />
                    Pulihkan Draf Tersimpan
                  </Button>
                )}
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
                  localStorage.removeItem(`belajara_draft_${subchapterEditId || "new"}_${subchapterModuleId}`)
                  setSubchapterOpen(false)
                  fetchCourse()
                } catch (err: any) {
                  showToast("error", err.message || "Gagal menyimpan sub-bab.")
                } finally {
                  setSubchapterLoading(false)
                }
              }} className="flex-1 flex flex-col overflow-hidden space-y-4 mt-2">
                
                {/* Meta details top header */}
                <div className="flex items-center justify-between gap-4 shrink-0 bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Judul Sub-bab *</Label>
                      <Input
                        value={subchapterForm.title}
                        onChange={e => setSubchapterForm(f => ({ ...f, title: e.target.value }))}
                        required
                        placeholder="cth: Pengenalan Logika Kebenaran"
                        className="h-8 text-xs rounded-lg bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urutan Tampil *</Label>
                      <Input
                        type="number" min={1}
                        value={subchapterForm.order}
                        onChange={e => setSubchapterForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                        required
                        className="h-8 text-xs rounded-lg bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimasi Durasi Belajar *</Label>
                      <Input
                        value={subchapterForm.duration}
                        onChange={e => setSubchapterForm(f => ({ ...f, duration: e.target.value }))}
                        required
                        placeholder="10 mnt"
                        className="h-8 text-xs rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  
                  {subchapterForm.type === "reading" && (
                    <div className="flex items-center gap-2 self-end h-8 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAiPanelOpen(!aiPanelOpen)}
                        className={`h-8 gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                          aiPanelOpen 
                            ? "bg-[#060708] text-white hover:bg-[#060708]/90" 
                            : "border-[#C6B5BF] text-[#060708] hover:bg-[#C6B5BF]/10"
                        }`}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Asisten AI
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditorFullScreen(!editorFullScreen)}
                        className="h-8 gap-1.5 text-xs font-semibold border-[#C6B5BF] text-[#060708] hover:bg-[#C6B5BF]/10 rounded-lg"
                        title={editorFullScreen ? "Perkecil Tampilan" : "Layar Penuh"}
                      >
                        {editorFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        {editorFullScreen ? "Layar Biasa" : "Layar Penuh"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  {subchapterForm.type === "video" ? (
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
                  ) : subchapterForm.type === "reading" ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-2">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
                        {/* Editor Pane: 5 columns (or 6 if AI panel is closed) */}
                        <div className={`flex flex-col min-h-0 space-y-2 transition-all ${
                          aiPanelOpen ? "md:col-span-5" : "md:col-span-6"
                        }`}>
                          <div className="flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editor Teks (Markdown)</span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                              <span>Kata: {((subchapterForm.content || "").trim().split(/\s+/).filter(Boolean).length)}</span>
                              <span>Karakter: {((subchapterForm.content || "").length)}</span>
                              <span>Estimasi Baca: {Math.max(1, Math.ceil(((subchapterForm.content || "").trim().split(/\s+/).filter(Boolean).length) / 200))} mnt</span>
                            </div>
                          </div>

                          {/* Markdown Toolbar */}
                          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-50 border border-border rounded-lg text-slate-600 shrink-0">
                            <button
                              type="button"
                              onClick={() => insertMarkdown("bold")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Teks Tebal (Bold)"
                            >
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("italic")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Teks Miring (Italic)"
                            >
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <div className="w-px h-4 bg-slate-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => insertMarkdown("h1")}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Heading 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("h2")}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Heading 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("h3")}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Heading 3"
                            >
                              H3
                            </button>
                            <div className="w-px h-4 bg-slate-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => insertMarkdown("code-block")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Code Block"
                            >
                              <Code className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("inline-code")}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Inline Code"
                            >
                              `code`
                            </button>
                            <div className="w-px h-4 bg-slate-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => insertMarkdown("bullet")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="List Bullet"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("number")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="List Numbered"
                            >
                              <ListOrdered className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("quote")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Blockquote"
                            >
                              <Quote className="h-3.5 w-3.5" />
                            </button>
                            <div className="w-px h-4 bg-slate-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => insertMarkdown("link")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Insert Link"
                            >
                              <Link className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("image")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Insert Image"
                            >
                              <Image className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("table")}
                              className="p-1.5 rounded hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Insert Table"
                            >
                              <Table className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMarkdown("hr")}
                              className="px-1 py-0.5 rounded text-[10px] font-semibold hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Horizontal Line"
                            >
                              ---
                            </button>
                          </div>

                          <Textarea
                            ref={textareaRef}
                            value={subchapterForm.content}
                            onChange={e => setSubchapterForm(f => ({ ...f, content: e.target.value }))}
                            required
                            placeholder="# Judul Materi Kuliah&#10;&#10;Tulis materi teks di sini dengan format Markdown..."
                            className="flex-1 text-xs rounded-lg p-4 font-mono resize-none focus-visible:ring-1 border-border bg-white leading-relaxed text-[#060708] min-h-0"
                          />
                        </div>

                        {/* Preview Pane: 5 columns (or 6 if AI panel is closed) */}
                        <div className={`flex flex-col min-h-0 space-y-2 transition-all ${
                          aiPanelOpen ? "md:col-span-5" : "md:col-span-6"
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pratinjau Langsung (Live Preview)</span>
                          <div className="flex-1 rounded-lg border border-border bg-white p-6 overflow-y-auto leading-relaxed prose prose-slate max-w-none shadow-sm min-h-0">
                            <h1 className="text-xl font-bold font-heading border-b pb-2 mb-4 text-[#060708]">
                              {subchapterForm.title || "Judul Sub-bab"}
                            </h1>
                            {subchapterForm.content ? (
                              <MarkdownRenderer content={subchapterForm.content} />
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Tulis materi kuliah di panel kiri atau gunakan Asisten AI untuk melihat pratinjau langsung di sini...
                              </p>
                            )}
                          </div>
                        </div>

                        {/* AI Assistant Pane: 2 columns (only shown if aiPanelOpen is true) */}
                        {aiPanelOpen && (
                          <div className="md:col-span-2 flex flex-col min-h-0 space-y-3 bg-[#060708] text-white p-4 rounded-xl shadow-md border border-slate-800 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-[#C6B5BF] animate-pulse" />
                                <span className="text-xs font-bold font-heading text-white">Asisten AI Belajara</span>
                              </div>
                            </div>

                            {aiLoading ? (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <Loader2 className="h-8 w-8 animate-spin text-[#C6B5BF] mb-3" />
                                <p className="text-[11px] font-medium text-slate-200 animate-pulse">{aiStatusMsg}</p>
                                <p className="text-[9px] text-slate-400 mt-1">Mengolah struktur materi...</p>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col space-y-3.5 text-xs min-h-0 overflow-y-auto pr-1">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Topik Fokus Materi</Label>
                                  <Textarea
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    placeholder="cth: Cara kerja Quicksort atau Kompleksitas waktu Big O"
                                    className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs p-2 h-20 resize-none focus-visible:ring-1 focus-visible:ring-slate-700"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Jenis Draf</Label>
                                  <select
                                    value={aiTemplateType}
                                    onChange={e => setAiTemplateType(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none cursor-pointer"
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
                                  className="w-full bg-[#FAF9FB] hover:bg-[#FAF9FB]/90 text-[#060708] font-bold text-xs h-9 rounded-lg mt-2 cursor-pointer gap-1.5 shadow"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Buat Draf AI
                                </Button>

                                <div className="border-t border-slate-800 pt-3">
                                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tips Menulis</h5>
                                  <ul className="space-y-1 text-[10px] text-slate-300 list-disc list-inside">
                                    <li>Gunakan link untuk referensi luar.</li>
                                    <li>Sematkan code block untuk algoritma.</li>
                                    <li>Gunakan tabel untuk rangkuman.</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditorFullScreen(false)
                      setSubchapterOpen(false)
                    }}
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
