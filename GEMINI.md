# Project Mandates: Belajara

## 1. Project Identity
Belajara adalah Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah untuk Mahasiswa Indonesia.

## 2. Technical Stack
- **Backend:** Django 5.x (Python 3.12+).
- **Database:** PostgreSQL.
- **Cache/Queue:** Redis.
- **Architecture:** Enterprise-grade with Service Layer pattern.
- **Testing:** Pytest (Unit & Integration tests are mandatory).
- **Payment:** Midtrans Integration.

## 3. Design System (Anti-Slop Guidelines)
- **Concept:** "Ethical Minimalism" inspired by **Qurtuba (Phenomenon Studio)**.
- **UI Framework Reference:** 
    - Use **shadcn/ui** (https://ui.shadcn.com/) for all base components (Buttons, Cards, Inputs, etc.).
    - Dashboard layout MUST follow the **shadcn/ui Dashboard Example** (https://ui.shadcn.com/examples/dashboard).
- **Visual Style (Reference: Dribbble - Qurtuba):**
    - **Layout:** Modular card-based system, task-oriented zoning, clean sidebars.
    - **Typography:** 
        - Heading: 'Playfair Display' (Serif) for elegance.
        - Body: 'Geist' or 'Montserrat' (Sans-Serif) for legibility.
    - **Colors (Qurtuba Palette):**
        - Background: Soft Off-White (#FAF9FB).
        - Primary: Deep Charcoal (#060708).
        - Accent 1: Muted Mauve (#C6B5BF) - for sophisticated secondary elements.
        - Accent 2: Vibrant Red (#CF3A1F) - for high-priority actions/alerts.
- **Standard:** Every component created by AGENT_FRONTEND must be cross-referenced with shadcn/ui docs. No generic "blue button" AI defaults allowed.

## 4. Multi-Agent Orchestration Rules
- **Main Agent Role:** Acts as Lead Architect and Orchestrator.
- **Mandatory Task Planning:** 
    - BEFORE spawning sub-agents or writing code, the Main Agent MUST present a structured "Implementation Plan" divided into tasks.
    - The Main Agent MUST wait for User Approval before proceeding to the execution phase.
- **Delegation:** Always break complex tasks into sub-tasks and spawn specialist agents:
    - `AGENT_MODELS`: Handles database schema & migrations.
    - `AGENT_FRONTEND`: Handles UI/UX & Templates (Strict shadcn/ui + Qurtuba standards).
    - `AGENT_BACKEND_CORE`: Handles logic, services, and third-party APIs.
- **Workflow:** Use Git Worktrees/Branches for parallel agent tasks.
- **Task Tracking:** Utilize the `tasks/` directory to store detailed task specs in Markdown format if the task is complex.

## 5. Engineering Standards
- **Git:** Use conventional commits (e.g., `feat:`, `fix:`, `docs:`).
- **Code Style:** Strict adherence to PEP 8 (Backend) and Prettier/Standard (Frontend).
- **Documentation:** Every new feature MUST include an updated entry in the `docs/` folder or a README update.
- **API Design:** Follow RESTful principles; use Django Rest Framework (DRF) if building a decoupled API.
- **Security:** Never log or commit secrets; use environment variables for Midtrans and AI keys.
