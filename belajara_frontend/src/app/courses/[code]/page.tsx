"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  BookOpen, 
  MessageSquare, 
  Lock, 
  Sparkles, 
  PlayCircle, 
  Timer, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  PlusCircle, 
  CreditCard,
  Check,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Menu,
  X,
  Play,
  FileText
} from "lucide-react"
import { api, getUser } from "@/lib/api"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface PageProps {
  params: Promise<{ code: string }>
}

interface Module {
  id: number
  title: string
  description: string
  order: number
  is_premium?: boolean
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

interface SubChapter {
  id: string
  title: string
  type: "video" | "reading" | "quiz" | "forum"
  duration: string
  section: string // Group section header
  module: Module
  video_url?: string
  content?: string
}

// Function to generate the grouped Sub-Chapters for each module matching Coursera style
const getSubChaptersForModule = (mod: any): SubChapter[] => {
  if (mod.subchapters && mod.subchapters.length > 0) {
    return mod.subchapters.map((sub: any) => ({
      id: sub.id,
      title: sub.title,
      type: sub.type,
      duration: sub.duration || "15 mnt",
      section: sub.type === "video" ? "Video Pembelajaran" : sub.type === "reading" ? "Materi Kuliah" : sub.type === "quiz" ? "Evaluasi Pembelajaran" : "Diskusi Akademik",
      module: mod,
      video_url: sub.video_url,
      content: sub.content
    }))
  }

  const cleanTitle = mod.title.replace(/^Modul\s+\d+:\s*/i, "").trim()
  return [
    {
      id: `${mod.id}_sub1`,
      title: `Sub-bab 1: Video Pembelajaran - ${cleanTitle}`,
      type: "video",
      duration: "10 mnt",
      section: "Video Pembelajaran",
      module: mod
    },
    {
      id: `${mod.id}_sub2`,
      title: `Sub-bab 2: Materi Kuliah - ${cleanTitle}`,
      type: "reading",
      duration: "15 mnt",
      section: "Materi Kuliah",
      module: mod
    },
    {
      id: `${mod.id}_sub3`,
      title: `Sub-bab 3: Studi Kasus & Analisis Mendalam`,
      type: "reading",
      duration: "15 mnt",
      section: "Materi Kuliah",
      module: mod
    },
    {
      id: `${mod.id}_sub4`,
      title: `Evaluasi Pembelajaran Modul ${mod.order}`,
      type: "quiz",
      duration: "15 mnt",
      section: "Evaluasi Pembelajaran",
      module: mod
    },
    {
      id: `${mod.id}_sub5`,
      title: `Forum Diskusi Modul ${mod.order}`,
      type: "forum",
      duration: "10 mnt",
      section: "Diskusi Akademik",
      module: mod
    }
  ]
}

// Function to generate rich textbook-style reading material dynamically
const getReadingContent = (courseCode: string, moduleOrder: number, subChapterIndex: number, moduleTitle: string) => {
  const cleanModTitle = moduleTitle.replace(/^Modul\s+\d+:\s*/i, "").trim()

  if (courseCode === "IF201" || courseCode === "IF101") {
    if (subChapterIndex === 2) {
      return {
        introduction: `Selamat datang di materi utama untuk modul ini. Pada bagian ini, kita akan membahas secara mendalam mengenai konsep dasar, teori, serta implementasi praktis terkait "${cleanModTitle}". Pemahaman yang kuat pada sub-bab ini sangat penting sebagai fondasi Anda sebelum melanjutkan ke evaluasi pembelajaran.`,
        sections: [
          {
            heading: "1. Konsep Utama & Definisi",
            paragraphs: [
              `Dalam rekayasa perangkat lunak modern, pemahaman mengenai ${cleanModTitle} merupakan salah satu kompetensi inti yang harus dimiliki oleh setiap analis dan pengembang sistem. Konsep ini mengatur bagaimana data distrukturkan, disimpan, dan diakses secara efisien.`,
              `Secara formal, kita mendefinisikan ini sebagai abstraksi dari entitas dunia nyata ke dalam representasi logis yang dapat dipahami oleh mesin komputer. Komponen utama pembentuknya meliputi tipe data primitif, struktur data komposit, dan relasi logis antar elemen.`
            ]
          },
          {
            heading: "2. Teori & Mekanisme Kerja",
            paragraphs: [
              "Untuk memahami cara kerjanya, perhatikan skema operasional berikut. Setiap instruksi yang dijalankan akan diproses secara sekuensial atau paralel sesuai kompleksitas waktu (Time Complexity) yang dinotasikan dengan Big O. Optimasi memori (Space Complexity) juga menjadi parameter krusial dalam perancangan arsitektur data ini.",
              "Sebagai contoh, apabila kita menggunakan alokasi memori dinamis (dynamic memory allocation), pointer akan merujuk pada alamat memori fisik yang berbeda namun tetap terhubung secara logis melalui metadata referensi."
            ],
            codeBlock: courseCode === "IF101" ? `// Contoh implementasi linked list Node dalam Bahasa C / C++
struct Node {
    int data;
    struct Node* next;
};` : `-- Contoh skema pembuatan tabel dan integritas referensial (SQL DDL)
CREATE TABLE Mahasiswa (
    nim VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    jurusan VARCHAR(100),
    semester INTEGER DEFAULT 1
);`
          },
          {
            heading: "3. Kesimpulan & Best Practices",
            paragraphs: [
              "Dalam mengimplementasikan arsitektur ini, selalu prioritaskan efisiensi algoritma dan normalisasi untuk mencegah inkonsistensi data. Lakukan analisis kebutuhan fungsional sistem terlebih dahulu sebelum memilih struktur data atau skema basis data yang akan digunakan."
            ]
          }
        ]
      }
    } else {
      return {
        introduction: `Studi kasus ini dirancang untuk mengajak Anda melihat bagaimana konsep "${cleanModTitle}" diterapkan dalam skenario industri nyata. Kita akan menganalisis tantangan yang sering dihadapi oleh software engineer di lapangan dan bagaimana menyelesaikannya secara sistematis.`,
        sections: [
          {
            heading: "1. Skenario Masalah (Problem Statement)",
            paragraphs: [
              "Sebuah platform e-commerce berskala nasional mengalami latensi tinggi (bottleneck) pada modul penanganan transaksi di jam sibuk (peak hours). Setelah dilakukan profiling, ditemukan bahwa struktur penyimpanan riwayat belanja pelanggan tidak diindeks dengan baik dan query pencarian memiliki kompleksitas O(N^2).",
              "Hal ini mengakibatkan beban kerja server database meningkat drastis, memicu kegagalan koneksi (timeout) bagi pengguna yang sedang melakukan pembayaran."
            ]
          },
          {
            heading: "2. Analisis & Solusi Teknis",
            paragraphs: [
              "Untuk mengatasi masalah tersebut, tim engineer melakukan refactoring dengan menerapkan dua langkah optimasi utama:",
              "Pertama, mengubah pencarian linear menjadi pencarian berbasis indeks hash (Hash-based Indexing) yang memotong kompleksitas waktu pencarian rata-rata menjadi O(1). Kedua, melakukan denormalisasi terkontrol pada tabel transaksional sensitif guna meminimalisir join database yang berat.",
              "Di bawah ini adalah ilustrasi perbandingan query sebelum dan setelah optimasi dilakukan:"
            ],
            codeBlock: courseCode === "IF101" ? `// O(N) linear search vs O(log N) binary search
int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) return m;
        if (arr[m] < x) l = m + 1;
        else r = m - 1;
    }
    return -1;
}` : `-- Query teroptimasi dengan pemanfaatan Indexing
CREATE INDEX idx_transaksi_tanggal ON Transaksi(tanggal_bayar);

SELECT t.id, m.nama, t.total_amount
FROM Transaksi t
INNER JOIN Mahasiswa m ON t.mahasiswa_id = m.id
WHERE t.tanggal_bayar >= '2026-06-01'
ORDER BY t.tanggal_bayar DESC;`
          },
          {
            heading: "3. Evaluasi & Pembelajaran",
            paragraphs: [
              "Dengan dilakukannya optimasi ini, response time sistem turun dari 2.4 detik menjadi 150 milidetik. Hal ini menunjukkan bahwa pemahaman teori dasar struktur data dan basis data relasional sangat vital bagi performa aplikasi skala enterprise."
            ]
          }
        ]
      }
    }
  }

  // General fallback content for other courses
  if (subChapterIndex === 2) {
    return {
      introduction: `Selamat datang di materi utama untuk modul ini. Pada bagian ini, kita akan membahas secara mendalam mengenai konsep dasar, teori, serta implementasi praktis terkait "${cleanModTitle}". Pemahaman yang kuat pada sub-bab ini sangat penting sebagai fondasi Anda sebelum melanjutkan ke evaluasi pembelajaran.`,
      sections: [
        {
          heading: "1. Pengantar Teori & Konsep",
          paragraphs: [
            `Materi tentang ${cleanModTitle} ini menjelaskan aspek fundamental dari domain pembelajaran Anda. Dalam mata kuliah ini, kita mempelajari bagaimana sistem dirancang untuk menghasilkan output yang dapat diandalkan.`,
            "Konsep ini merupakan standar baku yang digunakan oleh para profesional di industri teknologi informasi global saat ini."
          ]
        },
        {
          heading: "2. Cara Kerja & Operasional",
          paragraphs: [
            "Prinsip utama yang melandasi konsep ini adalah pembagian modul (modularity) dan pemisahan tugas (separation of concerns). Dengan pendekatan ini, sistem menjadi lebih mudah dirawat (maintainable) dan dikembangkan (extensible) secara berkelanjutan.",
            "Berikut adalah contoh sintaks umum atau diagram struktur logika yang relevan dengan bahasan kita:"
          ],
          codeBlock: `// Contoh struktur implementasi modul logis
class ModulPendidikan {
  private String namaMateri;
  private int durasiMenit;

  public void jalankanSesi() {
    System.out.println("Memulai sesi pembelajaran: " + this.namaMateri);
  }
}`
        },
        {
          heading: "3. Rangkuman Materi",
          paragraphs: [
            "Poin penting yang perlu dicatat adalah bahwa keberhasilan perancangan sistem ditentukan oleh ketepatan pemilihan struktur dan kepatuhan terhadap standar best practices pemrograman."
          ]
        }
      ]
    }
  } else {
    return {
      introduction: `Studi kasus ini dirancang untuk mengajak Anda melihat bagaimana konsep "${cleanModTitle}" diterapkan dalam skenario industri nyata. Kita akan menganalisis tantangan yang sering dihadapi oleh software engineer di lapangan dan bagaimana menyelesaikannya secara sistematis.`,
      sections: [
        {
          heading: "1. Kasus Masalah Nyata",
          paragraphs: [
            "Dalam operasional harian perusahaan teknologi, sering kali dijumpai masalah sinkronisasi data akibat kurangnya pemodelan modular. Hal ini dapat menghambat produktivitas tim pengembang dan menyebabkan inkonsistensi data pada dashboard user.",
            "Studi ini menunjukkan proses identifikasi akar masalah (root-cause analysis) dan formulasi solusinya."
          ]
        },
        {
          heading: "2. Formulasi Solusi",
          paragraphs: [
            "Solusi yang diadopsi adalah restrukturisasi total pada modul-modul yang saling tumpang tindih, dengan menerapkan paradigma OOP modern serta design pattern yang sesuai.",
            "Di bawah ini merupakan visualisasi skema perubahan kode logis:"
          ],
          codeBlock: `// Refactored Class with Single Responsibility Principle (SRP)
class OrderManager {
  public void processOrder(Order order) {
    // logic pemrosesan saja
  }
}

class InvoiceGenerator {
  public void generateInvoice(Order order) {
    // logic pembuatan nota saja
  }
}`
        },
        {
          heading: "3. Pelajaran yang Dapat Diambil",
          paragraphs: [
            "Pemisahan tanggung jawab kelas (separation of concerns) terbukti menyederhanakan proses debugging dan meminimalisir duplikasi kode di seluruh repositori proyek."
          ]
        }
      ]
    }
  }
}


export default function CourseDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const courseCode = resolvedParams.code

