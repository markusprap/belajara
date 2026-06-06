// Frontend API Client with JWT storage & mock fallbacks
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export function getUser() {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function setUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || errData.message || "Request failed");
  }

  return response.json();
}

// Mock Data Storage for Fallbacks
const MOCK_QUIZZES: Record<number, any[]> = {
  // mapped by module id
  1: [
    {
      id: 101,
      title: "Kuis Pengantar Logika Matematika & Proposisi",
      time_limit: 180, // 3 minutes
      questions: [
        {
          id: 1,
          text: "Manakah dari pernyataan berikut yang merupakan proposisi?",
          options: [
            { id: "A", text: "Apakah hari ini hujan?" },
            { id: "B", text: "Tolong buka pintunya!" },
            { id: "C", text: "5 adalah bilangan prima." },
            { id: "D", text: "x + 2 = 5." }
          ],
          correct: "C"
        },
        {
          id: 2,
          text: "Jika P bernilai True dan Q bernilai False, tentukan nilai kebenaran dari P ∧ Q (konjungsi).",
          options: [
            { id: "A", text: "True" },
            { id: "B", text: "False" },
            { id: "C", text: "Tidak dapat ditentukan" },
            { id: "D", text: "Semua salah" }
          ],
          correct: "B"
        },
        {
          id: 3,
          text: "Himpunan kuasa (power set) dari himpunan A = {1, 2} memiliki berapa elemen?",
          options: [
            { id: "A", text: "2" },
            { id: "B", text: "4" },
            { id: "C", text: "8" },
            { id: "D", text: "16" }
          ],
          correct: "B"
        }
      ]
    }
  ],
  2: [
    {
      id: 102,
      title: "Kuis Teori Himpunan & Operasi Himpunan",
      time_limit: 120, // 2 minutes
      questions: [
        {
          id: 4,
          text: "Jika A = {1, 2, 3} dan B = {3, 4, 5}, maka A ∩ B (irisan) adalah...",
          options: [
            { id: "A", text: "{1, 2, 3, 4, 5}" },
            { id: "B", text: "{3}" },
            { id: "C", text: "{1, 2}" },
            { id: "D", text: "{4, 5}" }
          ],
          correct: "B"
        }
      ]
    }
  ],
  3: [
    {
      id: 103,
      title: "Kuis Relasi & Fungsi",
      time_limit: 120,
      questions: [
        {
          id: 5,
          text: "Sebuah fungsi f: A -> B disebut injektif (satu-satu) jika...",
          options: [
            { id: "A", text: "Setiap elemen B mempunyai tepat satu pra-peta di A." },
            { id: "B", text: "Elemen yang berbeda di A memiliki peta yang berbeda di B." },
            { id: "C", text: "Daerah hasil fungsi sama dengan B." },
            { id: "D", text: "Setiap elemen A dipetakan ke elemen yang sama di B." }
          ],
          correct: "B"
        }
      ]
    }
  ],
  4: [
    {
      id: 104,
      title: "Kuis Induksi Matematika [PREMIUM]",
      time_limit: 240, // 4 minutes
      questions: [
        {
          id: 6,
          text: "Langkah pertama dalam membuktikan p(n) benar untuk semua n >= 1 menggunakan Induksi Matematika disebut...",
          options: [
            { id: "A", text: "Basis Induksi (Inductive Base)" },
            { id: "B", text: "Langkah Induksi (Inductive Step)" },
            { id: "C", text: "Hipotesis Induksi" },
            { id: "D", text: "Deduksi Logis" }
          ],
          correct: "A"
        },
        {
          id: 7,
          text: "Pada pembuktian induktif, jika kita asumsikan p(k) benar, kita harus membuktikan bahwa...",
          options: [
            { id: "A", text: "p(k-1) benar" },
            { id: "B", text: "p(k+1) benar" },
            { id: "C", text: "p(2k) benar" },
            { id: "D", text: "p(1) benar" }
          ],
          correct: "B"
        }
      ]
    }
  ]
};

