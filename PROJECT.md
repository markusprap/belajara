# Project: Belajara - AI Transcript & Curriculum Analysis Refactoring

## Architecture
- Django 5.x Backend, Django REST Framework APIs.
- Celery worker executes asynchronous analysis tasks.
- Google Gemini API (`gemini-2.0-flash`) is used for parsing transcripts and mapping competency dimensions.
- PostgreSQL database stores `Curriculum` (uploaded metadata) and `AIRecommendation` (parsed recommendations & academic profile).

## Code Layout
- `belajara_backend/explore/views.py`: API View for PDF upload and AI status check.
- `belajara_backend/explore/tasks.py`: Asynchronous Celery tasks for parsing PDF/Excel and calling the LLM.
- `belajara_backend/explore/services/llm_service.py`: LLM API logic, competency axes hints, normalization of LLM response.
- `belajara_backend/explore/tests.py`: Existing and new test suite.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Alignment | Analyze parsing, API structure, credit gating logic, and current test results. | None | DONE |
| 2 | Backend Core Refactoring | Implement dynamic study program detection, strict completed subjects extraction (prevent hallucinations), dynamic competency mapping, and credit protection. | M1 | DONE |
| 3 | Testing & Verification | Add new unit/integration tests for Accounting and SI transcripts, verify zero credit deduction on failure, and run pytest. | M2 | DONE |
| 4 | Final Acceptance Gate | Run Forensic Auditor to confirm clean status and verify complete feature integration. | M3 | DONE |

## Interface Contracts
- `analyze_curriculum_text(text: str, available_courses: list, is_premium: bool, study_program: str)`: Refactored to dynamically detect study program from text, strictly extract subjects, map correct competency axes, and return formatted payload.
- `analyze_curriculum_task(curriculum_id, mahasiswa_id, target_prodi=None)`: Refactored to pass correct params, receive detected study prodi, and save recommendations securely.
