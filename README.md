# RFQ Market — Mini B2B RFQ Marketplace

A full-stack B2B Request for Quotation marketplace where **Buyers** create RFQs and **Suppliers** submit quotations.

## Live Demo

> _Deployment URL will be added after deploying._

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (Vite), React Router v7 |
| **Styling** | Vanilla CSS (dark theme, glassmorphism) |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (via better-sqlite3) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Validation** | express-validator |

## Architecture

```
┌─────────────────────────────────────────────┐
│           React SPA (Vite)                   │
│   Auth Pages │ Buyer Dashboard │ Supplier    │
└──────────────────┬──────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼──────────────────────────┐
│           Express.js API Server              │
│   /api/auth  │  /api/rfqs  │  /api/quotations│
│   JWT Middleware │ Role-Based Authorization   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              SQLite Database                 │
│   users │ rfqs │ quotations                  │
└─────────────────────────────────────────────┘
```

**Key Decisions:**
- **SQLite** was chosen over PostgreSQL for zero-configuration simplicity. The app is a demo — SQLite handles this scale perfectly. In production, you'd swap to PostgreSQL.
- **Monorepo structure** with `client/` and `server/` directories. In production, the Vite build output is served by the Express server (single process deployment).
- **JWT** stored in `localStorage` with 7-day expiry. Token contains user role for fast authorization checks.
- **One quotation per supplier per RFQ** — enforced at DB level via UNIQUE constraint. Suppliers can update their quote.

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd rfq-marketplace
```

### 2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure environment
Create `server/.env`:
```env
JWT_SECRET=your-secret-key-here
PORT=5000
```

### 4. Run in development
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```
Frontend runs at `http://localhost:5173`, API at `http://localhost:5000`.

### 5. Build for production
```bash
cd client
npm run build

cd ../server
npm start
```
The Express server serves the built frontend from `client/dist/`.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### RFQs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/rfqs` | Buyer | Create an RFQ |
| GET | `/api/rfqs` | Any | List RFQs (role-filtered) |
| GET | `/api/rfqs/:id` | Any | Get RFQ details |
| PUT | `/api/rfqs/:id` | Buyer (owner) | Update an RFQ |
| DELETE | `/api/rfqs/:id` | Buyer (owner) | Delete an RFQ |
| PATCH | `/api/rfqs/:id/close` | Buyer (owner) | Close an RFQ |

### Quotations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/rfqs/:id/quotations` | Supplier | Submit/update a quotation |
| GET | `/api/rfqs/:id/quotations` | Buyer (owner) | View quotations for an RFQ |
| GET | `/api/quotations/my` | Supplier | View own submitted quotations |

## Database Schema

- **users**: id, name, email (unique), password (bcrypt), role (buyer/supplier), company
- **rfqs**: id, buyer_id (FK), title, description, quantity, delivery_location, deadline, status (open/closed)
- **quotations**: id, rfq_id (FK), supplier_id (FK), price, delivery_time, message, UNIQUE(rfq_id, supplier_id)

## Features

### Buyer
- ✅ Create, edit, delete RFQs
- ✅ Set product name, description, quantity, location, deadline
- ✅ View dashboard with stats
- ✅ View received quotations with supplier details
- ✅ Close RFQs
- ✅ Search/filter own RFQs

### Supplier
- ✅ Browse all open RFQs
- ✅ Search by title, description, location
- ✅ Sort by newest or deadline
- ✅ View full RFQ details
- ✅ Submit quotation (price, delivery time, message)
- ✅ Update existing quotation
- ✅ View all submitted quotations

### Technical
- ✅ JWT authentication with role-based authorization
- ✅ Input validation (server-side with express-validator, client-side with HTML5)
- ✅ Error handling (API errors, auth errors, validation errors)
- ✅ Loading, empty, and error states in UI
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Secure password hashing (bcrypt)
- ✅ Foreign key constraints and database indexes

## Assumptions & Limitations

1. **No real-time updates** — Users need to refresh to see new data
2. **No file attachments** — RFQs are text-based
3. **No email verification** — Simplified registration flow
4. **SQLite** — Not suited for high-concurrency production use
5. **No admin panel** — Only buyer and supplier roles
6. **JWT in localStorage** — For production, httpOnly cookies would be more secure
