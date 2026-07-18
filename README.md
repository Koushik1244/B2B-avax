# Smart Invoicing Assistant (AutoBiz)

AI-powered invoicing, reminders, and light inventory tooling for Indian small businesses — React + Express + MongoDB.

**GitHub:** https://github.com/Koushik1244/smart-invoicing-assistant
**Live App:** https://smart-invoicing-assistant.vercel.app
**Backend:** https://smart-invoicing-assistant.onrender.com

---

## Problem Statement

Modern systems struggle to manage user attention effectively in environments filled with constant notifications and fragmented applications. Frequent, poorly timed alerts and disconnected workflows disrupt focus, reduce productivity, and degrade user experience. Current solutions lack the ability to understand real-time user context — active tasks, behaviour, interaction patterns — and fail to determine whether a notification should be delivered, delayed, or suppressed. They also provide no seamless way to handle actions across multiple independent applications, forcing users to switch platforms to manage tasks and information.

---

## Problem Statement Alignment

| Challenge | What We Built |
|-----------|---------------|
| Poorly timed, constant alerts | **Busy Mode** + **activity tracking** + priority levels — reminders are suppressed when the owner is unavailable |
| Fragmented tools / app switching | **Unified SaaS** covering invoices, customers, analytics, procurement, and inventory in one app |
| No real-time user context understanding | `lastActiveAt` timestamp, `busyMode` flag read by automation engine every 60 seconds |
| No deliver/delay/suppress logic | **AI Reminder Engine** (SEND / ESCALATE / DELAY / SUPPRESS) powered by Google Gemini |
| Cross-application action gaps | OCR → Raw Materials → Inventory → Auto-Reorder pipeline with zero manual switching |
| Unnecessary interruptions | Background automation + batched in-app notifications with unread count |
| Inefficient workflows | One-click PDF export, UPI QR, auto reorder emails, Gemini-generated messages in 5 languages |

---

## Solution

A single app for invoices, customers, analytics, and optional raw-material / inventory tracking. A **workflow automation engine** runs on a schedule to drive notifications, emails, inventory reorder checks, and smart reminders (with Gemini-generated copy in multiple languages). **Nodemailer** sends real invoice and reminder mail when SMTP is configured.

---

## Pages (10 total)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Marketing page with 3D hero, problem/solution sections |
| `/login` | Login | JWT authentication |
| `/register` | Register | New account creation |
| `/dashboard` | Dashboard | Command centre — stats, charts, Gemini insights, busy mode toggle |
| `/invoices` | Invoices | Create, manage, PDF export, UPI QR, GST calculation |
| `/customers` | Customers | Customer book with health scores and unpaid balances |
| `/reminders` | Reminders | AI-powered batch reminder evaluation with language selector |
| `/analytics` | Analytics | Revenue, collection rate, monthly trends, top customers |
| `/raw-materials` | Raw Materials | Procurement recording with live GST preview and supplier analytics |
| `/inventory` | Inventory | Stock management, supplier scoring, OCR bill scan, auto-reorder |
| `/notifications` | Notifications | Activity feed — all system events with read/unread state |
| `/settings` | Settings | Account config, business details, reminder engine rules |
| `/about` | About | Rules explanation, tech stack, demo credentials |

---

## Features

### Invoicing & payments
- GST-oriented invoice creation with **PDF export** (jsPDF) and **UPI QR** per invoice (`qrcode.react`).
- Invoice status updates; **payment simulation** via webhook-style endpoint for demos.
- **Risk / priority scoring** on invoices and **customer health** scores (0–100).

### AI & automation
- **Google Gemini** for reminder message generation (Hinglish, English, Hindi, Marathi, Tamil), AI **business insights**, and **voice-to-invoice** parsing.
- **Smart reminder engine**: SUPPRESS / DELAY / SEND / ESCALATE — respects **activity** and **Busy Mode**.
- **Background automation** (`automationEngine`): runs every **60 seconds** for all users (notifications, emails, WhatsApp links, inventory checks).

### Communications & UX
- **Real email** via Nodemailer + Gmail app password (optional).
- **In-app notifications** with unread count badge in sidebar (polls every 30 s).
- **Dark / light mode** via ThemeContext.

### Operations extras
- **Raw materials** and **suppliers** with 4 analytics views (GST summary, monthly spend, supplier/material charts).
- **Inventory** lines with threshold-based reorder logic; weighted supplier scoring (price 50 % + delivery 30 % + rating 20 %).
- **OCR bill scan**: upload image → **Tesseract.js** + Multer (`/api/ocr/scan`).

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS, Recharts, Axios |
| 3D Hero  | Three.js, @react-three/fiber, @react-three/drei |
| Icons    | react-icons (hi2, io5, fa) |
| Backend  | Node.js, Express 4 |
| Database | MongoDB (Mongoose 8) |
| AI       | Google Gemini API (native `https` — no extra SDK needed) |
| Email    | Nodemailer (Gmail SMTP) |
| OCR      | Tesseract.js, Multer |
| PDF      | jsPDF + jspdf-autotable |

