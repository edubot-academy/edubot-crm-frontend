# Edubot CRM Frontend (Minimal Manager UI — Enhanced)

## New UI Enhancements
- Sidebar layout with icons (lucide-react)
- Card system, buttons, inputs, selects, badges
- Sticky table headers, hover rows, skeleton loaders
- Toast notifications for success/errors
- Cleaner Login screen

## Install new deps
```bash
npm i lucide-react @radix-ui/react-toast
```

Then restart dev server:
```bash
npm run dev
```

# Edubot CRM Frontend (Minimal Manager UI)

## Quick Start

```bash
npm i 
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and login (admin/sales user).

## Config
- `VITE_API_BASE_URL` → Backend base (e.g., http://localhost:4000/api)
- `VITE_REFRESH_ENABLED` → `true` to use `/auth/refresh` if your backend has it

## Features
- Login (JWT store in localStorage)
- Contacts list with search/status/pagination
- Contact detail: allowed status transitions, next follow-up, notes, priority, tags
- Role gating via JWT claim `role` (backend enforces row-level rules)

## Next
- Add audit timeline (GET /contacts/:id/logs)
- CSV export, KPI page, assign/unassign UI
- Toaster notifications, nicer components (shadcn/ui)