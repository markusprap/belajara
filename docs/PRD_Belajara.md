# Product Requirement Document (PRD): Belajara

**Project Title:** Belajara  
**Version:** 1.0 (MVP Release)  
**Author:** Product Manager (Main Agent)  
**Date:** June 02, 2026  

---

## 1. Executive Summary
Belajara is an enterprise-grade AI-powered interactive learning platform with a curriculum-based course recommendation system designed specifically for Indonesian university students. The platform solves the lack of academic personalization and interactive AI assistance in traditional LMS (like Google Classroom) by integrating course cataloging, timed AI-generated interactive quizzes, course discussion boards, and curriculum-matching recommendations in a single monolith modular system.

---

## 2. Product Scope & Functional Requirements

The product features are split into four main modules representing the core business logic.

### 🔐 2.1 Module A: Authentication & Role Management (JWT)
Secure token-based stateless authentication supporting two roles: **Mahasiswa (Student)** and **Pengajar (Instructor)**.

*   **Registration**: Users register with standard parameters (username, email, password, first/last name). Students are required to provide academic fields: **NIM**, **Jurusan (Major)**, **Universitas**, and **Semester**.
*   **Login**: JWT-based login using Access and Refresh tokens (handled by SimpleJWT). Enforces authorization header validation for all protected routes.
*   **Profile Retrieve**: Endpoint (`/api/auth/me/`) returning profile data including the `is_premium` flag and student details.

### 🧠 2.2 Module B: AI-Powered Course Recommendation (Asynchronous)
Enables students to upload university curriculum documents and match them against the platform's course catalog.

*   **File Formats**: Supports PDF and Excel (`.xlsx`, `.xls`) uploads.
*   **Extraction & Matching**:
    1. Extract textual content from the uploaded files.
    2. Pass the extracted text along with the active course catalog to Gemini 1.5/3.5 Flash.
    3. Generate recommendations including match percentages and reasoning.
*   **Non-Blocking Processing**: The extraction and AI invocation runs in the background using **Celery** with a **Redis** message broker.
*   **Polling Endpoint**: The frontend queries a status API every 2 seconds to fetch the generated recommendations once the background task finishes.
*   **Course Catalog DataTable**: The course database is seeded and displayed in a responsive shadcn/ui DataTable supporting filtering and enrollment actions.

### 📝 2.3 Module C: Classroom Workspace & Timed Quizzes
An interactive dashboard representing the course syllabus, module slides, quizzes, and discussion boards.

*   **Syllabus Gating**: Modules marked as `is_premium = True` are locked for free students and prompt them to upgrade. Free modules remain fully open.
*   **Interactive MCQ Quiz**:
    - Instantly generates a 5-question multiple-choice kuis based on module content using Gemini.
    - Features a countdown timer (e.g. 3-4 minutes) running in the frontend.
    - Grading reviews display correct options alongside detailed AI explanations.
*   **Course Discussion Boards**:
    - Flat listing of Q&A threads per course.
    - Threaded discussions supporting nested reply nodes up to 3 levels deep.

### 💳 2.4 Module D: Midtrans Payment Snap Gateways
Enforces the freemium access model by processing secure payments.

*   **Checkout**: Calls the Midtrans Snap API using Basic Auth to generate a payment token and transaction redirect URL.
*   **Snap Modal**: Integrates the Midtrans Snap JS Overlay in the checkout view.
*   **Webhook Settlement**: A secure webhook handler that verifies Midtrans SHA512 signatures, updates the transaction record, and upgrades the student's user profile (`is_premium = True`) or enrolls them in premium courses.

---

## 3. Detailed User Flows

### 3.1 Student User Flow
1.  **Onboarding**: Register or Log in -> Land on **Student Dashboard** showcasing active course progress and statistics.
2.  **Exploration**: Go to `/explore` -> Upload university curriculum document -> View loading progress skeleton -> Receive AI recommendations -> Click **"Ambil Mata Kuliah Ini"** to enroll.
3.  **Learning**: Go to `/courses/[code]` -> Choose active module:
    - If module is Free: Read details, download slides, click **"Mulai Kuis Interaktif"** -> Complete MCQ before time expires -> Submit and review detailed grading reviews.
    - If module is Premium and student is Free: Toggles locked banner -> Click **"Buka Premium"** -> Complete Midtrans checkout in overlay -> Unlock modules immediately.
4.  **Forum Q&A**: Click **"Forum Diskusi"** inside workspace -> View active posts -> Post a new question or write replies to classmate posts.

### 3.2 Instructor User Flow (Future Phase)
1.  **Management**: Log in -> Open **Instructor Portal** -> Create/Edit course listings, titles, and SKUs.
2.  **Syllabus Construction**: Add modules and upload slides (PDF) or syllabus descriptions.
3.  **Quiz Generation**: Click **"Generate Kuis (AI)"** on a module to trigger Gemini and save the generated MCQ array directly to the database.

---

## 4. Technical Architecture & Non-Functional Guidelines

```
+-------------------------------------------------------------+
|                      React (Next.js 16)                      |
|                  Tailwind CSS + shadcn/ui                   |
+------------------------------+------------------------------+
                               | (JWT Bearer Token REST)
                               v
+-------------------------------------------------------------+
|                      Django 5.x Backend                     |
+------------+-----------------+------------------+-----------+
             |                 |                  |
             v                 v                  v
      +--------------+  +--------------+  +--------------+
      |  PostgreSQL  |  | Redis Broker |  |  Gemini AI   |
      +--------------+  +------+-------+  +--------------+
                               |
                               v
                        +--------------+
                        | Celery Task  |
                        +--------------+
```

### 4.1 Design & Styling System (Qurtuba Palette)
*   **Background**: Soft Off-White (`#FAF9FB`)
*   **Primary**: Deep Charcoal (`#060708`)
*   **Accent 1**: Muted Mauve (`#C6B5BF`)
*   **Accent 2 (Alert/Primary)**: Vibrant Red (`#CF3A1F`)
*   **Font Heading**: 'Playfair Display' (Serif)
*   **Font Body**: 'Montserrat' or 'Geist' (Sans-Serif)

### 4.2 Security Rules
- Environment variables must store all credentials (like `MIDTRANS_SERVER_KEY`, `GEMINI_API_KEY`, `POSTGRES_PASSWORD`).
- Webhook signatures from Midtrans must be validated using SHA512.
- Session headers must enforce token validations using SimpleJWT.

### 4.3 Performance & Testing Rules
- Every database service must use Django ORM optimized queries (`select_related`, `prefetch_related`).
- Integration tests are mandatory for all modules. Must execute and pass using Pytest.