  const [user, setUser] = React.useState<any>(null)
  const [course, setCourse] = React.useState<Course | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Workspace layout states
  const [isSyllabusCollapsed, setIsSyllabusCollapsed] = React.useState(false)
  const [expandedModules, setExpandedModules] = React.useState<Record<number, boolean>>({})

  // Workspace sub-chapters states
  const [completedSubChapters, setCompletedSubChapters] = React.useState<string[]>([]) // item keys: `${moduleId}_subX`
  const [activeSubChapter, setActiveSubChapter] = React.useState<SubChapter | null>(null)

  // Enrollment states
  const [enrollmentMode, setEnrollmentMode] = React.useState<"audit" | "verified" | null>(null)
  const [isEnrolled, setIsEnrolled] = React.useState<boolean>(false)

  // Derived states
  const activeModule = activeSubChapter?.module || null
  const activeSubItem = activeSubChapter?.type || "video"


  // Quiz states
  const [activeQuiz, setActiveQuiz] = React.useState<any | null>(null)
  const [quizTaking, setQuizTaking] = React.useState(false)
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, string>>({})
  const [quizTimeLeft, setQuizTimeLeft] = React.useState(0)
  const [quizResult, setQuizResult] = React.useState<any | null>(null)
  const [quizTimerActive, setQuizTimerActive] = React.useState(false)

  // Forum states
  const [forumPosts, setForumPosts] = React.useState<any[]>([])
  const [activePost, setActivePost] = React.useState<any | null>(null)
  const [newPostTitle, setNewPostTitle] = React.useState("")
  const [newPostContent, setNewPostContent] = React.useState("")
  const [isCreatingPost, setIsCreatingPost] = React.useState(false)
  const [replyContents, setReplyContents] = React.useState<Record<string, string>>({}) // key: "post-id" or "post-reply-id"
  const [activeReplyToId, setActiveReplyToId] = React.useState<number | null>(null)

  // Checkout states
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [snapToken, setSnapToken] = React.useState<string | null>(null)
  const [orderId, setOrderId] = React.useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = React.useState<"idle" | "pending" | "success" | "failed">("idle")
  const [mockPaymentMethod, setMockPaymentMethod] = React.useState<"gopay" | "va">("gopay")

  // Authentication check
  React.useEffect(() => {
    const loggedInUser = getUser()
    if (!loggedInUser) {
      router.push("/login")
      return
    }
    setUser(loggedInUser)
  }, [router])

