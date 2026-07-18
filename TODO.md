# Build TODO — Hackathon

## Phase 1 — Scaffold [ ]
- [ ] Init Express server with CORS + dotenv
- [ ] Init React + Vite frontend
- [ ] Connect MongoDB Atlas
- [ ] Confirm both servers run

## Phase 2 — Auth [ ]
- [ ] User model (name, email, password bcrypt)
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login (returns JWT)
- [ ] authMiddleware.js
- [ ] Frontend: Login page
- [ ] Frontend: Register page
- [ ] Frontend: AuthContext with localStorage

## Phase 3 — Core Data [ ]
- [ ] Customer model + CRUD routes
- [ ] Invoice model + CRUD routes
- [ ] GST calculation logic in invoice creation
- [ ] Frontend: Customers page (list + add form)
- [ ] Frontend: Invoices page (list + create form)

## Phase 4 — AI Context Engine [ ]
- [ ] POST /api/reminders/evaluate (single invoice)
- [ ] Rule-based suppress/delay/send logic
- [ ] Claude API call for Hinglish message generation
- [ ] POST /api/reminders/evaluate-all (batch for dashboard)
- [ ] Frontend: Reminder Preview modal

## Phase 5 — Dashboard [ ]
- [ ] Stats: total invoices, outstanding amount, overdue count
- [ ] Recent invoices list
- [ ] "Run Smart Reminders" button
- [ ] Results list with SUPPRESS / DELAY / SEND / ESCALATE badges

## Phase 6 — Polish [ ]
- [ ] Seed script with demo data (3 customers, 5 invoices)
- [ ] Good looking UI (Tailwind)
- [ ] Error handling on all forms
- [ ] Test full demo flow end to end
```

---

Once these are in your folder, open Claude Code in VS Code (you already have it in the sidebar), paste this as your first message:
```
Read PRD.md and TODO.md in this folder. 
Then complete Phase 1 — scaffold the full project 
structure as described and get both servers running.