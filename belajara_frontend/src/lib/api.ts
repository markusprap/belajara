// Frontend API Client with JWT storage & mock fallbacks
import { inferProgramStudiGroup } from "./indonesia-academic-data";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";
const ENABLE_MOCKS = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";

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

function getMockJurusan(username: string): string {
  const name = username.toLowerCase();
  if (name.includes("si") || name.includes("sistem")) return "Sistem Informasi";
  if (name.includes("akuntansi") || name.includes("akuntan")) return "Akuntansi";
  if (name.includes("manajemen") || name.includes("manajer")) return "Manajemen";
  if (name.includes("hukum") || name.includes("advokat")) return "Ilmu Hukum";
  if (name.includes("farmasi") || name.includes("apoteker")) return "Farmasi";
  if (name.includes("sipil")) return "Teknik Sipil";
  if (name.includes("elektro")) return "Teknik Elektro";
  
  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem("user");
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed && parsed.username === username) {
          const prodi = parsed.mahasiswa_profile?.jurusan || parsed.jurusan;
          if (prodi) return prodi;
        }
      }
    } catch (e) {}
  }
  return "Informatika";
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      try {
        const data = await request("/auth/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setToken(data.tokens?.access || data.token || data.access);
        
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

        if (ENABLE_MOCKS && username.length >= 3) {
          console.warn("API login failed, using mock auth session:", err);
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
            jurusan: getMockJurusan(username),
            mahasiswa_profile: {
              nim: "2201010101",
              jurusan: getMockJurusan(username),
              universitas: "Universitas Indonesia",
              semester: 3
            },
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
    googleLogin: async (
      email: string,
      firstName: string,
      lastName: string,
      googleId: string = "mock-google-id",
      role?: string,
      credential?: string
    ) => {
      try {
        const data = await request("/auth/google/", {
          method: "POST",
          body: JSON.stringify({ email, first_name: firstName, last_name: lastName, google_id: googleId, role, credential }),
        });
        setToken(data.tokens?.access || data.token || data.access);
        try {
          const userProfile = await request("/auth/me/");
          setUser(userProfile);
          data.user = userProfile;
        } catch (profileErr) {
          console.warn("Failed retrieving user profile after Google login:", profileErr);
        }
        return data;
      } catch (err: any) {
        if (!ENABLE_MOCKS) {
          throw err;
        }

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
          jurusan: isInstructor ? undefined : getMockJurusan(username),
          mahasiswa_profile: isInstructor ? undefined : {
            nim: "2201010102",
            jurusan: getMockJurusan(username),
            universitas: "Universitas Indonesia",
            semester: 1
          },
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
    analyze: async (file: File, targetProdi?: string) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (targetProdi) {
          formData.append("target_prodi", targetProdi);
          formData.append("department", targetProdi);
        }
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
  const user = getUser();
  const prodi = user?.mahasiswa_profile?.jurusan || user?.jurusan || "Program Studi Umum";
  const group = inferProgramStudiGroup(prodi);

  const MOCK_COMPETENCY_KEYS: Record<string, { key: string; label: string }[]> = {
    computing: [
      { key: "software_engineering", label: "Software Eng." },
      { key: "data_ai", label: "Data Sci. & AI" },
      { key: "system_architecture", label: "System Arch." },
      { key: "math_logic", label: "Math & Logic" },
      { key: "digital_business", label: "Digital Business" }
    ],
    engineering: [
      { key: "engineering_math", label: "Eng. Math" },
      { key: "design_analysis", label: "Design & Analysis" },
      { key: "materials_process", label: "Materials/Process" },
      { key: "systems_control", label: "Systems & Control" },
      { key: "safety_project", label: "Safety & Project" }
    ],
    business: [
      { key: "finance_accounting", label: "Finance & Acct." },
      { key: "marketing", label: "Marketing" },
      { key: "operations_logistics", label: "Ops & Logistics" },
      { key: "strategy_entrepreneurship", label: "Strategy & Biz" },
      { key: "hr_organization", label: "Org & People" }
    ],
    socialHumanities: [
      { key: "theory_society", label: "Theory & Society" },
      { key: "policy_law", label: "Policy & Law" },
      { key: "communication_media", label: "Comm. & Media" },
      { key: "research_methods", label: "Research Methods" },
      { key: "ethics_culture", label: "Ethics & Culture" }
    ],
    education: [
      { key: "pedagogy", label: "Pedagogy" },
      { key: "subject_mastery", label: "Subject Mastery" },
      { key: "assessment", label: "Assessment" },
      { key: "classroom_technology", label: "Classroom Tech" },
      { key: "guidance_ethics", label: "Guidance & Ethics" }
    ],
    science: [
      { key: "math_statistics", label: "Math & Stats" },
      { key: "lab_experiment", label: "Lab & Experiment" },
      { key: "natural_systems", label: "Natural Systems" },
      { key: "data_modeling", label: "Data & Modeling" },
      { key: "research_method", label: "Research Method" }
    ],
    health: [
      { key: "biomedical_core", label: "Biomedical Core" },
      { key: "clinical_care", label: "Clinical Care" },
      { key: "public_health", label: "Public Health" },
      { key: "health_systems", label: "Health Systems" },
      { key: "ethics_safety", label: "Ethics & Safety" }
    ],
    agriculture: [
      { key: "production_cultivation", label: "Cultivation" },
      { key: "soil_ecosystem", label: "Soil & Ecosystem" },
      { key: "food_postharvest", label: "Food/Postharvest" },
      { key: "agribusiness", label: "Agribusiness" },
      { key: "research_fieldwork", label: "Research/Field" }
    ],
    artsCulture: [
      { key: "creative_practice", label: "Creative Practice" },
      { key: "history_theory", label: "History & Theory" },
      { key: "language_literacy", label: "Language/Literacy" },
      { key: "production_media", label: "Production Media" },
      { key: "portfolio_research", label: "Portfolio/Research" }
    ],
    tourism: [
      { key: "hospitality_operations", label: "Hospitality Ops" },
      { key: "destination_management", label: "Destination Mgmt." },
      { key: "culinary_service", label: "Culinary/Service" },
      { key: "marketing_event", label: "Marketing/Event" },
      { key: "sustainability", label: "Sustainability" }
    ],
    general: [
      { key: "core_foundation", label: "Core Subjects" },
      { key: "analysis_research", label: "Analysis & Research" },
      { key: "professional_practice", label: "Professional Practice" },
      { key: "digital_data", label: "Digital & Data" },
      { key: "communication_ethics", label: "Communication & Ethics" }
    ]
  };

  const categories = MOCK_COMPETENCY_KEYS[group.key] || MOCK_COMPETENCY_KEYS.general;
  const scoresVal = [82, 74, 65, 58, 70];
  const competency_scores: Record<string, number> = {};
  const competency_axis_labels: Record<string, string> = {};

  categories.forEach((cat, idx) => {
    competency_scores[cat.key] = scoresVal[idx] || 60;
    competency_axis_labels[cat.key] = cat.label;
  });

  const getMockRecommendations = (groupKey: string): any[] => {
    switch (groupKey) {
      case "computing":
        return [
          {
            course: {
              id: 2,
              code: "IF102",
              title: "Struktur Data & Algoritma",
              description: "Mata kuliah lanjutan tentang struktur data non-linear (tree, graph) dan analisis algoritma.",
              sks: 3,
              semester: 4,
              department: prodi,
              modules: [{ id: 10, title: "Pengenalan Struktur Data Non-Linear", description: "Tree, BST, dan representasi graph.", order: 1 }]
            },
            match_percentage: 95,
            reason: `Sangat relevan untuk memperkuat pemahaman struktur data dan efisiensi algoritma yang belum dicakup di kurikulum ${prodi} Anda.`
          },
          {
            course: {
              id: 1,
              code: "IF101",
              title: "Matematika Diskrit",
              description: "Mata kuliah dasar yang mempelajari logika matematika, himpunan, relasi, fungsi, graf, dan pembuktian.",
              sks: 3,
              semester: 3,
              department: prodi,
              modules: [{ id: 1, title: "Pengantar Logika Matematika & Proposisi", description: "Logika proposisi.", order: 1 }]
            },
            match_percentage: 88,
            reason: "Mata kuliah ini melengkapi dasar pembuktian formal dan logika proposisi untuk problem solving digital."
          }
        ];
      case "business":
        return [
          {
            course: {
              id: 201,
              code: "MN101",
              title: "Manajemen Pemasaran Strategis",
              description: "Prinsip dasar pemasaran, perilaku konsumen, segmentasi pasar, dan strategi bauran pemasaran di era digital.",
              sks: 3,
              semester: 3,
              department: prodi,
              modules: [{ id: 101, title: "Strategi Produk & Segmentasi Pasar", description: "Analisis audiens target dan pemetaan brand.", order: 1 }]
            },
            match_percentage: 92,
            reason: `Membantu Anda menguasai keahlian marketing dan strategi bisnis terapan yang sangat krusial untuk profil lulusan ${prodi}.`
          },
          {
            course: {
              id: 202,
              code: "AK101",
              title: "Pengantar Akuntansi & Keuangan",
              description: "Konsep dasar pelaporan keuangan, pencatatan transaksi jurnal, buku besar, neraca saldo, dan laporan laba-rugi.",
              sks: 3,
              semester: 2,
              department: prodi,
              modules: [{ id: 102, title: "Persamaan Dasar Akuntansi & Siklus Jurnal", description: "Mempelajari siklus pelaporan keuangan entitas bisnis.", order: 1 }]
            },
            match_percentage: 85,
            reason: "Membekali Anda dengan kompetensi literasi finansial yang mendasar untuk mendukung analisis bisnis."
          }
        ];
      case "engineering":
        return [
          {
            course: {
              id: 301,
              code: "FT102",
              title: "Gambar Teknik & CAD",
              description: "Pengenalan visualisasi desain rekayasa, standar proyeksi gambar, tata letak, dan pemodelan CAD 2D/3D.",
              sks: 3,
              semester: 2,
              department: prodi,
              modules: [{ id: 202, title: "Pengenalan AutoCAD & Gambar Proyeksi", description: "Prinsip dasar penggambaran rekayasa standar ISO.", order: 1 }]
            },
            match_percentage: 94,
            reason: `Mengembangkan keterampilan visualisasi spasial dan desain CAD yang merupakan kompetensi mutlak bagi mahasiswa ${prodi}.`
          },
          {
            course: {
              id: 302,
              code: "FT101",
              title: "Fisika Teknik Dasar",
              description: "Mempelajari hukum mekanika, termodinamika, gelombang, dan listrik magnet sebagai fondasi fisika rekayasa.",
              sks: 3,
              semester: 1,
              department: prodi,
              modules: [{ id: 201, title: "Mekanika & Kinematika Benda Tegar", description: "Gaya, usaha, energi, dan momen inersia.", order: 1 }]
            },
            match_percentage: 89,
            reason: "Menyediakan pemahaman sains dasar yang kuat untuk menunjang mata kuliah rekayasa lanjutan."
          }
        ];
      default:
        return [
          {
            course: {
              id: 401,
              code: "UM101",
              title: "Metodologi Penelitian & Penulisan Ilmiah",
              description: "Prosedur penelitian ilmiah, penyusunan hipotesis, desain eksperimen, pengolahan data kuantitatif, dan tata cara sitasi.",
              sks: 3,
              semester: 5,
              department: prodi,
              modules: [{ id: 301, title: "Penyusunan Usulan Penelitian", description: "Perumusan masalah dan penyusunan landasan teori.", order: 1 }]
            },
            match_percentage: 93,
            reason: `Mata kuliah ini wajib untuk menyusun skripsi / proyek tugas akhir bagi program studi ${prodi} Anda.`
          },
          {
            course: {
              id: 402,
              code: "UM102",
              title: "Etika Profesi & Komunikasi",
              description: "Pengembangan diri, profesionalisme, etika kerja, teknik komunikasi publik, serta kerja sama tim dalam organisasi.",
              sks: 2,
              semester: 4,
              department: prodi,
              modules: [{ id: 302, title: "Komunikasi Persuasif & Presentasi", description: "Teknik menyajikan gagasan akademis secara efektif.", order: 1 }]
            },
            match_percentage: 87,
            reason: "Sangat baik untuk membangun soft skill komunikasi dan etika kerja yang dicari oleh industri."
          }
        ];
    }
  };

  return {
    status: session.status,
    academic_profile: session.status === "success" ? {
      study_program: prodi,
      detected_semester: user?.mahasiswa_profile?.semester || user?.semester || 3,
      readiness_score: 74,
      confidence_score: 82,
      summary: `Dokumen menunjukkan fondasi ${prodi} (rumpun ${group.label}) sudah terbentuk, dengan beberapa gap prioritas yang perlu ditutup lewat mata kuliah terarah dan proyek kecil.`,
      completed_subjects: [
        `Pengantar ${prodi}`,
        `Dasar Keilmuan ${prodi}`,
        "Metode Penelitian"
      ],
      competency_scores: competency_scores,
      competency_axis_labels: competency_axis_labels,
      competency_evidence: [
        {
          competency: categories[0].label,
          competency_key: categories[0].key,
          course_name: `Pengantar ${prodi}`,
          text_excerpt: `Dokumen memuat penyelesaian mata kuliah dasar ${prodi} dengan hasil yang baik untuk membangun fondasi keilmuan.`,
          confidence: 84
        },
        {
          competency: categories[1].label,
          competency_key: categories[1].key,
          course_name: "Metode Penelitian",
          text_excerpt: "Ada penyelesaian mata kuliah metodologi dalam transkrip Anda, menunjukkan pengenalan riset ilmiah.",
          confidence: 76
        }
      ],
      gap_map: {
        mandatory: [
          {
            gap: `Pendalaman kompetensi inti ${categories[2].label}`,
            priority: "high",
            reason: `Area ${categories[2].label} merupakan pilar inti kurikulum ${prodi} tetapi belum tercakup penuh dalam dokumen Anda.`,
            suggested_action: "Ambil mata kuliah tingkat menengah/lanjut dan kerjakan studi kasus terapan."
          },
          {
            gap: "Analisis Data Kuantitatif",
            priority: "medium",
            reason: "Keterampilan mengolah data dan membaca statistik diperlukan di semua rumpun bidang kerja.",
            suggested_action: "Pilih kelas statistik terapan, riset operasi, atau analisis data dasar."
          }
        ],
        elective: [
          {
            gap: `Spesialisasi di bidang ${categories[3].label}`,
            priority: "medium",
            reason: "Membantu menaikkan daya saing Anda pada profil kerja pilihan.",
            suggested_action: "Ambil mata kuliah peminatan yang spesifik."
          }
        ],
        career: [
          {
            gap: "Kekurangan portofolio/studi kasus nyata",
            target_career: `Profesional ${prodi}`,
            reason: "Industri saat ini lebih mementingkan bukti portofolio rekayasa dibanding nilai transkrip."
          }
        ]
      },
      // Keep legacy flat list
      competency_gaps: [
        {
          gap: `Pendalaman kompetensi inti ${categories[2].label}`,
          priority: "high",
          reason: `Area ${categories[2].label} merupakan pilar inti kurikulum ${prodi} tetapi belum tercakup penuh dalam dokumen Anda.`,
          suggested_action: "Ambil mata kuliah tingkat menengah/lanjut dan kerjakan studi kasus terapan."
        },
        {
          gap: "Analisis Data Kuantitatif",
          priority: "medium",
          reason: "Keterampilan mengolah data dan membaca statistik diperlukan di semua rumpun bidang kerja.",
          suggested_action: "Pilih kelas statistik terapan, riset operasi, atau analisis data dasar."
        }
      ],
      career_recommendations: [
        {
          title: `Profesional ${prodi}`,
          fit_score: 82,
          missing_skills: ["Portofolio/studi kasus", "Pendalaman kompetensi inti"],
          why: `Jalur ini paling dekat dengan mata kuliah yang sudah terdeteksi pada dokumen ${prodi}.`
        },
        {
          title: "Research / Academic Track",
          fit_score: 73,
          missing_skills: ["Metode penelitian lanjut", "Penulisan ilmiah"],
          why: "Dokumen menunjukkan dasar akademik yang bisa diarahkan ke riset atau proyek akhir."
        }
      ],
      semester_plan: [
        {
          term: "Semester Berikutnya",
          focus: "Tutup gap prioritas tertinggi",
          actions: ["Ambil 2 mata kuliah inti lanjutan", "Buat satu studi kasus dari dokumen yang diunggah"]
        },
        {
          term: "2 Semester Mendatang",
          focus: "Validasi arah karier",
          actions: ["Pilih peminatan yang selaras career lens", "Bangun portofolio atau mini research report"]
        }
      ]
    } : null,
    recommendations: session.status === "success" ? getMockRecommendations(group.key) : null
  };
}