  // Load progress completed subchapters from localStorage
  React.useEffect(() => {
    if (user && courseCode) {
      const key = `belajara_completed_subchapters_${user.username}_${courseCode}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setCompletedSubChapters(JSON.parse(saved))
        } catch (e) {
          console.error("Failed loading completed sub-chapters", e)
        }
      }
    }
  }, [user, courseCode])

  // Fetch course details
  const fetchCourseData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.courses.get(courseCode)
      setCourse(data)
      
      // Save enrollment details if present
      if (data && data.enrollment) {
        setIsEnrolled(true)
        setEnrollmentMode(data.enrollment.mode)
      } else {
        setIsEnrolled(false)
        setEnrollmentMode(null)
      }

      if (data && data.modules && data.modules.length > 0) {
        const firstMod = data.modules[0]
        const subs = getSubChaptersForModule(firstMod)
        setActiveSubChapter(subs[0])
        setExpandedModules({ [firstMod.id]: true })
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengambil detail mata kuliah.")
    } finally {
      setLoading(false)
    }
  }, [courseCode])

  React.useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  // Fetch forum posts
  const fetchForumData = React.useCallback(async () => {
    try {
      const data = await api.forum.getPosts(courseCode)
      setForumPosts(data)
    } catch (err) {}
  }, [courseCode])

  React.useEffect(() => {
    if (activeSubItem === "forum") {
      fetchForumData()
    }
  }, [activeSubItem, fetchForumData])

  // Quiz Countdown Timer
  React.useEffect(() => {
    if (!quizTimerActive || quizTimeLeft <= 0) {
      if (quizTimerActive && quizTimeLeft === 0) {
        handleQuizSubmit() // Auto-submit on timeout
      }
      return
    }

    const timer = setInterval(() => {
      setQuizTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [quizTimeLeft, quizTimerActive])

  // Helper formatting for timer
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
  }

  // Helper local sub-chapter progress save
  const markSubChapterAsCompleted = React.useCallback((subId: string) => {
    if (!user) return
    setCompletedSubChapters(prev => {
      if (prev.includes(subId)) return prev
      const next = [...prev, subId]
      const key = `belajara_completed_subchapters_${user.username}_${courseCode}`
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [user, courseCode])

  // Quiz trigger
  const handleStartQuiz = async (moduleId: number) => {
    try {
      const quizzes = await api.quizzes.listByModule(moduleId)
      if (quizzes && quizzes.length > 0) {
        const quiz = quizzes[0]
        setActiveQuiz(quiz)
        setQuizTaking(true)
        setQuizResult(null)
        setQuizAnswers({})
        setQuizTimeLeft(quiz.time_limit)
        setQuizTimerActive(true)
      } else {
        alert("Belum ada evaluasi untuk modul ini.")
      }
    } catch (err) {
      alert("Gagal memuat evaluasi.")
    }
  }

  const handleQuizAnswerSelect = (questionId: number, optionId: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return
    setQuizTimerActive(false)
    try {
      const result = await api.quizzes.submit(activeQuiz.id, quizAnswers)
      setQuizResult(result)
      setQuizTaking(false)

      if (result.passed && activeSubChapter) {
        markSubChapterAsCompleted(activeSubChapter.id)
      }
    } catch (err) {
      alert("Gagal mengirimkan jawaban evaluasi.")
      setQuizTimerActive(true)
    }
  }

  const handleResetQuiz = () => {
    setActiveQuiz(null)
    setQuizTaking(false)
    setQuizResult(null)
  }

  // Forum actions
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    try {
      await api.forum.createPost(courseCode, newPostTitle, newPostContent)
      setNewPostTitle("")
      setNewPostContent("")
      setIsCreatingPost(false)
      fetchForumData() // Refresh list
    } catch (err) {
      alert("Gagal mengirimkan pertanyaan.")
    }
  }

  const handleCreateReply = async (postId: number, parentReplyId: number | null) => {
    const replyKey = parentReplyId ? `reply-${parentReplyId}` : `post-${postId}`
    const content = replyContents[replyKey]
    if (!content || !content.trim()) return

    try {
      await api.forum.createReply(postId, parentReplyId, content, courseCode)
      setReplyContents(prev => ({ ...prev, [replyKey]: "" }))
      setActiveReplyToId(null)
      fetchForumData() // Refresh list
      
      // Update expanded active post view if open
      if (activePost && activePost.id === postId) {
        setTimeout(() => {
          const updatedPost = forumPosts.find(p => p.id === postId)
          if (updatedPost) setActivePost(updatedPost)
        }, 100)
      }
    } catch (err) {
      alert("Gagal mengirimkan balasan.")
    }
  }

  // Payment triggers
  const handleCheckoutTrigger = async () => {
    if (!course) return
    setCheckoutOpen(true)
    setCheckoutLoading(true)
    setPaymentStatus("idle")
    setSnapToken(null)
    try {
      const response = await api.payment.checkout(course.id)
      setSnapToken(response.snap_token)
      setOrderId(response.order_id)
      
      // Trigger Midtrans Snap in real sandbox if loaded
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(response.snap_token, {
          onSuccess: async (result: any) => {
            setPaymentStatus("success")
            await api.payment.verify(response.order_id, "success")
            api.auth.updatePremiumStatus(true)
            setUser(getUser()) // Reload status
            await fetchCourseData() // Re-fetch course metadata to update enrollmentMode to 'verified'
            alert("Upgrade premium berhasil! Selamat belajar.")
            setCheckoutOpen(false)
          },
          onPending: () => {
            setPaymentStatus("pending")
          },
          onError: () => {
            setPaymentStatus("failed")
          },
          onClose: () => {
            console.log("Snap checkout popup closed")
          }
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Mock confirm payment callback for sandbox simulation
  const handleMockPaymentSuccess = async () => {
    if (!orderId) return
    setCheckoutLoading(true)
    
    // Simulate API network call delay
    setTimeout(async () => {
      try {
        await api.payment.verify(orderId, "success")
        api.auth.updatePremiumStatus(true)
        setUser(getUser()) // Refresh auth user state in React
        await fetchCourseData() // Re-fetch course metadata to update enrollmentMode to 'verified'
        setPaymentStatus("success")
        
        // Auto close checkout popup
        setTimeout(() => {
          setCheckoutOpen(false)
          setPaymentStatus("idle")
        }, 2000)
      } catch (err) {
        alert("Konfirmasi pembayaran gagal.")
      } finally {
        setCheckoutLoading(false)
      }
    }, 1500)
  }

  // Nested Forum replies recursively render helper
  const renderReplies = (replies: any[], postId: number, level = 1) => {
    return replies.map((reply) => (
      <div key={reply.id} className="mt-4 space-y-3 pl-4 border-l border-border/80">
        <div className="flex items-start gap-3">
          <Avatar className="h-6 w-6 border bg-secondary/50 text-[10px] shrink-0 font-sans font-bold">
            <AvatarFallback>{reply.author.avatar || "M"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary">{reply.author.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                reply.author.role === "Dosen Pengampu" 
                  ? "bg-destructive/10 text-destructive border-destructive/20" 
                  : "bg-accent/15 text-primary border-accent/25"
              }`}>
                {reply.author.role}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(reply.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-primary leading-relaxed">{reply.content}</p>
            
            {/* Nesting reply action */}
            {level < 3 && (
              <div className="pt-1.5 flex flex-col gap-2 max-w-lg">
                {activeReplyToId === reply.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Balas komentar ini..."
                      value={replyContents[`reply-${reply.id}`] || ""}
                      onChange={(e) => setReplyContents(prev => ({ ...prev, [`reply-${reply.id}`]: e.target.value }))}
                      className="h-7 text-xs bg-white border border-border rounded-md focus:outline-none focus:border-[#060708]"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCreateReply(postId, reply.id)}
                      className="h-7 bg-[#060708] hover:bg-[#060708]/90 text-white text-[10px] px-3.5 rounded-md font-medium cursor-pointer shrink-0"
                    >
                      Kirim
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveReplyToId(null)}
                      className="h-7 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[10px] px-2.5 rounded-md font-medium cursor-pointer shrink-0"
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveReplyToId(reply.id)}
                    className="text-[10px] font-bold text-accent hover:text-[#060708] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer w-fit"
                  >
                    Balas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {reply.replies && reply.replies.length > 0 && (
          <div className="pl-2">
            {renderReplies(reply.replies, postId, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  // Pre-calculate workspace dimensions/proportions (Coursera-style: 5 sub-chapters per module)
  const totalSubChapters = (course?.modules?.length || 0) * 5
  const completedCount = completedSubChapters.length
  const progressPercent = totalSubChapters > 0 ? Math.min(100, Math.round((completedCount / totalSubChapters) * 100)) : 0

  // Flattened sequential sub-chapters list for sequential bottom navigation
  const flatSubChapters = React.useMemo(() => {
    if (!course) return []
    const items: SubChapter[] = []
    course.modules.forEach(mod => {
      items.push(...getSubChaptersForModule(mod))
    })
    return items
  }, [course])

  const activeIndex = flatSubChapters.findIndex(item => item.id === activeSubChapter?.id)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9FB] font-sans">
      {/* Midtrans Snap script injection */}
      <script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-dummy"}
        async
      />

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-10 w-10 text-[#CF3A1F] animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat Workspace Kelas...</p>
        </div>
      ) : error || !course ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h3 className="font-heading text-2xl font-bold text-primary">Detail Mata Kuliah Tidak Ditemukan</h3>
          <p className="text-sm text-muted-foreground">{error || "Terjadi kesalahan loading."}</p>
          <Button onClick={fetchCourseData} className="bg-destructive text-white text-xs px-4">Coba Lagi</Button>
        </div>
      ) : !isEnrolled ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto gap-6 bg-white border border-border rounded-2xl shadow-xl my-12">
          <BookOpen className="h-16 w-16 text-[#C6B5BF] animate-pulse" />
          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-black text-[#060708]">Anda Belum Mengambil Mata Kuliah Ini</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mata kuliah <strong>"{course.title}"</strong> ini memerlukan pengisian rencana studi aktif sebelum Anda dapat mengakses workspace materi kuliah, diskusi, dan evaluasi pembelajaran.
            </p>
          </div>
          <Button
            onClick={() => {
              router.push("/courses")
            }}
            className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/90 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer"
          >
            Kembali ke Katalog Mata Kuliah & KRS
          </Button>
        </div>
      ) : (
        <>
          {/* Collapsible Syllabus Sidebar - Coursera Style */}
          <aside className={`h-full border-r border-border bg-white flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
            isSyllabusCollapsed 
              ? "w-0 overflow-hidden border-r-0" 
              : "w-80"
          }`}>
            {/* Sidebar Header with Course Title & Close (X) button */}
            <div className="p-5 border-b border-border flex items-start justify-between">
              <h2 className="text-[#060708] font-heading font-black text-base leading-tight max-w-[85%]">
                {course.title}
              </h2>
              <button
                onClick={() => setIsSyllabusCollapsed(true)}
                className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer shrink-0"
                title="Tutup Silabus Mata Kuliah"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Progress Bar inside sidebar */}
            <div className="p-4 border-b border-border bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                <span>Kemajuan Belajar</span>
                <span>{progressPercent}% ({completedCount}/{totalSubChapters})</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-350/30">
                <div
                  className="bg-[#CF3A1F] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Audit Mode Alert */}
            {enrollmentMode === "audit" && (
              <div className="m-4 p-3 bg-amber-50 border border-amber-250 rounded-xl flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-bold">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Mode Audit (Akses Gratis)</span>
                </div>
                <p className="text-[9px] text-amber-700 leading-normal font-semibold">
                  Dapatkan akses lengkap untuk membuka Evaluasi Pembelajaran & Sertifikat Kompetensi.
                </p>
                <Button
                  onClick={handleCheckoutTrigger}
                  className="mt-1 w-full bg-[#060708] hover:bg-[#060708]/90 text-white text-[9px] font-extrabold h-7 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-[#C6B5BF]" />
                  Akses Kelas Lengkap
                </Button>
              </div>
            )}

            {/* Modules and Sub-Chapters scroll area */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {course.modules.map((mod) => {
                const isModulePremium = !!mod.is_premium
                const isUserPremium = user?.is_premium
                const isLocked = isModulePremium && !isUserPremium
                const isExpanded = !!expandedModules[mod.id]

                const subs = getSubChaptersForModule(mod)
                // Group subs by section
                const sections: Record<string, SubChapter[]> = {}
                subs.forEach(sub => {
                  if (!sections[sub.section]) {
                    sections[sub.section] = []
                  }
                  sections[sub.section].push(sub)
                })

                const completedInModule = subs.filter(s => completedSubChapters.includes(s.id)).length

                return (
                  <div key={mod.id} className="bg-white">
                    {/* Module accordion header */}
                    <button
                      onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                      className="w-full p-4 bg-white flex items-center justify-between text-left hover:bg-slate-50/40 transition-colors cursor-pointer border-b border-border/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Modul {mod.order}</span>
                          {isModulePremium && (
                            <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-0.5 shrink-0">
                              <Lock className="h-2 w-2" />
                              Premium
                            </span>
                          )}
                          {completedInModule === 5 && (
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              Selesai
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-[#060708] mt-0.5 leading-snug truncate">{mod.title}</h4>
                      </div>
                      <span className="text-slate-400 font-bold text-[9px] ml-2 select-none">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {/* Nested sub-chapters listed sequentially */}
                    {isExpanded && (
                      <div className="pb-4 bg-white space-y-0.5 px-2">
                        {subs.map((sub) => {
                          const isSubCompleted = completedSubChapters.includes(sub.id)
                          const isSubActive = activeSubChapter?.id === sub.id
                          
                          let typeLabel = "Video"
                          if (sub.type === "reading") typeLabel = "Materi Kuliah"
                          if (sub.type === "quiz") typeLabel = "Evaluasi"
                          if (sub.type === "forum") typeLabel = "Forum"

                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                if (isLocked && sub.type !== "forum") {
                                  // let user click to see lock promo screen
                                }
                                if (quizTaking) {
                                  if (!confirm("Evaluasi sedang berjalan. Beralih halaman akan membatalkan evaluasi ini. Lanjutkan?")) {
                                    return
                                  }
                                }
                                setActiveSubChapter(sub)
                                setActiveQuiz(null)
                                setQuizResult(null)
                                setQuizTaking(false)
                                setQuizTimerActive(false)
                              }}
                              className={`w-full p-2.5 rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer border ${
                                isSubActive
                                  ? "bg-slate-100/90 border-slate-200 shadow-3xs"
                                  : "hover:bg-slate-50 border-transparent"
                              }`}
                            >
                              {/* Completion circle checkmark */}
                              <div className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSubCompleted
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                  : isSubActive
                                    ? "bg-white border-slate-350"
                                    : "bg-slate-50 border-slate-200"
                              }`}>
                                {isSubCompleted ? (
                                  <Check className="h-3 w-3 stroke-[2.5]" />
                                ) : (
                                  <div className={`h-2 w-2 rounded-full ${
                                    isSubActive ? "bg-slate-400" : "bg-transparent"
                                  }`} />
                                )}
                              </div>
                              
                              {/* Sub-chapter metadata */}
                              <div className="flex-1 min-w-0">
                                <h5 className={`text-[11px] leading-snug font-bold ${
                                  isSubActive ? "text-[#060708]" : "text-slate-600"
                                }`}>
                                  {sub.title}
                                </h5>
                                <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 block">
                                  {typeLabel} • {sub.duration}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Main learning player pane */}
          <main className="flex-1 overflow-hidden flex flex-col bg-[#FAF9FB] relative h-full">
            
            {/* Top Minimalist Header */}
            <header className="flex h-14 shrink-0 items-center justify-between px-6 z-20 relative bg-white border-b border-border/80">
              {isSyllabusCollapsed ? (
                <button
                  onClick={() => setIsSyllabusCollapsed(false)}
                  className="h-9 px-3 bg-white border border-border shadow-3xs rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <Menu className="h-4 w-4" />
                  Silabus Mata Kuliah
                </button>
              ) : (
                <div />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="h-9 px-2.5 hover:bg-secondary/40 text-muted-foreground hover:text-primary gap-1.5 font-bold rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </header>

            {/* Scrollable Content Viewport */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
              <div className="max-w-4xl mx-auto w-full flex-1">
                
                {activeSubChapter ? (
                  (() => {
                    const isLocked = activeModule?.is_premium && !user?.is_premium

                    // Locked Premium screen
                    if (isLocked && activeSubItem !== "forum") {
                      return (
                        <Card className="border border-border bg-white rounded-2xl shadow-xs p-12 text-center flex flex-col items-center justify-center min-h-[380px] mt-4">
                          <div className="h-16 w-16 bg-destructive/10 text-destructive border border-destructive/20 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6" />
                          </div>
                          <h3 className="font-heading text-2xl font-bold text-primary">Modul Premium Terkunci</h3>
                          <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
                            Sub-bab ini merupakan bagian dari modul premium <strong>"{activeModule?.title}"</strong> yang berisi materi kuliah interaktif, bacaan mendalam, dan evaluasi pembelajaran.
                          </p>
                          <Button
                            onClick={handleCheckoutTrigger}
                            className="mt-6 bg-destructive hover:bg-destructive/90 text-white rounded-lg px-6 py-2.5 font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Sparkles className="h-4 w-4" />
                            Akses Premium Sekarang
                          </Button>
                        </Card>
                      )
                    }

                    return (
                      <div className="space-y-6">
                        
                        {/* 1. VIDEO VIEW */}
                        {activeSubItem === "video" && (
                          <Card className="border border-border bg-white rounded-2xl shadow-xs overflow-hidden">
                            <CardHeader className="border-b bg-white p-6">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {activeModule?.order} — Video</span>
                                {completedSubChapters.includes(activeSubChapter.id) && (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" />
                                    Selesai Ditonton
                                  </span>
                                )}
                              </div>
                              <CardTitle className="font-heading text-xl font-black text-primary mt-1">{activeSubChapter.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                              {activeSubChapter.video_url ? (
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-border">
                                  <iframe
                                    className="w-full h-full"
                                    src={activeSubChapter.video_url}
                                    title={activeSubChapter.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-border flex flex-col justify-between p-4 group">
                                  <div className="flex justify-between items-center text-white/80 text-[10px] font-semibold bg-gradient-to-b from-black/80 to-transparent p-3 absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <span>{activeSubChapter.title}</span>
                                    <span>12:45</span>
                                  </div>
                                  <div 
                                    onClick={() => markSubChapterAsCompleted(activeSubChapter.id)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-colors cursor-pointer z-0"
                                  >
                                    <div className="h-16 w-16 bg-[#CF3A1F] hover:bg-[#CF3A1F]/95 text-white rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                                      <Play className="h-6 w-6 fill-white ml-1" />
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                      <div className="bg-[#CF3A1F] h-full w-[45%]" />
                                    </div>
                                    <div className="flex justify-between items-center text-white text-[10px] font-semibold">
                                      <div className="flex items-center gap-3">
                                        <span>Play</span>
                                        <span>05:32 / 12:45</span>
                                      </div>
                                      <span>HD / Fullscreen</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF9FB] p-4 rounded-xl border border-border/60">
                                <div>
                                  <h5 className="text-xs font-bold text-primary">Status Penayangan</h5>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Tonton video hingga selesai untuk melengkapi aktivitas ini.</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => markSubChapterAsCompleted(activeSubChapter.id)}
                                  disabled={completedSubChapters.includes(activeSubChapter.id)}
                                  className={`font-bold text-xs rounded-lg cursor-pointer w-full sm:w-auto ${
                                    completedSubChapters.includes(activeSubChapter.id)
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                      : "bg-[#060708] hover:bg-[#060708]/90 text-white"
                                  }`}
                                >
                                  {completedSubChapters.includes(activeSubChapter.id) ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <Check className="h-3.5 w-3.5" />
                                      Sudah Ditonton
                                    </span>
                                  ) : (
                                    "Tandai Selesai Menonton"
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* 2. READING VIEW */}
                        {activeSubItem === "reading" && (
                          <Card className="border border-border bg-white rounded-2xl shadow-xs overflow-hidden">
                            <CardHeader className="border-b bg-white p-6">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {activeModule?.order} — Materi Kuliah</span>
                                {completedSubChapters.includes(activeSubChapter.id) && (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" />
                                    Selesai Dibaca
                                  </span>
                                )}
                              </div>
                              <CardTitle className="font-heading text-xl font-black text-primary mt-1">{activeSubChapter.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                              {/* RENDER RICH TEXTBOOK MATERIAL */}
                              {activeSubChapter && (() => {
                                if (activeSubChapter.content) {
                                  return (
                                    <div className="space-y-4 text-xs text-primary leading-relaxed font-sans prose prose-slate max-w-none">
                                      <div className="p-4 rounded-xl border border-[#C6B5BF]/40 bg-[#FAF9FB]/70 text-xs text-slate-600 font-serif leading-relaxed italic shrink-0">
                                        Materi kuliah mandiri untuk memperkuat pemahaman Anda dalam topik ini.
                                      </div>
                                      <div className="mt-3 text-slate-800 font-sans border border-border p-6 rounded-xl bg-white leading-loose text-[13px]">
                                        <MarkdownRenderer content={activeSubChapter.content} />
                                      </div>
                                    </div>
                                  )
                                }

                                const readingData = getReadingContent(course?.code || "IF101", activeModule?.order || 1, typeof activeSubChapter.id === "string" && activeSubChapter.id.endsWith("_sub3") ? 3 : 2, activeModule?.title || "");
                                return (
                                  <div className="space-y-6 text-[#060708]">
                                    <div className="p-4 rounded-xl border border-[#C6B5BF]/40 bg-[#FAF9FB]/70 text-xs italic text-slate-600 leading-relaxed font-serif">
                                      {readingData.introduction}
                                    </div>
                                    
                                    {readingData.sections.map((sect, sIdx) => (
                                      <div key={sIdx} className="space-y-3 pt-2">
                                        <h3 className="font-heading font-extrabold text-sm text-[#060708] border-b pb-1 border-slate-100 uppercase tracking-wide">
                                          {sect.heading}
                                        </h3>
                                        {sect.paragraphs.map((p, pIdx) => (
                                          <p key={pIdx} className="text-xs text-slate-700 leading-relaxed font-sans">
                                            {p}
                                          </p>
                                        ))}
                                        {sect.codeBlock && (
                                          <pre className="p-4 rounded-xl bg-[#060708] text-emerald-400 font-mono text-[10px] overflow-x-auto shadow-inner leading-relaxed border border-slate-800">
                                            <code>{sect.codeBlock}</code>
                                          </pre>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}


                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/10 p-4 rounded-xl border border-border/40">
                                <div>
                                  <h5 className="text-xs font-bold text-primary">Status Pembacaan</h5>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Tandai selesai jika Anda telah memahami materi kuliah ini.</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => markSubChapterAsCompleted(activeSubChapter.id)}
                                  disabled={completedSubChapters.includes(activeSubChapter.id)}
                                  className={`font-bold text-xs rounded-lg cursor-pointer w-full sm:w-auto ${
                                    completedSubChapters.includes(activeSubChapter.id)
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                      : "bg-[#060708] hover:bg-[#060708]/90 text-white"
                                  }`}
                                >
                                  {completedSubChapters.includes(activeSubChapter.id) ? (
                                    <span className="flex items-center justify-center gap-1">
                                      <Check className="h-3.5 w-3.5" />
                                      Sudah Dibaca
                                    </span>
                                  ) : (
                                    "Tandai Selesai Membaca"
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* 3. QUIZ VIEW */}
                        {activeSubItem === "quiz" && (
                          (() => {
                            if (enrollmentMode === "audit") {
                              return (
                                <Card className="border border-border bg-white rounded-2xl shadow-xs p-12 text-center flex flex-col items-center justify-center min-h-[380px] mt-4">
                                  <div className="h-16 w-16 bg-destructive/10 text-destructive border border-destructive/20 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="h-6 w-6" />
                                  </div>
                                  <h3 className="font-heading text-2xl font-bold text-primary">Evaluasi Pembelajaran Terkunci</h3>
                                  <p className="text-sm text-slate-600 max-w-md mt-2 leading-relaxed font-sans">
                                    Anda sedang mengakses kelas ini dalam <strong>Mode Audit (Gratis)</strong>. Evaluasi pembelajaran dan sertifikat kompetensi hanya tersedia bagi mahasiswa Kelas Terverifikasi.
                                  </p>
                                  <Button
                                    onClick={handleCheckoutTrigger}
                                    className="mt-6 bg-[#060708] hover:bg-[#060708]/90 text-white rounded-lg px-6 py-2.5 font-bold flex items-center gap-2 cursor-pointer shadow-sm text-xs"
                                  >
                                    <Sparkles className="h-4 w-4 text-[#C6B5BF]" />
                                    Akses Kelas Lengkap
                                  </Button>
                                </Card>
                              )
                            }

                            if (quizTaking && activeQuiz) {
                              return (
                                <Card className="border border-border bg-white rounded-2xl shadow-xs overflow-hidden">
                                  <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-6">
                                    <div>
                                      <CardTitle className="font-heading text-xl font-bold text-primary">{activeQuiz.title}</CardTitle>
                                      <CardDescription className="text-xs mt-1">Selesaikan seluruh pertanyaan sebelum waktu habis.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive shrink-0 font-mono font-bold text-sm">
                                      <Timer className="h-4 w-4" />
                                      <span>{formatTime(quizTimeLeft)}</span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-6 space-y-8">
                                    {activeQuiz.questions.map((q: any, idx: number) => {
                                      const selected = quizAnswers[q.id]
                                      return (
                                        <div key={q.id} className="space-y-3">
                                          <h4 className="text-sm font-semibold text-primary flex items-start gap-2">
                                            <span className="px-2 py-0.5 rounded bg-secondary text-primary text-xs font-bold font-sans">{idx + 1}</span>
                                            <span className="leading-relaxed">{q.text}</span>
                                          </h4>
                                          <div className="grid gap-2 pl-7">
                                            {q.options.map((opt: any) => {
                                              const isSelected = selected === opt.id
                                              return (
                                                <button
                                                  key={opt.id}
                                                  onClick={() => handleQuizAnswerSelect(q.id, opt.id)}
                                                  className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                                                    isSelected
                                                      ? "bg-[#060708] border-[#060708] text-white"
                                                      : "bg-background hover:bg-secondary/40 border-border"
                                                  }`}
                                                >
                                                  <span className={`h-5 w-5 rounded-full flex items-center justify-center border font-bold ${
                                                    isSelected ? "border-white bg-white/20 text-white" : "border-border bg-white text-muted-foreground"
                                                  }`}>
                                                    {opt.id}
                                                  </span>
                                                  <span>{opt.text}</span>
                                                </button>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </CardContent>
                                  <CardFooter className="border-t bg-secondary/15 p-4 flex items-center justify-between gap-4">
                                    <span className="text-xs text-muted-foreground">
                                      Terjawab: {Object.keys(quizAnswers).length} dari {activeQuiz.questions.length} soal
                                    </span>
                                    <Button
                                      onClick={handleQuizSubmit}
                                      className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs px-5 h-9 rounded-lg font-bold cursor-pointer"
                                    >
                                      Kirim Jawaban
                                    </Button>
                                  </CardFooter>
                                </Card>
                              )
                            }

                            if (quizResult && activeQuiz) {
                              const scoreColor = quizResult.score >= 60 ? "text-primary" : "text-destructive"
                              return (
                                <Card className="border border-border bg-white rounded-2xl shadow-xs overflow-hidden">
                                  <CardHeader className="border-b bg-white p-6 text-center">
                                    <h3 className="font-heading text-lg font-bold text-primary">Hasil Evaluasi Pembelajaran</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{activeQuiz.title}</p>
                                  </CardHeader>
                                  <CardContent className="p-6 space-y-6">
                                    {/* Score display */}
                                    <div className="flex flex-col items-center justify-center p-6 border border-border rounded-xl bg-background max-w-sm mx-auto text-center space-y-2">
                                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Skor Akhir</span>
                                      <span className={`text-6xl font-heading font-black ${scoreColor}`}>
                                        {quizResult.score}
                                      </span>
                                      <div className="text-xs font-semibold text-primary mt-1">
                                        {quizResult.passed ? (
                                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-bold">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            SELESAI & LULUS
                                          </span>
                                        ) : (
                                          <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1 font-bold">
                                            <XCircle className="h-3.5 w-3.5" />
                                            TIDAK LULUS (Min 60)
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-muted-foreground mt-2">
                                        Menjawab benar {quizResult.correct_count} dari {quizResult.total_questions} pertanyaan.
                                      </p>
                                    </div>

                                    {/* Review answers */}
                                    <div className="space-y-4 pt-4 border-t border-border">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tinjauan Pertanyaan</h4>
                                      {activeQuiz.questions.map((q: any, idx: number) => {
                                        const review = quizResult.details.find((d: any) => d.question_id === q.id)
                                        const isCorrect = review?.is_correct
                                        const submittedOpt = q.options.find((o: any) => o.id === review?.submitted)
                                        const correctOpt = q.options.find((o: any) => o.id === review?.correct)

                                        return (
                                          <div key={q.id} className="p-4 border rounded-lg bg-[#FAF9FB] space-y-2 text-xs">
                                            <div className="flex items-start justify-between gap-3">
                                              <h5 className="font-semibold text-primary leading-normal">
                                                {idx + 1}. {q.text}
                                              </h5>
                                              {isCorrect ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 text-[9px] font-bold shrink-0">
                                                  <Check className="h-2.5 w-2.5" />
                                                  Benar
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 flex items-center gap-0.5 text-[9px] font-bold shrink-0">
                                                  <XCircle className="h-2.5 w-2.5" />
                                                  Salah
                                                </span>
                                              )}
                                            </div>

                                            <div className="space-y-1.5 pl-2 pt-1 border-l-2 border-border/80">
                                              <p className="text-[11px] text-primary">
                                                Jawaban Anda: <strong className={isCorrect ? "text-primary" : "text-destructive"}>
                                                  {submittedOpt ? `(${submittedOpt.id}) ${submittedOpt.text}` : "(Tidak Dijawab)"}
                                                </strong>
                                              </p>
                                              {!isCorrect && (
                                                <p className="text-[11px] text-muted-foreground">
                                                  Jawaban Benar: <strong className="text-primary">
                                                    ({correctOpt.id}) {correctOpt.text}
                                                  </strong>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="border-t bg-secondary/15 p-4 flex items-center justify-between">
                                    <Button
                                      variant="ghost"
                                      onClick={handleResetQuiz}
                                      className="text-xs text-muted-foreground hover:text-primary hover:bg-secondary/45 cursor-pointer h-9 px-3 rounded-lg"
                                    >
                                      Kembali ke Halaman Evaluasi
                                    </Button>
                                    <Button
                                      onClick={() => activeModule && handleStartQuiz(activeModule.id)}
                                      className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs h-9 px-4 rounded-lg font-bold cursor-pointer"
                                    >
                                      Ulangi Evaluasi
                                    </Button>
                                  </CardFooter>
                                </Card>
                              )
                            }

                            // Default Quiz Landing View
                            return (
                              <Card className="border border-border bg-white rounded-2xl shadow-xs overflow-hidden">
                                <CardHeader className="border-b bg-white p-6">
                                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {activeModule?.order} — Evaluasi</span>
                                  {completedSubChapters.includes(activeSubChapter.id) && (
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Check className="h-2.5 w-2.5" />
                                      Lulus
                                    </span>
                                  )}
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                  <p className="text-sm text-primary leading-relaxed">
                                    Gunakan evaluasi ini untuk mengukur pemahaman Anda terkait materi kuliah yang telah dipelajari. Anda membutuhkan nilai minimal 60% untuk dinyatakan lulus modul ini.
                                  </p>
                                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground bg-secondary/10 p-3 rounded-xl border border-border/50 max-w-sm">
                                    <div className="flex items-center gap-1">
                                      <Timer className="h-4 w-4 text-[#CF3A1F]" />
                                      <span>Batas Waktu: 3 Menit</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                      <span>Passing Grade: 60</span>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="border-t bg-secondary/15 p-4 flex justify-end">
                                  <Button
                                    onClick={() => activeModule && handleStartQuiz(activeModule.id)}
                                    className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs h-9 px-4 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                                  >
                                    <HelpCircle className="h-4 w-4" />
                                    Mulai Evaluasi Pembelajaran
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          })()
                        )}

                        {/* 4. FORUM VIEW */}
                        {activeSubItem === "forum" && (
                          <div className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-3 items-start">
                              {/* Left Panel: Threads */}
                              <div className={`lg:col-span-1 space-y-3 ${activePost ? "hidden lg:block" : "block"}`}>
                                <div className="flex items-center justify-between px-1 mb-2">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Forum Diskusi</h3>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsCreatingPost(true)}
                                    className="h-8 px-2 text-xs text-[#CF3A1F] hover:text-[#CF3A1F]/80 hover:bg-[#CF3A1F]/10 rounded-md cursor-pointer flex items-center gap-1 font-semibold border border-transparent hover:border-[#CF3A1F]/20"
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span>Buat Diskusi Baru</span>
                                  </Button>
                                </div>

                                {forumPosts.length === 0 ? (
                                  <div className="text-xs text-muted-foreground p-6 border rounded-xl text-center bg-white">
                                    Belum ada diskusi di forum ini. Silakan mulai berdiskusi!
                                  </div>
                                ) : (
                                  <div className="space-y-2 pr-1">
                                    {forumPosts.map((post) => {
                                      const isActive = activePost?.id === post.id
                                      const replyCount = post.replies.length
                                      
                                      return (
                                        <button
                                          key={post.id}
                                          onClick={() => {
                                            setActivePost(post)
                                            setIsCreatingPost(false)
                                          }}
                                          className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                                            isActive 
                                              ? "bg-white border-primary shadow-xs" 
                                              : "bg-white hover:bg-secondary/20 border-border hover:border-accent-2/40"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground">
                                              {new Date(post.created_at).toLocaleDateString("id-ID")}
                                            </span>
                                            <span className="text-[10px] font-bold text-accent">•</span>
                                            <span className="text-[10px] font-semibold text-primary">{post.author.name}</span>
                                          </div>
                                          <h4 className="font-bold text-sm text-primary leading-snug line-clamp-1">{post.title}</h4>
                                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-accent uppercase tracking-wide">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>{replyCount} Balasan</span>
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Right Panel: Active Thread detail OR Creation Form */}
                              <div className="lg:col-span-2">
                                {isCreatingPost ? (
                                  <Card className="border border-border bg-white rounded-2xl shadow-xs">
                                    <CardHeader className="border-b bg-white">
                                      <CardTitle className="font-heading text-lg font-bold text-primary">Mulai Diskusi Baru</CardTitle>
                                      <CardDescription className="text-xs">Ajukan pertanyaan mengenai topik mata kuliah ini ke dosen pengampu dan sesama mahasiswa.</CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleCreatePost}>
                                      <CardContent className="p-6 space-y-4">
                                        <div className="space-y-1.5">
                                          <Label htmlFor="post-title" className="text-xs font-semibold text-primary">Judul Diskusi</Label>
                                          <Input
                                            id="post-title"
                                            placeholder="Masukkan judul singkat (cth: Masalah p(k+1) induksi)"
                                            value={newPostTitle}
                                            onChange={(e) => setNewPostTitle(e.target.value)}
                                            className="bg-white border border-border rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label htmlFor="post-content" className="text-xs font-semibold text-primary">Detail Pertanyaan</Label>
                                          <textarea
                                            id="post-content"
                                            rows={5}
                                            placeholder="Tuliskan pertanyaan Anda secara mendetail di sini..."
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            className="w-full bg-white border border-border rounded-lg p-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                          />
                                        </div>
                                      </CardContent>
                                      <CardFooter className="border-t bg-secondary/15 p-4 flex items-center justify-end gap-3">
                                        <Button
                                          variant="ghost"
                                          type="button"
                                          onClick={() => setIsCreatingPost(false)}
                                          className="text-xs text-muted-foreground hover:text-primary hover:bg-secondary/40 h-9 px-3 rounded-lg"
                                        >
                                          Batal
                                        </Button>
                                        <Button
                                          type="submit"
                                          className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs px-5 h-9 rounded-lg font-bold"
                                        >
                                          Kirim Pertanyaan
                                        </Button>
                                      </CardFooter>
                                    </form>
                                  </Card>
                                ) : activePost ? (
                                  <Card className="border border-border bg-white rounded-2xl shadow-xs">
                                    <CardHeader className="border-b bg-white flex flex-row items-start justify-between gap-4 p-6">
                                      <div className="space-y-1.5">
                                        {/* Back to threads button only visible on mobile layout */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setActivePost(null)}
                                          className="h-8 px-2 -ml-2 text-muted-foreground hover:text-primary hover:bg-secondary/40 gap-1 lg:hidden"
                                        >
                                          <ArrowLeft className="h-4 w-4" />
                                          <span>Kembali ke List</span>
                                        </Button>
                                        
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8 border bg-secondary/50 font-sans font-bold">
                                            <AvatarFallback>{activePost.author.avatar || "M"}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs font-bold text-primary">{activePost.author.name}</span>
                                              <span className="text-[9px] font-bold px-1 py-0.5 rounded border bg-accent/20 text-primary border-accent/30">
                                                {activePost.author.role}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                              Ditanyakan pada {new Date(activePost.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <CardTitle className="font-heading text-lg font-bold text-primary pt-3">{activePost.title}</CardTitle>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                      <p className="text-sm text-primary leading-relaxed border-b border-border pb-6">
                                        {activePost.content}
                                      </p>

                                      {/* Replies Thread list */}
                                      <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                          Balasan ({activePost.replies.length})
                                        </h4>
                                        {activePost.replies.length === 0 ? (
                                          <p className="text-xs text-muted-foreground italic text-center py-4 bg-background border rounded-lg">
                                            Belum ada balasan. Tulis tanggapan Anda di bawah!
                                          </p>
                                        ) : (
                                          <div className="space-y-2">
                                            {renderReplies(activePost.replies, activePost.id, 1)}
                                          </div>
                                        )}
                                      </div>

                                      {/* Reply Form */}
                                      <div className="pt-6 border-t border-border space-y-3">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tulis Tanggapan Anda</h5>
                                        <div className="space-y-3">
                                          <textarea
                                            rows={3}
                                            placeholder="Berikan jawaban atau tanggapan Anda..."
                                            value={replyContents[`post-${activePost.id}`] || ""}
                                            onChange={(e) => setReplyContents(prev => ({ ...prev, [`post-${activePost.id}`]: e.target.value }))}
                                            className="w-full bg-white border border-border rounded-lg p-3 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                          />
                                          <Button
                                            onClick={() => handleCreateReply(activePost.id, null)}
                                            className="bg-[#060708] hover:bg-[#060708]/90 text-white text-xs px-4 h-9 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            Kirim Tanggapan
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  <div className="text-center text-muted-foreground p-12 border border-dashed rounded-2xl bg-white min-h-[300px] flex flex-col items-center justify-center">
                                    <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <h4 className="font-heading text-lg font-bold text-[#060708]">Forum Diskusi Mata Kuliah</h4>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                      Pilih pertanyaan dari panel samping untuk melihat detail pembahasan, atau klik "Buat Diskusi Baru" untuk mengajukan pertanyaan baru.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF9FB] p-4 rounded-xl border border-border/60">
                              <div>
                                <h5 className="text-xs font-bold text-primary">Partisipasi Diskusi</h5>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Tandai selesai jika Anda telah membaca atau berdiskusi di modul ini.</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => markSubChapterAsCompleted(activeSubChapter.id)}
                                disabled={completedSubChapters.includes(activeSubChapter.id)}
                                className={`font-bold text-xs rounded-lg cursor-pointer w-full sm:w-auto ${
                                  completedSubChapters.includes(activeSubChapter.id)
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-[#060708] hover:bg-[#060708]/90 text-white"
                                }`}
                              >
                                {completedSubChapters.includes(activeSubChapter.id) ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <Check className="h-3.5 w-3.5" />
                                    Selesai
                                  </span>
                                ) : (
                                  "Tandai Selesai"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-center text-muted-foreground p-12 border border-dashed rounded-xl bg-white">
                    Pilih sub-bab di panel samping untuk memulai belajar.
                  </div>
                )}
              </div>

              {/* Bottom Navigation controls */}
              {activeSubChapter && (
                (() => {
                  const isLocked = activeModule?.is_premium && !user?.is_premium
                  if (isLocked && activeSubItem !== "forum") return null
                  
                  return (
                    <footer className="border-t border-border/80 bg-white p-4 flex items-center justify-between shrink-0 shadow-xs z-20 rounded-xl mt-8 max-w-4xl w-full mx-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (activeIndex > 0) {
                            const prevItem = flatSubChapters[activeIndex - 1]
                            setActiveSubChapter(prevItem)
                            setExpandedModules(prev => ({ ...prev, [prevItem.module.id]: true }))
                            setActiveQuiz(null)
                            setQuizResult(null)
                            setQuizTaking(false)
                            setQuizTimerActive(false)
                          }
                        }}
                        disabled={activeIndex <= 0}
                        className="text-xs border-border hover:bg-slate-100/60 text-primary gap-1 font-bold rounded-lg h-9"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                      </Button>

                      <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider hidden md:inline-block">
                        Lengkapi tiap sub-bab materi kuliah secara berurutan
                      </div>

                      {activeIndex < flatSubChapters.length - 1 ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            // Mark current as completed
                            markSubChapterAsCompleted(activeSubChapter.id)
                            
                            // Navigate to next
                            const nextItem = flatSubChapters[activeIndex + 1]
                            setActiveSubChapter(nextItem)
                            setExpandedModules(prev => ({ ...prev, [nextItem.module.id]: true }))
                            setActiveQuiz(null)
                            setQuizResult(null)
                            setQuizTaking(false)
                            setQuizTimerActive(false)
                          }}
                          className="bg-[#060708] hover:bg-[#060708]/95 text-white text-xs gap-1 font-bold rounded-lg h-9 shadow-sm"
                        >
                          Tandai Selesai & Lanjut
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            markSubChapterAsCompleted(activeSubChapter.id)
                            alert("Selamat! Anda telah menyelesaikan seluruh sub-bab pembelajaran pada mata kuliah ini. Semoga sukses dalam ujian akhir!")
                          }}
                          className="bg-[#CF3A1F] hover:bg-[#CF3A1F]/95 text-white text-xs gap-1 font-bold rounded-lg h-9 shadow-sm"
                        >
                          Selesaikan Mata Kuliah
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </footer>
                  )
                })()
              )}
            </div>
          </main>
        </>
      )}

      {/* Premium Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/45 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-white border border-border shadow-2xl rounded-xl overflow-hidden p-6 relative">
            <button
              onClick={() => {
                setCheckoutOpen(false)
                setPaymentStatus("idle")
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-primary h-8 w-8 cursor-pointer rounded-full border border-transparent hover:border-border flex items-center justify-center"
              disabled={checkoutLoading}
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-destructive animate-pulse" />
                Upgrade Belajara Premium
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Buka seluruh modul kuliah, latihan terstruktur, dan evaluasi pembelajaran selamanya.
              </p>
            </div>

            {paymentStatus === "success" ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]">
                <div className="h-12 w-12 bg-accent/25 text-primary border border-accent/40 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 font-bold" />
                </div>
                <h4 className="font-heading text-lg font-bold text-primary">Upgrade Premium Berhasil!</h4>
                <p className="text-xs text-muted-foreground">Membuka seluruh materi dan evaluasi mata kuliah Anda...</p>
              </div>
            ) : checkoutLoading ? (
              <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[220px]">
                <Loader2 className="h-10 w-10 text-accent animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-heading text-base font-bold text-primary">Menghubungi Server Pembayaran</h4>
                  <p className="text-xs text-muted-foreground">Mengambil token transaksi Midtrans Snap...</p>
                </div>
              </div>
            ) : (
              // Mock Midtrans Gateway Overlay UI (Fallback if snap.js does not trigger)
              <div className="space-y-4">
                <div className="p-4 border rounded-xl bg-background flex items-center justify-between border-border/80">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metode Upgrade</p>
                    <p className="text-sm font-bold text-primary">Akses Premium Belajara</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground line-through">Rp 149.000</p>
                    <p className="text-sm font-heading font-bold text-destructive">Rp 49.000</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMockPaymentMethod("gopay")}
                      className={`p-3 border rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
                        mockPaymentMethod === "gopay" 
                          ? "bg-primary border-primary text-white" 
                          : "bg-white hover:bg-secondary/40 border-border"
                      }`}
                    >
                      GoPay / QRIS
                    </button>
                    <button
                      onClick={() => setMockPaymentMethod("va")}
                      className={`p-3 border rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
                        mockPaymentMethod === "va" 
                          ? "bg-primary border-primary text-white" 
                          : "bg-white hover:bg-secondary/40 border-border"
                      }`}
                    >
                      Virtual Account
                    </button>
                  </div>
                </div>

                {mockPaymentMethod === "va" ? (
                  <div className="p-3.5 border rounded-lg bg-background text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Nomor Virtual Account</span>
                      <span className="font-mono font-bold text-primary">8819082201010101</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-semibold text-primary">Bank Mandiri (Mandiri VA)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1 border-t pt-1.5">
                      Instruksi: Transfer sesuai nominal di atas ke nomor VA yang tertera. Pembayaran diverifikasi dalam waktu maksimal 1 menit.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 border rounded-lg bg-[#FAF9FB] flex flex-col items-center justify-center gap-2">
                    <div className="h-28 w-28 bg-white border border-border rounded-lg p-1 flex items-center justify-center shrink-0">
                      {/* Simulating QR code */}
                      <div className="grid grid-cols-4 gap-1 w-full h-full bg-[#060708]/10 p-2">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 2 ? "bg-[#060708]" : "bg-transparent"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Scan QRIS menggunakan GoPay, OVO, ShopeePay, atau aplikasi Bank Transfer Anda.</p>
                  </div>
                )}

                <Button
                  onClick={handleMockPaymentSuccess}
                  className="w-full bg-destructive hover:bg-destructive/95 text-white cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-xs"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  Konfirmasi Bayar Rp 49.000
                </Button>
                
                <p className="text-[9px] text-[#060708] text-center italic mt-1">Menggunakan integrasi pembayaran Midtrans Snap Sandbox.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
