# AutoBiz Confidential

B2B invoicing application with confidential payments via Avalanche eERC (Converter Mode) and wallet-based login (SIWE-style sign-in with Ethereum).

Built for the Avalanche Speedrun Hackathon.

**Live app:** https://b2b-avax.vercel.app
**Backend API:** https://b2b-avax.onrender.com
**Repository:** https://github.com/Koushik1244/B2B-avax

---

## Overview

AutoBiz Confidential lets businesses create and manage invoices, then settle them using **eERC (encrypted ERC)** on Avalanche — a confidential token standard that hides transfer amounts using zero-knowledge proofs, while still running on a public, auditable chain. Users can log in either with a traditional email/password flow or by signing a message with their Ethereum wallet (MetaMask), with no gas cost for login.

### Key features

- 📄 **Invoice management** — create, view, and track B2B invoices
- 🔒 **Confidential payments via eERC** — "Pay via eERC" triggers a real ZK-proof-based confidential transfer on Avalanche Fuji testnet; transfer amounts are hidden but the transaction is verifiable on-chain
- 🦊 **Wallet login (SIWE-style)** — sign a message with MetaMask to authenticate, no password needed, runs alongside existing email/password auth
- ✅ **On-chain proof** — paid invoices show a tx hash badge linking to Snowtrace (Fuji testnet explorer)

---

## Architecture

```
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Invoices.jsx          # Invoice list, eERC payment UI, tx hash badges
│   │   │   └── Login.jsx             # Email/password login + wallet login
│   │   ├── services/
│   │   │   ├── auth.js               # Auth API calls, incl. wallet nonce/verify
│   │   │   └── api.js
│   │   └── context/
│   │       └── AuthContext.jsx       # Shared auth state (login/logout, JWT storage)
│
├── server/                          # Express backend
│   ├── controllers/
│   │   ├── invoiceController.js      # payEerc() spawns Hardhat script for eERC transfers
│   │   └── walletAuthController.js   # walletNonce() / walletVerify() — SIWE-style auth
│   ├── models/
│   │   └── User.js                   # Includes walletAddress field (unique, sparse)
│   ├── routes/
│   │   └── authRoutes.js
│   ├── eerc-backend-converter/       # eERC Converter Mode scripts, ZK artifacts (Hardhat)
│   │   └── scripts/converter/
│   │       └── 07_transfer.ts        # Confidential transfer script, run as child process
│   └── server.js                     # Express app, CORS whitelist
```

### How eERC payments work

1. User clicks **"Pay via eERC"** on an invoice.
2. The Express backend (`invoiceController.js`) spawns a Hardhat script (`07_transfer.ts`) as a child process against the Avalanche Fuji testnet, rather than porting ZK proof generation directly into the Express process.
3. The script performs the confidential transfer and prints a `TRANSFER_RESULT_JSON:` line to stdout.
4. The backend parses that output, updates the invoice with the transaction hash and status.
5. The frontend displays a **"🔒 Paid privately via eERC"** badge linking to the transaction on Snowtrace testnet.

### How wallet login works

1. Frontend requests a one-time nonce from the backend (`POST /api/auth/wallet/nonce`) for the connected wallet address.
2. User signs a message containing that nonce via MetaMask (`personal_sign` — no gas, no transaction).
3. Frontend sends the signature to the backend (`POST /api/auth/wallet/verify`).
4. Backend recovers the signing address with `ethers.verifyMessage()`, confirms it matches, consumes the nonce (single-use), and finds or creates a `User` document tied to that wallet address.
5. Backend issues a JWT in the same format as email/password login, so the rest of the app (protected routes, `AuthContext`) works identically regardless of login method.

> **Note:** the nonce store is currently in-memory (a `Map` with a 5-minute TTL), which is fine for a single Render instance but would need to move to Redis or the database if the app is scaled across multiple instances.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB |
| Blockchain | Avalanche Fuji testnet, eERC (Converter Mode), Hardhat |
| Auth | JWT (email/password + wallet-based SIWE-style) |
| Wallet integration | ethers.js v6, MetaMask |
| Hosting | Backend on Render, frontend on Vercel |

---

## Getting started (local development)

### Prerequisites

- Node.js
- MongoDB instance (local or hosted)
- A Fuji testnet-funded wallet/private key for running eERC transfer scripts
- MetaMask browser extension (for wallet login — disable/deprioritize other injected wallets like Phantom to avoid `window.ethereum` conflicts)

### Backend setup

```bash
cd server
npm install
cd eerc-backend-converter
npm install --ignore-scripts   # skips ZK circuit recompilation — precompiled artifacts are already included
cd ..
```

Create a `.env` file in `server/` with:

```
MONGO_URI=
JWT_SECRET=
GEMINI_API_KEY=
EMAIL_USER=
EMAIL_PASS=
PORT=10000
RPC_URL=
PRIVATE_KEY=
PRIVATE_KEY_2=
```

Run the backend:

```bash
node server.js
```

### Frontend setup

```bash
cd client
npm install
```

Create a `.env` file in `client/` with:

```
VITE_API_URL=http://localhost:10000
```

Run the frontend:

```bash
npm run dev
```

---

## API reference

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/wallet/nonce` | Request a nonce to sign for wallet login (`{ address }`) |
| POST | `/api/auth/wallet/verify` | Verify signed nonce, returns JWT (`{ address, signature }`) |

### Invoices

| Method | Route | Description |
|---|---|---|
| PATCH | `/api/invoices/:id/pay-eerc` | Triggers a confidential eERC payment for the invoice |

---

## Deployment

- **Backend (Render):** root directory `server`; build command `npm install && cd eerc-backend-converter && npm install --ignore-scripts && cd ..`; start command `node server.js`.
- **Frontend (Vercel):** root directory `client`; framework auto-detected as Vite; env var `VITE_API_URL` pointed at the Render backend URL.
- CORS on the backend is whitelisted to the deployed frontend origin.

---

## Known limitations / future work

- Wallet-login nonce store is in-memory only — needs Redis or a persistent store for multi-instance deployments.
- Invoices created under an email/password account and a wallet-based account are tied to separate `User` documents — cross-session invoice visibility between the two login methods hasn't been fully verified.
- An unrelated, pre-existing Gemini API version error appears in logs for an "Insights" feature — not related to eERC or wallet login, safe to ignore for now.
- Real secrets were shared during development and should be rotated (`JWT_SECRET`, `GEMINI_API_KEY`) as a precaution, even though they were never committed to git.

---

## License

Add license details here.