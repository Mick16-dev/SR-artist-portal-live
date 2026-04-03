# Artist Portal Implementation Plan - v1.0

This document tracks the progress of the **Artist Portal** application, designed for secure document collection and show management.

## 🛠 Phase 1: Foundation & Security
- [x] **Project Scaffolding**: Setup Next.js (App Router), TailwindCSS, and basic architecture.
- [x] **Secure Token-Based Access**: Implement server-side validation for `portal_token` parameters.
- [x] **Error States**: Build polished "Invalid Token" and "Expired Token" views to guide artists.
- [x] **Supabase Connectivity**: Establish secure data fetching for specific shows and artist materials.

## 🛠 Phase 2: Artist Experience & UI
- [x] **Core Portal Layout**: Design a mobile-first, professional interface focusing on Clarity.
- [x] **Show Detail Section**: Display venue, location, and date dynamically from the database.
- [x] **Smart Progress Bar**: Implement a feedback-driven bar that tracks overall document status.
- [x] **Interactive Document Cards**: Build components to show deadline, status, and overdue alerts.

## 🛠 Phase 3: Document Management & Uploads
- [x] **N8N Webhook Integration**: Connect the portal to the backend automation via `NEXT_PUBLIC_N8N_UPLOAD_WEBHOOK`.
- [x] **File Validation**: Implement strict PDF/DOC/DOCX checks and 10MB size limits.
- [x] **Drag-and-Drop Interface**: Add visual cues and handlers for easy file submissions.
- [x] **Celebration Logic**: Trigger confetti and success toasts when all requirements are met.
- [x] **Email Notifications**: Automatically trigger a follow-up email to the promoter via n8n after the final upload.

---

## 🚦 Status Summary
- **Current Phase:** 3 (Refining Upload Workflows & Notifications)
- **Overall Progress:** 90%
- **Status:** Core functionality is complete. The portal successfully validates, fetches, and uploads files to the automation backend.
