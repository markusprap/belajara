# Task 05: Instructor Role Portal & Course Management Interface

## Goal
Implement the Instructor Role Portal in the Next.js frontend and Course/Module Management CRUD endpoints in the Django backend. This allows educators to manage curricula, construct modules, and trigger AI quiz generation.

---

## Todo List

### 1. Backend REST Endpoints & Security Gating
- [ ] Implement `IsInstructor` custom permission class in `belajara_backend/courses/permissions.py`.
- [ ] Create CRUD views for Course Management in `courses/views.py`:
  - [ ] `CourseCreateView` / `CourseUpdateView` / `CourseDeleteView`.
  - [ ] Restrict write operations (POST, PUT, DELETE) to instructors only.
- [ ] Create CRUD views for Module Management:
  - [ ] Add module to course, edit module title/description, change sequence order.
- [ ] Secure `QuizGenerateView` in `quizzes/views.py` ensuring only instructors can generate AI quizzes.

### 2. Frontend Instructor Dashboard UI (Next.js)
- [ ] Set up route access control: redirect users with role `instructor` to `/instructor` on landing/login.
- [ ] Build Instructor Dashboard `/instructor`:
  - [ ] Cards of active courses managed by the instructor.
  - [ ] "Tambah Kelas Baru" button opening a course creation dialog.
- [ ] Build Course Management details page at `/instructor/courses/[code]`:
  - [ ] Course metadata editor.
  - [ ] Syllabus module manager: list modules, drag-and-drop order (or simple up/down controls), add new module inputs.
  - [ ] Material upload button: trigger text or PDF slides upload.
  - [ ] "Generate Kuis AI" action trigger: calls backend to generate a timed MCQ, displays a preview, and saves it.

### 3. Verification & Testing
- [ ] Write backend unit tests in `courses/tests.py` verifying that free students are blocked from creating/modifying courses.
- [ ] Write integration test validating that a generated kuis is correctly linked to the module.
- [ ] Verify frontend build compatibility.
