// Frontend API Client with JWT storage
import { inferProgramStudiGroup } from "./indonesia-academic-data";
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://markusprap-belajara-backend.hf.space/api";

export function getToken(): string | null {
  return null;
}

export function setToken(token: string) {}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isLoggedIn");
  }
}

export function getUser() {
  return null;
}

export function setUser(user: any) {}

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle automatic silent refresh if unauthorized and it's not the login/refresh endpoint itself
  if (response.status === 401 && !endpoint.includes("/auth/login/") && !endpoint.includes("/auth/refresh/")) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (refreshRes.ok) {
        // Retry the original request
        response = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    } catch (refreshErr) {
      console.error("Automatic token refresh failed:", refreshErr);
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || errData.message || "Request failed");
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const data = await request("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      return data;
    },

    googleLogin: async (
      email: string,
      firstName: string,
      lastName: string,
      googleId: string = "",
      role?: string,
      credential?: string
    ) => {
      const data = await request("/auth/google/", {
        method: "POST",
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, google_id: googleId, role, credential }),
      });
      return data;
    },

    register: async (registerData: any) => {
      return await request("/auth/register/", {
        method: "POST",
        body: JSON.stringify(registerData),
      });
    },

    updateProfile: async (profileData: any) => {
      return await request("/auth/me/", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
    },

    changePassword: async (oldPassword: string, newPassword: string) => {
      return await request("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
    },

    forgotPassword: async (email: string) => {
      return await request("/auth/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (email: string, code: string, newPassword: string) => {
      return await request("/auth/reset-password/", {
        method: "POST",
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
    },

    verifyEmail: async (email: string, code: string) => {
      return await request("/auth/verify-email/", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    },

    logout: async () => {
      return await request("/auth/logout/", {
        method: "POST",
      });
    },

    me: async () => {
      return await request("/auth/me/");
    },

    getUser: () => {
      return null;
    },

    updatePremiumStatus: (status: boolean) => {
      // Deprecated/Stub: state is now managed reactively via AuthContext
    },
  },

  courses: {
    enroll: async (courseCode: string, mode: string = "audit") => {
      return await request("/courses/enroll/", {
        method: "POST",
        body: JSON.stringify({ course_code: courseCode, enrollment_mode: mode }),
      });
    },

    get: async (code: string) => {
      return await request(`/courses/${code}/`);
    },

    getCertificate: async (code: string) => {
      return await request(`/courses/${code}/certificate/`);
    },

    claimCertificate: async (code: string) => {
      return await request(`/courses/${code}/claim-certificate/`, {
        method: "POST",
      });
    },
  },

  quizzes: {
    listByModule: async (moduleId: number) => {
      return await request(`/modules/${moduleId}/quizzes/`);
    },

    get: async (quizId: number) => {
      return await request(`/quizzes/${quizId}/`);
    },

    submit: async (quizId: number, answers: Record<number, string>) => {
      return await request(`/quizzes/${quizId}/submit/`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
    },
  },

  forum: {
    getPosts: async (courseCode: string) => {
      return await request(`/courses/${courseCode}/posts/`);
    },

    createPost: async (courseCode: string, title: string, content: string) => {
      return await request(`/courses/${courseCode}/posts/create/`, {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
    },

    createReply: async (postId: number, parentReplyId: number | null, content: string, _courseCode: string) => {
      return await request(`/forum/posts/${postId}/replies/create/`, {
        method: "POST",
        body: JSON.stringify({ parent_reply_id: parentReplyId, content }),
      });
    },
  },

  payment: {
    checkout: async (courseId: number) => {
      return await request("/payments/checkout/", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId }),
      });
    },

    subscribe: async (tier: "scholar" | "pro") => {
      return await request("/payments/subscribe/", {
        method: "POST",
        body: JSON.stringify({ tier }),
      });
    },

    mySubscription: async () => {
      return await request("/payments/my-subscription/");
    },

    cancelSubscription: async () => {
      return await request("/payments/cancel-subscription/", { method: "POST" });
    },

    cancelTransaction: async (orderId: string) => {
      return await request("/payments/cancel-transaction/", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId }),
      });
    },

    transactions: async () => {
      return await request("/payments/transactions/");
    },

    checkoutCredits: async (packageId: "package_10" | "package_50" | "package_100") => {
      return await request("/payments/checkout-credits/", {
        method: "POST",
        body: JSON.stringify({ package: packageId }),
      });
    },

    verify: async (orderId: string, status: string) => {
      const result = await request("/payments/verify/", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId, status }),
      });
      if (status === "success") {
        api.auth.updatePremiumStatus(true);
      }
      return result;
    },
  },

  instructor: {
    getCredits: async () => {
      return await request("/users/instructor/credits/");
    },
    createCourse: async (data: any) => {
      return await request("/courses/create/", { method: "POST", body: JSON.stringify(data) });
    },
    updateCourse: async (code: string, data: any) => {
      return await request(`/courses/${code}/manage/`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteCourse: async (code: string) => {
      return await request(`/courses/${code}/manage/`, { method: "DELETE" });
    },
    createModule: async (courseCode: string, data: any) => {
      return await request(`/courses/${courseCode}/modules/create/`, { method: "POST", body: JSON.stringify(data) });
    },
    updateModule: async (moduleId: number, data: any) => {
      return await request(`/modules/${moduleId}/manage/`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteModule: async (moduleId: number) => {
      return await request(`/modules/${moduleId}/manage/`, { method: "DELETE" });
    },
    generateQuiz: async (moduleId: number) => {
      return await request(`/courses/modules/${moduleId}/quiz/generate/`, { method: "POST" });
    },
    createSubChapter: async (moduleId: number, data: any) => {
      return await request(`/modules/${moduleId}/subchapters/create/`, { method: "POST", body: JSON.stringify(data) });
    },
    updateSubChapter: async (subchapterId: number, data: any) => {
      return await request(`/subchapters/${subchapterId}/manage/`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteSubChapter: async (subchapterId: number) => {
      return await request(`/subchapters/${subchapterId}/manage/`, { method: "DELETE" });
    },
    saveQuiz: async (moduleId: number, questionsJson: any[]) => {
      return await request(`/courses/modules/${moduleId}/quiz/manage/`, { method: "POST", body: JSON.stringify({ questions_json: questionsJson }) });
    },
    generateMaterial: async (params: {
      topic: string;
      template_type: string;
      subchapter_title?: string;
      course_title?: string;
    }): Promise<{ content: string }> => {
      return await request("/courses/ai/generate-material/", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },

  explore: {
    analyze: async (file: File, targetProdi?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (targetProdi) {
        formData.append("target_prodi", targetProdi);
        formData.append("department", targetProdi);
      }
      const response = await fetch(`${BASE_URL}/explore/analyze/`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || "Gagal mengunggah file");
      }
      return await response.json();
    },

    checkStatus: async (curriculumId: number) => {
      return await request(`/explore/recommendations/status/${curriculumId}/`);
    },
  },
};
