# Task 06: Production Hardening, Security, & API Optimizations

## Goal
Harden the Belajara application for production readiness. Secure the payment callbacks with verified cryptographic signatures, set up logging, optimize database query performance, and ensure frontend security.

---

## Todo List

### 1. Payment Callback Security & Webhook Hardening
- [ ] Enforce cryptographically secure verification of Midtrans signatures using HMAC-SHA512.
- [ ] Implement checks for double-processing transactions (idempotency key checks or transaction state validations).
- [ ] Handle edge-case webhook statuses from Midtrans: refund, chargeback, capture fraud status.

### 2. File Upload & Storage Management
- [ ] Configure Django `django-storages` with AWS S3 support (controlled by environment flags).
- [ ] Implement fallback to secure local files directory inside `/media/` using unique hash filenames.
- [ ] Clean up uploaded temp curriculum files periodically (Celery cron job).

### 3. API Performance & DB Optimizations
- [ ] Enable cursor-based or offset pagination on `/api/courses/` course list catalog endpoint.
- [ ] Add query prefetches (`prefetch_related('modules')` and `select_related('user')`) to eliminate N+1 query bottlenecks in dashboard APIs.
- [ ] Configure Cache-Control headers for static course contents and module slides.

### 4. Logging & Monitoring
- [ ] Set up file-rotation logging for critical actions (enrollments, payments, AI call failures).
- [ ] Implement Sentry or custom error boundaries on frontend to capture runtime exceptions.
- [ ] Ensure frontend CORS allowed origins are strictly configured.