const MOCK_FORUM_POSTS: Record<string, any[]> = {
  "IF101": [
    {
      id: 201,
      title: "Kebingungan pada Pembuktian Induksi Matematika",
      content: "Halo teman-teman, apakah ada yang bisa menjelaskan bagian basis induksi dan langkah induksi? Saya masih agak bingung di langkah p(k+1) harus dibuktikan benar dari p(k). Terima kasih!",
      author: { name: "Budi Santoso", role: "Mahasiswa", avatar: "BS" },
      created_at: "2026-06-01T10:00:00Z",
      replies: [
        {
          id: 202,
          content: "Basis induksi adalah membuktikan rumus benar untuk kasus terkecil (biasanya n=1). Langkah induksi adalah mengasumsikan rumus benar untuk n=k, lalu membuktikannya benar untuk n=k+1. Kuncinya ada di mensubstitusikan persamaan n=k ke n=k+1.",
          author: { name: "Dr. Ir. Ahmad Yani", role: "Dosen Pengampu", avatar: "AY" },
          created_at: "2026-06-01T11:15:00Z",
          replies: [
            {
              id: 203,
              content: "Ooh saya paham sekarang pak! Jadi kita gunakan kebenaran P(k) untuk menyederhanakan suku-suku di P(k+1).",
              author: { name: "Budi Santoso", role: "Mahasiswa", avatar: "BS" },
              created_at: "2026-06-01T12:00:00Z",
              replies: []
            }
          ]
        },
        {
          id: 204,
          content: "Coba tonton video tambahan di Modul 2 bagian Induksi Matematika, di situ penjelasannya sangat visual.",
          author: { name: "Siti Rahma", role: "Mahasiswa", avatar: "SR" },
          created_at: "2026-06-01T14:30:00Z",
          replies: []
        }
      ]
    },
    {
      id: 205,
      title: "Jadwal Kuis Minggu Depan",
      content: "Apakah kuis Matematika Diskrit bersifat open book atau closed book? Ada info?",
      author: { name: "Rian Hidayat", role: "Mahasiswa", avatar: "RH" },
      created_at: "2026-06-02T08:00:00Z",
      replies: [
        {
          id: 206,
          content: "Closed book dan menggunakan timer otomatis di sistem Belajara selama 15 menit.",
          author: { name: "Dr. Ir. Ahmad Yani", role: "Dosen Pengampu", avatar: "AY" },
          created_at: "2026-06-02T08:30:00Z",
          replies: []
        }
      ]
    }
  ]
};

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      try {
        const data = await request("/auth/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setToken(data.token || data.access);
        
        // Fetch real user details after successful login
        try {
          const userProfile = await request("/auth/me/");
          setUser(userProfile);
          data.user = userProfile;
        } catch (profileErr) {
          console.warn("Failed retrieving user profile after login:", profileErr);
        }
        
        return data;
      } catch (err: any) {
        // If the backend is running and explicitly rejects credentials, throw the error
        if (err.message && (
          err.message.includes("No active account") || 
          err.message.includes("credentials") || 
          err.message.includes("401") || 
          err.message.includes("Request failed")
        )) {
          throw err;
        }

        console.warn("API login failed, using mock auth session:", err);
        if (username.length >= 3) {
          const mockUser = {
            id: 1,
            username: username,
            email: `${username}@belajara.id`,
            first_name: username.charAt(0).toUpperCase() + username.slice(1),
            last_name: "Santoso",
            is_mahasiswa: true,
            is_premium: (username === "premium" || username === "pro") ? true : false,
            is_onboarded: true,
            subscription_tier: username === "pro" ? "pro" : (username === "premium" ? "scholar" : "free"),
            nim: "2201010101",
            jurusan: "Informatika",
            universitas: "Universitas Indonesia",
            semester: 3
          };
          const mockData = {
            token: "mock-jwt-token-xyz-123456",
            user: mockUser,
          };
          setToken(mockData.token);
          setUser(mockData.user);
          return mockData;
        }
        throw err;
      }
    },
    googleLogin: async (email: string, firstName: string, lastName: string, googleId: string = "mock-google-id", role?: string) => {
      try {
        const data = await request("/auth/google/", {
          method: "POST",
          body: JSON.stringify({ email, first_name: firstName, last_name: lastName, google_id: googleId, role }),
        });
        setToken(data.token || data.access);
        try {
          const userProfile = await request("/auth/me/");
          setUser(userProfile);
          data.user = userProfile;
        } catch (profileErr) {
          console.warn("Failed retrieving user profile after Google login:", profileErr);
        }
        return data;
      } catch (err: any) {
        console.warn("API Google login failed, using mock auth session:", err);
        const username = email.split('@')[0];
        const isInstructor = role === "instructor" || email.includes("instructor") || email.includes("dosen") || email === "ahmad@gmail.com";
        const mockUser = {
          id: isInstructor ? 2 : 1,
          username: username,
          email: email,
          first_name: firstName || username.charAt(0).toUpperCase() + username.slice(1),
          last_name: lastName || "User",
          is_mahasiswa: !isInstructor,
          is_instructor: isInstructor,
          is_premium: false,
          is_onboarded: username !== "newgoogle", // Simulated onboarding check
          subscription_tier: "free",
          nim: isInstructor ? undefined : "2201010102",
          jurusan: isInstructor ? undefined : "Informatika",
          universitas: "Universitas Indonesia",
          semester: isInstructor ? undefined : 1
        };
        const mockData = {
          token: "mock-jwt-google-token-xyz-123",
          user: mockUser,
        };
        setToken(mockData.token);
        setUser(mockData.user);
        return mockData;
      }
    },
    register: async (registerData: any) => {
      try {
        return await request("/auth/register/", {
          method: "POST",
          body: JSON.stringify(registerData),
        });
      } catch (err) {
        console.warn("API register failed, simulating mock registration success:", err);
        return {
          message: "Registrasi berhasil (Simulated)",
          user: {
            username: registerData.username,
            email: registerData.email,
            first_name: registerData.first_name,
            last_name: registerData.last_name,
            is_mahasiswa: true,
            nim: registerData.nim || "2201010101",
            jurusan: registerData.jurusan || "Informatika",
            universitas: registerData.universitas || "Universitas Indonesia",
            semester: parseInt(registerData.semester) || 3
          }
        };
      }
    },
    updateProfile: async (profileData: any) => {
      try {
        const updatedUser = await request("/auth/me/", {
          method: "PUT",
          body: JSON.stringify(profileData),
        });
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        console.warn("API updateProfile failed, simulating mock update success:", err);
        const currentUser = getUser() || {};
        const role = profileData.role;
        const isMahasiswa = role ? (role === 'student' || role === 'mahasiswa') : (currentUser.is_mahasiswa || false);
        const isInst = role ? (role === 'instructor' || role === 'dosen') : (currentUser.is_instructor || false);
        const updatedUser = {
          ...currentUser,
          is_mahasiswa: isMahasiswa,
          is_instructor: isInst,
          is_onboarded: true, // Mark onboarded on successful profile update
          first_name: profileData.first_name !== undefined ? profileData.first_name : currentUser.first_name,
          last_name: profileData.last_name !== undefined ? profileData.last_name : currentUser.last_name,
          nim: !isInst ? (profileData.nim || profileData.mahasiswa_profile?.nim || currentUser.nim) : undefined,
          jurusan: !isInst ? (profileData.jurusan || profileData.mahasiswa_profile?.jurusan || currentUser.jurusan) : undefined,
          semester: !isInst ? (profileData.semester || profileData.mahasiswa_profile?.semester || currentUser.semester) : undefined,
          nidn: isInst ? (profileData.nidn || profileData.instructor_profile?.nidn || currentUser.nidn) : undefined,
          bidang_keahlian: isInst ? (profileData.bidang_keahlian || profileData.instructor_profile?.bidang_keahlian || currentUser.bidang_keahlian) : undefined,
          universitas: profileData.universitas || profileData.mahasiswa_profile?.universitas || profileData.instructor_profile?.universitas || currentUser.universitas,
          mahasiswa_profile: currentUser.is_mahasiswa ? {
            ...currentUser.mahasiswa_profile,
            ...(profileData.mahasiswa_profile || profileData),
          } : undefined,
          instructor_profile: currentUser.is_instructor ? {
            ...currentUser.instructor_profile,
            ...(profileData.instructor_profile || profileData),
          } : undefined,
        };
        setUser(updatedUser);
        return updatedUser;
      }
    },
    changePassword: async (oldPassword: string, newPassword: string) => {
      try {
        return await request("/auth/change-password/", {
          method: "POST",
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
      } catch (err) {
        console.warn("Failed changing password, generating mock response:", err);
        return { detail: "Password berhasil diubah (Simulated)." };
      }
    },
    getUser: () => {
      return getUser();
    },
    updatePremiumStatus: (status: boolean) => {
      const user = getUser();
      if (user) {
        user.is_premium = status;
        setUser(user);
      }
    }
  },

  courses: {
    enroll: async (courseCode: string, mode: string = 'audit') => {
      return await request("/courses/enroll/", {
        method: "POST",
        body: JSON.stringify({ course_code: courseCode, enrollment_mode: mode })
      });
    },
    get: async (code: string) => {
      try {
        return await request(`/courses/${code}/`);

      } catch (err) {
        console.warn("Failed fetching single course, retrieving from catalog list:", err);
        try {
          const res = await fetch(`${BASE_URL}/courses/`);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.results || []);
            const match = list.find((c: any) => c.code === code);
            if (match) return match;
          }
        } catch (e) {}
        
        // Final fallback data matching syllabus
        const isMath = code === "IF101";
        return {
          id: isMath ? 1 : 2,
          code: code,
          title: isMath ? "Matematika Diskrit" : "Struktur Data & Algoritma",
          description: isMath 
            ? "Mata kuliah dasar yang mempelajari struktur matematika diskrit, logika matematika, himpunan, relasi, fungsi, graf, dan pembuktian matematis. Membentuk pola pikir logis dan matematis yang fundamental bagi calon ilmuwan komputer."
            : "Mata kuliah menengah yang mempelajari struktur data non-linear (tree, graph) serta teknik perancangan dan analisis kompleksitas algoritma untuk pemecahan masalah komputasi secara efisien dan optimal.",
          sks: 3,
          semester: isMath ? 3 : 4,
          department: "Informatika",
          price: isMath ? 0.00 : 150000.00,
          is_premium: !isMath,
          category: isMath ? "Mathematics" : "Programming",
          instructor_name: isMath ? "Dr. Ir. Ahmad Yani" : "Daniel Scott",
          instructor_email: isMath ? "ahmadyani@belajara.id" : "danielscott@belajara.id",
          thumbnail_url: isMath ? "/images/asian_instructor_thumbnail.png" : "/images/daniel_scott_thumbnail.png",
          status: "public",
          tags: isMath ? "Logika,Himpunan,Matematika,Teori" : "Struktur Data,Algoritma,C++,SQL",
          level: isMath ? "beginner" : "intermediate",
          modules: isMath ? [
            { id: 1, title: "Pengantar Logika Matematika & Proposisi", description: "Logika matematika, tabel kebenaran proposisi majemuk, tautologi dan kontradiksi.", order: 1 },
            { id: 2, title: "Teori Himpunan & Operasi Himpunan", description: "Definisi himpunan, diagram Venn, himpunan bagian, kardinalitas, dan operasi.", order: 2 },
            { id: 3, title: "Relasi & Fungsi (Injektif, Surjektif, Bijektif)", description: "Relasi biner, sifat relasi ekuivalen, fungsi injektif, surjektif dan bijektif.", order: 3 },
            { id: 4, title: "Metode Pembuktian: Induksi Matematika [PREMIUM]", description: "Pembuktian dengan induksi matematika sederhana, induksi kuat, dan basis induksi.", order: 4, is_premium: true }
          ] : [
            { id: 10, title: "Pengenalan Struktur Data Non-Linear", description: "Mempelajari representasi pohon (tree), binary search tree (BST), dan graf secara formal.", order: 1 },
            { id: 11, title: "Analisis Kompleksitas Algoritma", description: "Notasi Big-O, perhitungan runtime amortized, serta analisis best/average/worst case.", order: 2 },
            { id: 12, title: "Algoritma Pencarian & Pengurutan Lanjut", description: "Merge Sort, Quick Sort, Heap Sort, dan implementasi rekursi tingkat lanjut.", order: 3 },
            { id: 13, title: "Graph Traversal & Jalur Terpendek [PREMIUM]", description: "Implementasi BFS, DFS, algoritma Dijkstra, dan Bellman-Ford untuk problem nyata.", order: 4, is_premium: true }
          ]
        };
      }
    }
  },

  quizzes: {
    listByModule: async (moduleId: number) => {
      try {
        return await request(`/modules/${moduleId}/quizzes/`);
      } catch (err) {
        console.warn("Failed listing quizzes, using mock:", err);
        return MOCK_QUIZZES[moduleId] || MOCK_QUIZZES[1] || [];
      }
    },
    get: async (quizId: number) => {
      try {
        return await request(`/quizzes/${quizId}/`);
      } catch (err) {
        console.warn("Failed getting quiz details, using mock:", err);
        for (const modId in MOCK_QUIZZES) {
          const match = MOCK_QUIZZES[modId].find(q => q.id === quizId);
          if (match) return match;
        }
        return MOCK_QUIZZES[1][0];
      }
    },
    submit: async (quizId: number, answers: Record<number, string>) => {
      try {
        return await request(`/quizzes/${quizId}/submit/`, {
          method: "POST",
          body: JSON.stringify({ answers }),
        });
      } catch (err) {
        console.warn("Failed submitting quiz, using mock grading:", err);
        let quiz = null;
        for (const modId in MOCK_QUIZZES) {
          const q = MOCK_QUIZZES[modId].find(q => q.id === quizId);
          if (q) {
            quiz = q;
            break;
          }
        }
        if (!quiz) quiz = MOCK_QUIZZES[1][0];

        let correctCount = 0;
        const total = quiz.questions.length;
        const details = quiz.questions.map((q: any) => {
          const submitted = answers[q.id];
          const isCorrect = submitted === q.correct;
          if (isCorrect) correctCount++;
          return {
            question_id: q.id,
            submitted,
            correct: q.correct,
            is_correct: isCorrect
          };
        });

        const score = Math.round((correctCount / total) * 100);
        return {
          score,
          correct_count: correctCount,
          total_questions: total,
          passed: score >= 60,
          details
        };
      }
    }
  },

  forum: {
    getPosts: async (courseCode: string) => {
      try {
        return await request(`/courses/${courseCode}/posts/`);
      } catch (err) {
        console.warn("Failed getting forum posts, using mock:", err);
        return MOCK_FORUM_POSTS[courseCode] || MOCK_FORUM_POSTS["IF101"] || [];
      }
    },
    createPost: async (courseCode: string, title: string, content: string) => {
      try {
        return await request(`/courses/${courseCode}/posts/create/`, {
          method: "POST",
          body: JSON.stringify({ title, content }),
        });
      } catch (err) {
        console.warn("Failed creating post, simulating in mock:", err);
        const user = getUser() || { first_name: "Budi", last_name: "Santoso" };
        const newPost = {
          id: Math.floor(Math.random() * 1000) + 300,
          title,
          content,
          author: { name: `${user.first_name} ${user.last_name}`, role: "Mahasiswa", avatar: user.first_name ? user.first_name.slice(0,2).toUpperCase() : "M" },
          created_at: new Date().toISOString(),
          replies: []
        };
        
        if (!MOCK_FORUM_POSTS[courseCode]) {
          MOCK_FORUM_POSTS[courseCode] = [];
        }
        MOCK_FORUM_POSTS[courseCode].unshift(newPost);
        return newPost;
      }
    },
    createReply: async (postId: number, parentReplyId: number | null, content: string, courseCode: string) => {
      try {
        return await request(`/forum/posts/${postId}/replies/create/`, {
          method: "POST",
          body: JSON.stringify({ parent_reply_id: parentReplyId, content }),
        });
      } catch (err) {
        console.warn("Failed creating reply, simulating in mock:", err);
        const user = getUser() || { first_name: "Budi", last_name: "Santoso" };
        const newReply: any = {
          id: Math.floor(Math.random() * 1000) + 400,
          content,
          author: { name: `${user.first_name} ${user.last_name}`, role: "Mahasiswa", avatar: user.first_name ? user.first_name.slice(0,2).toUpperCase() : "M" },
          created_at: new Date().toISOString(),
          replies: []
        };

        const posts = MOCK_FORUM_POSTS[courseCode] || MOCK_FORUM_POSTS["IF101"] || [];
        const post = posts.find(p => p.id === postId);
        
        if (post) {
          if (!parentReplyId) {
            post.replies.push(newReply);
          } else {
            const addNestedReply = (replies: any[]): boolean => {
              for (const r of replies) {
                if (r.id === parentReplyId) {
                  r.replies = r.replies || [];
                  r.replies.push(newReply);
                  return true;
                }
                if (r.replies && r.replies.length > 0) {
                  if (addNestedReply(r.replies)) return true;
                }
              }
              return false;
            };
            addNestedReply(post.replies);
          }
        }
        return newReply;
      }
    }
  },

  payment: {
    checkout: async (courseId: number) => {
      try {
        return await request("/payments/checkout/", {
          method: "POST",
          body: JSON.stringify({ course_id: courseId })
        });
      } catch (err) {
        console.warn("Failed retrieving Midtrans token, generating mock Snap token:", err);
        return {
          snap_token: "mock-midtrans-snap-token-987654321",
          redirect_url: "https://sandbox.midtrans.com/snap/v2/vtweb/mock-midtrans-snap-token-987654321",
          order_id: "ORDER-" + Math.floor(Math.random() * 100000)
        };
      }
    },

    /**
     * Initiate a subscription checkout via Midtrans Snap.
     * tier: "scholar" | "pro"
     */
    subscribe: async (tier: "scholar" | "pro") => {
      try {
        return await request("/payments/subscribe/", {
          method: "POST",
          body: JSON.stringify({ tier })
        });
      } catch (err) {
        console.warn("Failed initiating subscription, generating mock response:", err);
        const prices = { scholar: 49000, pro: 99000 };
        return {
          snap_token: `mock-sub-snap-token-${tier}-${Date.now()}`,
          snap_url: `https://sandbox.midtrans.com/snap/v2/vtweb/mock-sub-${tier}`,
          order_id: `MOCK-SUB-${tier.toUpperCase()}-${Date.now()}`,
          tier,
          amount: prices[tier],
          subscription: { tier, status: "suspended", is_active: false },
        };
      }
    },

    /**
     * Get the current user's subscription status.
     */
    mySubscription: async () => {
      try {
        return await request("/payments/my-subscription/");
      } catch (err) {
        console.warn("Failed fetching subscription status:", err);
        const user = getUser();
        return {
          has_subscription: user?.is_premium || false,
          subscription: user?.is_premium ? {
            tier: "scholar",
            tier_display: "Scholar — Rp49.000/bulan",
            status: "active",
            status_display: "Aktif",
            is_active: true,
            monthly_price: 49000,
            days_remaining: 15,
          } : null,
        };
      }
    },

    /**
     * Cancel the active subscription (access remains until period end).
     */
    cancelSubscription: async () => {
      try {
        return await request("/payments/cancel-subscription/", { method: "POST" });
      } catch (err) {
        console.warn("Failed cancelling subscription:", err);
        return { detail: "Langganan berhasil dibatalkan (Simulated)." };
      }
    },

    /**
     * Cancel a pending transaction and its subscription.
     */
    cancelTransaction: async (orderId: string) => {
      try {
        return await request("/payments/cancel-transaction/", {
          method: "POST",
          body: JSON.stringify({ order_id: orderId }),
        });
      } catch (err) {
        console.warn("Failed cancelling transaction:", err);
        return { detail: "Transaksi berhasil dibatalkan (Simulated)." };
      }
    },

    /**
     * Get billing transactions history.
     */
    transactions: async () => {
      try {
        return await request("/payments/transactions/");
      } catch (err) {
        console.warn("Failed fetching billing transactions, using mock history:", err);
        return [
          {
            id: 101,
            order_id: "BLJR-SUB-SCHOLAR-123456",
            transaction_type: "subscription_new",
            transaction_type_display: "Langganan Baru (Scholar)",
            amount: 49000.00,
            status: "success",
            status_display: "Berhasil",
            created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 102,
            order_id: "BLJR-IF201-987654",
            transaction_type: "course_purchase",
            transaction_type_display: "Pembelian Kursus",
            amount: 150000.00,
            status: "success",
            status_display: "Berhasil",
            created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
          }
        ];
      }
    },

    verify: async (orderId: string, status: string) => {
      try {
        return await request("/payments/verify/", {
          method: "POST",
          body: JSON.stringify({ order_id: orderId, status })
        });
      } catch (err) {
        console.warn("Failed calling verify payment API, simulating payment verification locally:", err);
        if (status === "success") {
          api.auth.updatePremiumStatus(true);
        }
        return {
          status: "success",
          message: "Status pembayaran berhasil diverifikasi!"
        };
      }
    }
  },

  instructor: {
    createCourse: async (data: any) => { try { return await request('/courses/create/', { method: 'POST', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    updateCourse: async (code: string, data: any) => { try { return await request(`/courses/${code}/manage/`, { method: 'PUT', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    deleteCourse: async (code: string) => { try { return await request(`/courses/${code}/manage/`, { method: 'DELETE' }); } catch(e) { throw e; } },
    createModule: async (courseCode: string, data: any) => { try { return await request(`/courses/${courseCode}/modules/create/`, { method: 'POST', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    updateModule: async (moduleId: number, data: any) => { try { return await request(`/modules/${moduleId}/manage/`, { method: 'PUT', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    deleteModule: async (moduleId: number) => { try { return await request(`/modules/${moduleId}/manage/`, { method: 'DELETE' }); } catch(e) { throw e; } },
    generateQuiz: async (moduleId: number) => { try { return await request(`/courses/modules/${moduleId}/quiz/generate/`, { method: 'POST' }); } catch(e) { throw e; } },
    createSubChapter: async (moduleId: number, data: any) => { try { return await request(`/modules/${moduleId}/subchapters/create/`, { method: 'POST', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    updateSubChapter: async (subchapterId: number, data: any) => { try { return await request(`/subchapters/${subchapterId}/manage/`, { method: 'PUT', body: JSON.stringify(data) }); } catch(e) { throw e; } },
    deleteSubChapter: async (subchapterId: number) => { try { return await request(`/subchapters/${subchapterId}/manage/`, { method: 'DELETE' }); } catch(e) { throw e; } },
    saveQuiz: async (moduleId: number, questionsJson: any[]) => { try { return await request(`/courses/modules/${moduleId}/quiz/manage/`, { method: 'POST', body: JSON.stringify({ questions_json: questionsJson }) }); } catch(e) { throw e; } },
    generateMaterial: async (params: {
      topic: string;
      template_type: string;
      subchapter_title?: string;
      course_title?: string;
    }): Promise<{ content: string }> => {
      return await request('/courses/ai/generate-material/', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },

  explore: {
    analyze: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(`${BASE_URL}/explore/analyze/`, {
          method: "POST",
          headers,
          body: formData,
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || "Gagal mengunggah file");
        }
        return await response.json();
      } catch (err) {
        console.warn("API explore analyze failed, using mock response:", err);
        return {
          curriculum_id: 42,
          message: "Analisis kurikulum dimulai (Simulated)"
        };
      }
    },
    checkStatus: async (curriculumId: number) => {
      try {
        return await request(`/explore/recommendations/status/${curriculumId}/`);
      } catch (err) {
        console.warn("API checkStatus failed, using mock response:", err);
        return mockGetStatus(curriculumId);
      }
    }
  }
};

const mockStatusStore: Record<number, { status: string; attempts: number }> = {};
function mockGetStatus(curriculumId: number) {
  if (!mockStatusStore[curriculumId]) {
    mockStatusStore[curriculumId] = { status: "processing", attempts: 0 };
  }
  const session = mockStatusStore[curriculumId];
  session.attempts += 1;
  if (session.attempts >= 3) {
    session.status = "success";
  }
  return {
    status: session.status,
    academic_profile: session.status === "success" ? {
      completed_subjects: [
        "Pemrograman Dasar (Python)",
        "Logika & Matematika Dasar"
      ],
      competency_gaps: [
        "Struktur Data Dinamis & Manajemen Memori",
        "Perancangan Database Relasional (SQL)"
      ],
      career_recommendations: "Software Engineer, Database Administrator, Backend Developer"
    } : null,
    recommendations: session.status === "success" ? [
      {
        course: {
          id: 2,
          code: "IF102",
          title: "Struktur Data & Algoritma",
          description: "Mata kuliah lanjutan tentang struktur data non-linear (tree, graph) dan analisis algoritma.",
          sks: 3,
          semester: 4,
          department: "Informatika",
          modules: [
            { id: 10, title: "Pengenalan Struktur Data Non-Linear", description: "Tree, BST, dan representasi graph.", order: 1 }
          ]
        },
        match_percentage: 95,
        reason: "Berdasarkan silabus yang Anda unggah, mata kuliah ini sangat relevan untuk memperkuat pemahaman struktur data non-linear dan efisiensi algoritma yang belum dicakup di kurikulum Anda."
      },
      {
        course: {
          id: 1,
          code: "IF101",
          title: "Matematika Diskrit",
          description: "Mata kuliah dasar yang mempelajari logika matematika, himpunan, relasi, fungsi, graf, dan pembuktian matematis.",
          sks: 3,
          semester: 3,
          department: "Informatika",
          modules: [
            { id: 1, title: "Pengantar Logika Matematika & Proposisi", description: "Logika proposisi.", order: 1 }
          ]
        },
        match_percentage: 88,
        reason: "Kurikulum Anda kekurangan fondasi teori himpunan dan logika matematika formal yang penting untuk pemecahan masalah tingkat lanjut."
      }
    ] : null
  };
}