---

## Prerequisites

- **Node.js 18+**
- **MongoDB** (Atlas or local)
- **Gemini API key** — [Google AI Studio](https://aistudio.google.com/)
- **Gmail app password** (optional, for email) — [Google Account → App passwords](https://myaccount.google.com/apppasswords)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/Koushik1244/smart-invoicing-assistant.git
cd smart-invoicing-assistant
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment variables

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/DATABASE_NAME
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000

# Optional — email (omit to skip sending)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 4. Seed demo data

```bash
cd server
node seed.js
```

Creates demo user, 5 customers, 10 invoices spanning all reminder-engine scenarios, and 4 seed notifications.

### 5. Run the app

**Terminal 1 — API**
```bash
cd server
npm run dev
```

**Terminal 2 — Client**
```bash
cd client
npm run dev
```

Open **http://localhost:5173**. Health check: **GET** `http://localhost:5000/api/health`.

---

## Demo Credentials

| Field    | Value             |
|----------|-------------------|
| Email    | `demo@kirana.com` |
| Password | `demo1234`        |

---

## Demo Simulation (terminal)

Exercise the reminder decision flow against seeded invoices in two scenarios:

```bash
cd server
node demoSimulation.js
```

Output shows:
- **Scenario A** — Owner ACTIVE (just used the app): decisions based on real-time context
- **Scenario B** — Owner IDLE (30 min ago): shows how decisions shift
- Color-coded: GREEN = SEND, RED = ESCALATE, YELLOW = DELAY, GRAY = SUPPRESS

---

## API Overview

All `/api/*` routes except `GET /api/health` require **`Authorization: Bearer <JWT>`**.

| Area | Method | Path |
|------|--------|------|
| Health | GET | `/api/health` |
| Auth | POST | `/api/auth/register`, `/api/auth/login` |
| Auth | PATCH | `/api/auth/activity`, `/api/auth/busy-mode` |
| Customers | GET, POST, DELETE | `/api/customers`, `/api/customers/:id` |
| Customers | GET | `/api/customers/:id/health` |
| Invoices | GET, POST, DELETE | `/api/invoices`, `/api/invoices/:id` |
| Invoices | PATCH | `/api/invoices/:id/status` |
| Payments | POST | `/api/payments/webhook` |
| Reminders | POST | `/api/reminders/evaluate/:invoiceId`, `/evaluate-all` |
| Analytics | GET | `/api/analytics/advanced`, `/top-customers`, etc. |
| Insights | GET | `/api/insights` |
| Voice | POST | `/api/voice/parse` |
| Notifications | GET | `/api/notifications`, `/notifications/unread-count` |
| Notifications | PATCH | `/api/notifications/:id/read`, `/notifications/read-all` |
| Raw materials | GET, POST | `/api/raw-materials` |
| Raw materials | GET | `/api/raw-materials/analytics/suppliers`, `.../materials`, `.../gst`, `.../monthly` |
| Inventory | GET, POST, PATCH, DELETE | `/api/inventory`, `/api/inventory/:id` |
| Suppliers | GET, POST, DELETE | `/api/suppliers`, `/api/suppliers/:id` |
| OCR | POST | `/api/ocr/scan` (multipart/form-data) |
| Automation | GET | `/api/automation/status` |

---

## Priority Score Engine

Each invoice gets a numeric score (0–110) from overdue days, amount, and how often reminders were ignored:

| Factor | Points |
|--------|--------|
| 0 days overdue | 0 |
| 1–3 days | +10 |
| 4–7 days | +25 |
| 8–14 days | +40 |
| 15+ days | +60 |
| Amount < ₹1k | 0 |
| ₹1k–5k | +10 |
| ₹5k–10k | +20 |
| > ₹10k | +30 |
| Ignored 0× | 0 |
| Ignored 1–2× | +10 |
| Ignored 3+× | +20 |

**0–20 = low · 21–50 = medium · 51+ = high**

---

## Project Structure

```
smart-invoicing-assistant/
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/          # Layout, Sidebar, ui/ (BizCard, StatCard, PageHeader)
│       ├── context/             # AuthContext, ThemeContext
│       ├── pages/               # Landing, Login, Register, About, Dashboard,
│       │                        # Invoices, Customers, Reminders, Analytics,
│       │                        # RawMaterials, Inventory, Notifications, Settings
│       └── services/api.js
├── server/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/authMiddleware.js
│   ├── models/                  # User, Customer, Invoice, Notification,
│   │                            # RawMaterial, Inventory, Supplier, AutomationLog
│   ├── routes/                  # 14 route files
│   ├── services/                # automationEngine, reminderService, geminiService,
│   │                            # emailService, inventoryService, supplierService,
│   │                            # gstService, riskService
│   ├── server.js
│   ├── seed.js
│   ├── demoSimulation.js
│   └── .env.example
└── README.md
```

---

## Team

Built for **Hackathon 2026**.

| Name | Role |
|------|------|
| Koushik | Full-stack development, AI integration |
| Nagesh | Backend, automation engine, database design |
