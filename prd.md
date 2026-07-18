# Smart Invoicing Assistant — PRD

## Problem
Micro and small businesses (kirana stores, freelancers, traders) lose money 
due to missed payment follow-ups, poorly timed reminders, and fragmented 
workflows across invoicing, messaging, and record-keeping apps.

## Solution
A context-aware invoicing assistant that:
1. Creates GST-compliant invoices with UPI payment links
2. Uses an AI context engine to decide when to send/delay/suppress reminders
3. Generates human-sounding Hinglish WhatsApp reminder messages via LLM
4. Provides a unified dashboard — no app switching needed

## Core Features
- Auth (register/login with JWT)
- Customer management (add/view customers)
- Invoice creation with GST auto-calculation
- Invoice status tracking (paid/unpaid/overdue)
- Smart Reminder Engine (rule-based context decisions)
- LLM message generation (Claude API — claude-sonnet-4-20250514)
- Dashboard with stats + Run Smart Reminders button

## Smart Reminder Logic
Before sending any reminder, evaluate:
- Paid in last 24hrs → SUPPRESS
- Reminder already sent in last 48hrs → SUPPRESS
- Current time between 10pm–7am → DELAY (schedule 9am)
- Invoice overdue > 7 days → ESCALATE tone
- Otherwise → SEND

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- AI: Claude API (claude-sonnet-4-20250514)
- Auth: JWT + bcrypt

## Out of Scope (Hackathon)
- Real WhatsApp integration (mock the message output)
- Real UPI payment gateway (show link only)
- SMS integration

## Demo Flow
1. Login as kirana store owner
2. Show customers + invoices in different states
3. Hit "Run Smart Reminders"
4. Show suppress/delay/send decisions per invoice
5. Show AI-generated Hinglish reminder message