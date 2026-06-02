# Task 04: Celery & Redis Asynchronous Curriculum Recommendation Processing

## Goal
Implement Celery background task processing and Redis messaging brokers to ensure that parsing uploaded curriculum documents (PDF/Excel) and executing LLM matching does not block Django's primary HTTP thread. Add status checking polling APIs and integrate the loading indicators in the Next.js frontend.

---

## Todo List

### 1. Backend Setup & Configuration
- [ ] Install `celery` and `redis` dependencies in Django virtualenv.
- [ ] Create `belajara_backend/celery.py` defining the Celery app instance.
- [ ] Update `belajara_backend/__init__.py` to import `celery_app`.
- [ ] Update `settings.py` adding `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `CELERY_ACCEPT_CONTENT`, and task serializers.
- [ ] Configure `.env` with default local Redis URL `redis://127.0.0.1:6379/1`.

### 2. Task Construction & Views Integration
- [ ] Define `analyze_curriculum_task(curriculum_id, mahasiswa_id)` in `explore/tasks.py`.
- [ ] Move parsing services (`pdf_service`, `excel_service`) and Gemini matcher service (`llm_service`) inside the task logic.
- [ ] Modify `PDFAnalyzeView` in `explore/views.py` to trigger the celery task using `.delay()` and return `curriculum_id` immediately.
- [ ] Create `AIRecommendationStatusView` endpoint mapping `/api/explore/recommendations/status/<int:curriculum_id>/` that queries if `AIRecommendation` has been saved in PostgreSQL. Returns `{"status": "success", "recommendations": [...]}` once completed.
- [ ] Register status endpoint route in `explore/urls.py`.

### 3. Frontend Polling Integration
- [ ] Add `api.explore.checkStatus(curriculumId)` in `belajara_frontend/src/lib/api.ts` to call status API.
- [ ] Modify `belajara_frontend/src/app/explore/page.tsx` file-upload flow:
  - [ ] Receive `curriculum_id` upon post submit.
  - [ ] Start polling interval fetching status every 2 seconds.
  - [ ] Render a loading state card skeleton during polling.
  - [ ] Display course recommendations cards once status is success.

### 4. Verification & Testing
- [ ] Run Pytest backend test suite checking asynchronous task dispatch.
- [ ] Launch Celery worker (`celery -A belajara_backend worker --loglevel=info`) and verify end-to-end curriculum upload manually in the web browser.
- [ ] Ensure Next.js frontend compiles successfully with typescript checks.
