# 🧭 FindIn – Lost People & Criminal Finder Platform

FindIn is a community-safety platform for India. Verified agencies and responders
publish reports about missing persons or critical incidents, the system broadcasts
alerts to people inside the search radius, and citizens feed sightings back with
geo-tagged evidence. The search radius expands each day, ensuring new neighbourhoods
are engaged until the case is resolved.

The repository contains two applications:

- **`backend/`** – Node.js + Express service (MongoDB, JWT auth, background workers)
- **`frontend/`** – Next.js 15 client (App Router, Tailwind, shadcn/ui components)

Documentation on the full file structure lives in [`docs/STRUCTURE.md`](docs/STRUCTURE.md).

---

## 🔑 Core capabilities

- Verified onboarding (citizens, responders, admins) with moderation workflow, ID document review, and audit logging
- Categorised reports (Lost Persons, Women’s Safety, Senior Citizens, Criminal Activity, Environmental alerts)
- Automatic search-radius expansion with location-aware notifications (Twilio SMS + SendGrid email fan-out)
- Community sightings with geo-tagged photos, notes, report-abuse handling, and confidence scoring roadmap
- Admin console to approve users, triage reports, review ID proofs, issue responder invites, and monitor metrics
- Admin 2FA enrolment (TOTP) for high-privilege accounts
- Responsive web UI (this repo) with upcoming React Native field app

---

## ⚙️ Tech stack

**Backend**

- Express 5 + TypeScript
- MongoDB Atlas (provided connection string)
- JWT auth with bcrypt password hashing
- Background job service for automated radius expansion + notifications

**Frontend**

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS and shadcn/ui component primitives
- REST client talking to `backend` via `NEXT_PUBLIC_API_BASE_URL`

---

## 🚀 Getting started

### 1. Clone the repository

```bash
git clone https://github.com/subodh-001/FindIn.git
cd FindIn
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env                 # fill with real secrets if needed
npm install
npm run lint                         # type-checks
npm run dev                          # http://localhost:4000
```

Key environment variables:

```
MONGODB_URI=...
JWT_SECRET=...
PORT=4000

# 2FA, notifications, and communications
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+91XXXXXXXXXX
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=alerts@findin.in
```

### 3. Frontend setup

```bash
cd ../frontend
cp .env.example .env.local           # optional: override NEXT_PUBLIC_API_BASE_URL
npm install
npm run lint
npm run dev                          # http://localhost:3000
```

Ensure `NEXT_PUBLIC_API_BASE_URL` points at the backend (default `http://localhost:4000`).

### 4. Linting & tests (WIP)

- Backend: `npm run lint` runs TypeScript in `--noEmit` mode. Add Jest tests under `backend/src/__tests__`.
- Frontend: `npm run lint` uses Next.js ESLint defaults. Playwright tests will live under `frontend/tests` (coming soon).

### 5. Staging deployment (WIP)

The pilot playbook (`docs/PILOT_ROADMAP.md`) documents the work required to bring up a staging environment with encrypted storage, audit logging, and partner integrations.

---

## 🗂️ Repository layout

```
backend/
  src/
    config/          # Mongo connection helpers
    middleware/      # Auth guards
    routes/          # Express routers (auth, reports, comments)
    services/        # Background jobs, notification fan-out
    types.ts         # MongoDB document interfaces
    utils/           # Serialisers and shared helpers

frontend/
  src/
    app/             # Next.js routes (home, auth, reports, admin)
    components/ui/   # shadcn/ui based primitives
    contexts/        # React contexts (AuthProvider)
    hooks/           # Reusable hooks (toast, responsive)
    lib/             # REST client, socket helpers, utilities

docs/
  STRUCTURE.md       # Detailed explanation of the project structure
```

---

## 🛣️ Delivery roadmap

1. **Phase 0 – Foundations** ✅  
   Code audit, pilot scope, environment scaffolding, lint/test baselines. See `docs/PILOT_ROADMAP.md`.
2. **Phase 1 – Pilot slice** ✅  
   Verified missing-person workflow, document uploads (MongoDB GridFS), admin review queue, responder invites, two-factor auth, automated radius alerts with SMS/email fan-out.
3. **Phase 2 – Community intelligence**  
   Sighting moderation, photo metadata, trust scoring, Socket.IO powered live updates.
4. **Phase 3 – Partner integrations**  
   Public APIs, webhooks, React Native responder app with offline capture.
5. **Phase 4 – Evidence & trust**  
   Analytics dashboards, privacy/compliance centre, volunteer training hub.
6. **Phase 5 – Platform hardening**  
   Automated tests, IaC, observability, performance tuning, disaster recovery drills.

Each phase should be piloted in one city before city-wide expansion.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch
2. Backend changes go under `backend/src`; frontend changes under `frontend/src`
3. Run `npm run lint` (frontend) / `npm run build` (backend) before submitting
4. Open a pull request describing the problem solved

---

## 📬 Support

- Pilot coordination: reach out via issues or discussions for access to the pilot toolkit.
- Feature requests and bug reports: open an issue with steps and screenshots.

Together we can make Indian neighbourhoods safer—**FindIn**.
