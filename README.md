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

- Government ID verification + admin approval keeps reports authentic
- Categorised reports (Lost Person, Criminal Activity, Traffic, Animal Welfare, Environmental)
- Automatic search-radius expansion (every 24 hours) with targeted notifications
- Community sightings with photos, locations, and notes
- Admin console to approve users, moderate content, and monitor success metrics
- Web + mobile parity (web UI in this repo, mobile app planned via React Native)

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
git clone <repo-url>
cd FindIn
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env                 # fill with real secrets if needed
npm install
npm run dev                          # http://localhost:4000
```

Key environment variables:

```
MONGODB_URI=...
JWT_SECRET=...
PORT=4000
```

### 3. Frontend setup

```bash
cd ../frontend
cp .env.example .env.local           # optional: override NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                          # http://localhost:3000
```

Ensure `NEXT_PUBLIC_API_BASE_URL` points at the backend (default `http://localhost:4000`).

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

## 🛣️ Delivery roadmap (high-level)

1. **Backend foundation** – Express routes, MongoDB models, JWT auth ✅
2. **Verification workflow** – ID uploads, admin approvals (in progress)
3. **Radius automation** – Background jobs + notification fan-out ✅
4. **Web experience** – Reports feed, detail pages, report creation ✅
5. **Mobile app** – React Native client with camera + push notifications (planned)
6. **Admin console** – Moderation + analytics UI (planned)
7. **Deployment** – CI/CD (Vercel for frontend, Render/Heroku/AWS for backend) (planned)

---

## 🤝 Contributing

1. Fork the repo and create a feature branch
2. Backend changes go under `backend/src`; frontend changes under `frontend/src`
3. Run `npm run lint` (frontend) / `npm run build` (backend) before submitting
4. Open a pull request describing the problem solved

---

## 📬 Support

Have questions or suggestions? Open an issue in the repository or start a discussion.

Together we can make Indian neighbourhoods safer—**FindIn**.
