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
  CornerDownRight, 
  PlusCircle, 
  CreditCard,
  Check,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { api, getUser } from "@/lib/api"

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

export default function CourseDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const courseCode = resolvedParams.code

  const [user, setUser] = React.useState<any>(null)
  const [course, setCourse] = React.useState<Course | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Navigation states
  const [activeTab, setActiveTab] = React.useState<"syllabus" | "forum">("syllabus")
  const [activeModule, setActiveModule] = React.useState<Module | null>(null)

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

  // Fetch course details
  const fetchCourseData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.courses.get(courseCode)
      setCourse(data)
      if (data && data.modules && data.modules.length > 0) {
        setActiveModule(data.modules[0])
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
    if (activeTab === "forum") {
      fetchForumData()
    }
  }, [activeTab, fetchForumData])

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
        alert("Belum ada kuis untuk modul ini.")
      }
    } catch (err) {
      alert("Gagal memuat kuis.")
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
    } catch (err) {
      alert("Gagal mengirimkan kuis.")
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
    setCheckoutOpen(true)
    setCheckoutLoading(true)
    setPaymentStatus("idle")
    setSnapToken(null)
    try {
      const response = await api.payment.checkout()
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
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Balas komentar ini..."
                    value={replyContents[`reply-${reply.id}`] || ""}
                    onChange={(e) => setReplyContents(prev => ({ ...prev, [`reply-${reply.id}`]: e.target.value }))}
                    className="h-7 text-xs bg-white border-border rounded-md"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCreateReply(postId, reply.id)}
                    className="h-7 bg-primary text-white text-[10px] px-2 rounded-md font-medium"
                  >
                    Balas
                  </Button>
                </div>
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

  return (
    <SidebarProvider>
      {/* Midtrans Snap script injection */}
      <script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-dummy"}
        async
      />

      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-sm font-semibold text-primary flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/courses")}
              className="h-8 px-2 hover:bg-secondary/40 text-muted-foreground hover:text-primary gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <span>/</span>
            <span>{courseCode}</span>
          </div>
        </header>

        {loading ? (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="md:col-span-1 h-80 rounded-xl" />
              <Skeleton className="md:col-span-2 h-80 rounded-xl" />
            </div>
          </div>
        ) : error || !course ? (
          <div className="p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h3 className="font-heading text-xl font-bold text-primary">Detail Mata Kuliah Tidak Ditemukan</h3>
            <p className="text-sm text-muted-foreground">{error || "Terjadi kesalahan loading."}</p>
            <Button onClick={fetchCourseData} className="bg-destructive text-white text-xs px-4">Coba Lagi</Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6 p-6 bg-background font-sans">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-accent/20 text-primary border border-accent/30 font-sans">
                    {course.code}
                  </span>
                  <span className="text-xs text-muted-foreground">{course.department} | Semester {course.semester}</span>
                </div>
                <h1 className="text-3xl font-heading font-bold text-primary mt-1">
                  {course.title}
                </h1>
                <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                  {course.description}
                </p>
              </div>

              {user && !user.is_premium && (
                <Card className="border border-accent bg-accent/10 p-4 rounded-xl flex items-center justify-between gap-4 max-w-sm shrink-0">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-primary flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-destructive" />
                      Akses Premium Terkunci
                    </div>
                    <p className="text-[10px] text-muted-foreground">Dapatkan solusi AI lengkap, materi induksi, dan kuis lanjutan.</p>
                  </div>
                  <Button
                    onClick={handleCheckoutTrigger}
                    className="bg-destructive hover:bg-destructive/95 text-white text-xs h-8 px-3 rounded-lg font-semibold shrink-0 cursor-pointer shadow-sm"
                  >
                    Buka Premium
                  </Button>
                </Card>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab("syllabus")}
                className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 px-1 cursor-pointer ${
                  activeTab === "syllabus"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Silabus & Kuis</span>
              </button>
              <button
                onClick={() => setActiveTab("forum")}
                className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 px-1 cursor-pointer ${
                  activeTab === "forum"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Forum Diskusi</span>
              </button>
            </div>

            {/* Content Switcher */}
            {activeTab === "syllabus" ? (
              <div className="grid gap-6 lg:grid-cols-3 items-start">
                {/* Left Panel: Module Lists */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">Daftar Modul Silabus</h3>
                  {course.modules.map((mod) => {
                    const isModulePremium = !!mod.is_premium
                    const isUserPremium = user?.is_premium
                    const isLocked = isModulePremium && !isUserPremium
                    const isActive = activeModule?.id === mod.id

                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          if (!quizTaking) {
                            setActiveModule(mod)
                            setActiveQuiz(null)
                            setQuizResult(null)
                          } else {
                            if (confirm("Kuis sedang berjalan. Beralih modul akan membatalkan kuis ini. Lanjutkan?")) {
                              setQuizTaking(false)
                              setQuizTimerActive(false)
                              setActiveModule(mod)
                              setActiveQuiz(null)
                              setQuizResult(null)
                            }
                          }
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isActive 
                            ? "bg-white border-primary shadow-sm" 
                            : "bg-white hover:bg-secondary/20 border-border hover:border-accent/40"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-md ${isActive ? "bg-primary text-white" : "bg-secondary text-primary"}`}>
                          <PlayCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {mod.order}</span>
                            {isModulePremium && (
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-0.5">
                                <Lock className="h-2 w-2" />
                                Premium
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-primary mt-1 truncate">{mod.title}</h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">{mod.description}</p>
                        </div>
                        {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground/60 self-center" />}
                      </button>
                    )
                  })}
                </div>

                {/* Right Panel: Module Details or Quiz Taking */}
                <div className="lg:col-span-2 space-y-6">
                  {activeModule ? (
                    (() => {
                      const isLocked = activeModule.is_premium && !user?.is_premium

                      if (isLocked) {
                        return (
                          <Card className="border border-border bg-white rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                            <Lock className="h-12 w-12 text-muted-foreground/60 mb-4" />
                            <h3 className="font-heading text-2xl font-bold text-primary">Modul Premium Terkunci</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed">
                              Modul <strong>"{activeModule.title}"</strong> berisi materi pembelajaran lanjutan dan kuis kompetensi yang dikurasi khusus untuk pengguna Premium.
                            </p>
                            <Button
                              onClick={handleCheckoutTrigger}
                              className="mt-6 bg-destructive hover:bg-destructive/90 text-white rounded-lg px-6 py-2.5 font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Sparkles className="h-4 w-4" />
                              Upgrade Ke Premium Sekarang
                            </Button>
                          </Card>
                        )
                      }

                      // If Quiz is active and currently being taken
                      if (quizTaking && activeQuiz) {
                        return (
                          <Card className="border border-border bg-white rounded-xl shadow-md overflow-hidden">
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
                            <CardContent className="p-6 space-y-8 max-h-[500px] overflow-y-auto">
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
                                            className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-3 cursor-pointer ${
                                              isSelected
                                                ? "bg-primary border-primary text-white"
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
                                className="bg-primary hover:bg-primary/95 text-white text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
                              >
                                Selesaikan Kuis
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      }

                      // If Quiz is finished and showing grading results
                      if (quizResult && activeQuiz) {
                        const scoreColor = quizResult.score >= 60 ? "text-primary" : "text-destructive"
                        return (
                          <Card className="border border-border bg-white rounded-xl shadow-md overflow-hidden">
                            <CardHeader className="border-b bg-white p-6 text-center">
                              <h3 className="font-heading text-lg font-bold text-primary">Hasil Evaluasi Kuis</h3>
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
                                    <span className="px-3 py-1 rounded-full bg-accent/25 text-primary border border-accent/40 flex items-center gap-1 font-bold">
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      LULUS KUIS
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
                              <div className="space-y-4 pt-4 border-t">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tinjauan Pertanyaan</h4>
                                {activeQuiz.questions.map((q: any, idx: number) => {
                                  const review = quizResult.details.find((d: any) => d.question_id === q.id)
                                  const isCorrect = review?.is_correct
                                  const submittedOpt = q.options.find((o: any) => o.id === review?.submitted)
                                  const correctOpt = q.options.find((o: any) => o.id === review?.correct)

                                  return (
                                    <div key={q.id} className="p-4 border rounded-lg bg-background space-y-2 text-xs">
                                      <div className="flex items-start justify-between gap-3">
                                        <h5 className="font-semibold text-primary leading-normal">
                                          {idx + 1}. {q.text}
                                        </h5>
                                        {isCorrect ? (
                                          <span className="px-2 py-0.5 rounded-full bg-accent/25 text-primary border border-accent/35 flex items-center gap-0.5 text-[9px] font-bold shrink-0">
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
                                className="text-xs text-muted-foreground hover:text-primary hover:bg-secondary/40 cursor-pointer h-9 px-3 rounded-lg"
                              >
                                Kembali ke Modul
                              </Button>
                              <Button
                                onClick={() => handleStartQuiz(activeModule.id)}
                                className="bg-primary hover:bg-primary/95 text-white text-xs h-9 px-4 rounded-lg font-semibold cursor-pointer"
                              >
                                Coba Kuis Lagi
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      }

                      // Default Module Content Page
                      return (
                        <Card className="border border-border bg-white rounded-xl shadow-sm overflow-hidden">
                          <CardHeader className="border-b bg-white p-6">
                            <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Modul {activeModule.order}</span>
                            <CardTitle className="font-heading text-2xl font-bold text-primary mt-1">{activeModule.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Deskripsi Pembelajaran</h4>
                              <p className="text-sm text-primary leading-relaxed">{activeModule.description}</p>
                            </div>

                            {/* Syllabus materials content */}
                            <div className="pt-4 border-t space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Materi Pembelajaran</h4>
                              <div className="p-4 border border-border rounded-lg bg-background space-y-4">
                                <p className="text-xs text-primary leading-relaxed">
                                  Silakan baca materi pendukung yang disediakan pengajar untuk menguasai topik bahasan ini. Setelah memahami materi, Anda dapat menguji pemahaman dengan mengambil kuis interaktif di bawah.
                                </p>
                                <div className="flex items-center gap-3 p-3 border rounded bg-white max-w-md cursor-pointer hover:border-accent transition-all">
                                  <div className="h-8 w-8 bg-destructive/10 text-destructive border border-destructive/20 rounded flex items-center justify-center shrink-0">
                                    <BookOpen className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-primary">Slide Kuliah - Modul {activeModule.order}.pdf</p>
                                    <p className="text-[10px] text-muted-foreground">PDF Dokumen | 1.8 MB</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t bg-secondary/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground text-center sm:text-left">
                              <h5 className="font-bold text-primary">Kuis Evaluasi</h5>
                              <p className="mt-0.5">Uji pemahaman Anda sebelum berlanjut ke modul berikutnya.</p>
                            </div>
                            <Button
                              onClick={() => handleStartQuiz(activeModule.id)}
                              className="bg-primary hover:bg-primary/95 text-white text-xs h-9 px-4 rounded-lg font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                              <HelpCircle className="h-4.5 w-4.5" />
                              Mulai Kuis Interaktif
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })()
                  ) : (
                    <div className="text-center text-muted-foreground p-12 border border-dashed rounded-xl bg-white">
                      Pilih modul di panel kiri untuk memulai belajar.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Forum Diskusi Tab View
              <div className="grid gap-6 lg:grid-cols-3 items-start">
                {/* Left Panel: Threads */}
                <div className={`lg:col-span-1 space-y-3 ${activePost ? "hidden lg:block" : "block"}`}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diskusi Aktif</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsCreatingPost(true)}
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Buat Post</span>
                    </Button>
                  </div>

                  {forumPosts.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-6 border rounded-xl text-center bg-white">
                      Belum ada forum diskusi. Jadilah yang pertama bertanya!
                    </div>
                  ) : (
                    forumPosts.map((post) => {
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
                              ? "bg-white border-primary shadow-sm" 
                              : "bg-white hover:bg-secondary/20 border-border hover:border-accent/40"
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
                    })
                  )}
                </div>

                {/* Right Panel: Active Thread detail OR Creation Form */}
                <div className="lg:col-span-2">
                  {isCreatingPost ? (
                    <Card className="border border-border bg-white rounded-xl shadow-sm">
                      <CardHeader className="border-b bg-white">
                        <CardTitle className="font-heading text-lg font-bold text-primary">Buat Pertanyaan Baru</CardTitle>
                        <CardDescription className="text-xs">Ajukan pertanyaan mengenai topik kuliah ini ke dosen dan sesama mahasiswa.</CardDescription>
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
                            className="bg-primary hover:bg-primary/95 text-white text-xs px-5 h-9 rounded-lg font-semibold"
                          >
                            Kirim Diskusi
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>
                  ) : activePost ? (
                    <Card className="border border-border bg-white rounded-xl shadow-sm">
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

                        {/* Reply Form (Root comment to Post) */}
                        <div className="pt-6 border-t space-y-3">
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
                              className="bg-primary hover:bg-primary/95 text-white text-xs px-4 h-9 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              Kirim Tanggapan
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center text-muted-foreground p-12 border border-dashed rounded-xl bg-white min-h-[350px] flex flex-col items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <h4 className="font-heading text-lg font-bold text-primary">Forum Diskusi Kelas</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Pilih pertanyaan dari panel samping untuk melihat detail pembahasan, atau klik "Buat Post" untuk mengajukan pertanyaan baru.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SidebarInset>

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
              <XCircle className="h-5 w-5" />
            </button>
            
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-destructive animate-pulse" />
                Upgrade Belajara Premium
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Buka seluruh modul kurikulum, generator latihan AI, dan evaluasi kuis terarah selamanya.
              </p>
            </div>

            {paymentStatus === "success" ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[220px]">
                <div className="h-12 w-12 bg-accent/25 text-primary border border-accent/40 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 font-bold" />
                </div>
                <h4 className="font-heading text-lg font-bold text-primary">Upgrade Premium Berhasil!</h4>
                <p className="text-xs text-muted-foreground">Membuka seluruh materi dan kuis kelas Anda...</p>
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
                  <div className="p-3.5 border rounded-lg bg-background flex flex-col items-center justify-center gap-2">
                    <div className="h-28 w-28 bg-white border rounded p-1 flex items-center justify-center shrink-0">
                      {/* Simulating QR code */}
                      <div className="grid grid-cols-4 gap-1 w-full h-full bg-primary/10 p-2">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 2 ? "bg-primary" : "bg-transparent"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Scan QRIS menggunakan GoPay, OVO, ShopeePay, atau aplikasi Bank Transfer Anda.</p>
                  </div>
                )}

                <Button
                  onClick={handleMockPaymentSuccess}
                  className="w-full bg-destructive hover:bg-destructive/95 text-white cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  Konfirmasi Bayar Rp 49.000
                </Button>
                
                <p className="text-[9px] text-muted-foreground text-center italic mt-1">Menggunakan integrasi pembayaran Midtrans Snap Sandbox.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </SidebarProvider>
  )
}
