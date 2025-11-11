# FindIn Project Structure

This document provides a guided tour of the repository so contributors can quickly
locate backend, frontend, and shared assets. The repository is intentionally split
into two applications—`backend` for APIs and background work, and `frontend` for the
Next.js user interface.

```
FindIn/
├── backend/                  # Express + MongoDB service
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env(.example)        # Service configuration
│   ├── src/
│   │   ├── index.ts          # App bootstrap
│   │   ├── config/           # Database and runtime configuration
│   │   ├── middleware/       # Cross-cutting Express middleware
│   │   ├── routes/           # HTTP route definitions (auth, reports, comments)
│   │   ├── services/         # Background jobs, notification helpers
│   │   ├── types.ts          # Shared TypeScript contracts
│   │   └── utils/            # Serialisers and helpers
│   └── build/                # Generated JavaScript (npm run build)
│
├── frontend/                 # Next.js 15 application
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── app/              # App Router routes (marketing, auth, reports)
│   │   │   ├── page.tsx      # Marketing homepage aligned with FindIn spec
│   │   │   ├── login/…       # Auth pages
│   │   │   ├── register/…    # Registration flow
│   │   │   ├── reports/…     # Report listing + detail views
│   │   │   └── create-report # Report creation UI
│   │   ├── components/       # Reusable UI primitives (shadcn/ui)
│   │   ├── contexts/         # React context providers (e.g. AuthProvider)
│   │   ├── hooks/            # Reusable hooks (toasts, responsive helpers)
│   │   └── lib/              # Frontend utilities (REST client, socket helpers)
│   └── public/               # Static assets (logos, images, robots.txt)
│
├── docs/                     # Project documentation
│   └── STRUCTURE.md          # (This guide)
└── README.md                 # High-level overview
```

## Backend layout

| Directory          | Purpose                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `config/`          | MongoDB connection helper and configuration utilities                                     |
| `middleware/`      | Authentication middleware and any future request guards                                   |
| `routes/`          | Express routers responsible for wiring HTTP verbs to controller logic                     |
| `services/`        | Domain services (background radius expansion, notification fan-out, etc.)                 |
| `utils/`           | Serialisers and cross-cutting helpers shared across routes/services                       |
| `types.ts`         | Canonical TypeScript interfaces for MongoDB documents                                     |

## Frontend layout

| Directory               | Purpose                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `app/`                  | Next.js App Router entries: marketing page, auth pages, reports dashboard                     |
| `components/ui/`        | Extracted UI primitives based on shadcn/ui (accordion, dialog, button, etc.)                  |
| `contexts/`             | Application-wide context providers (currently `AuthContext`)                                  |
| `hooks/`                | Reusable React hooks (`useToast`, `useIsMobile`)                                              |
| `lib/`                  | Client-side helpers for REST (`api.ts`), sockets, and miscellaneous utilities (`utils.ts`)     |

## Suggested navigation flow

1. **Start backend first** (`cd backend && npm run dev`) — this exposes REST APIs on `http://localhost:4000`.
2. **Run the frontend** (`cd frontend && npm run dev`) — the Next.js app consumes the backend via `NEXT_PUBLIC_API_BASE_URL`.
3. **Add new features** by co-locating backend work under `backend/src/routes|services` and frontend work under `frontend/src/app`.
4. **Document changes** in `docs/` if you introduce new architectural pieces or workflows.

This structure mirrors the specification that FindIn should have clearly separated
backend and frontend code while remaining approachable for new contributors.

