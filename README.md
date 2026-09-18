# QuoteHub — Mini B2B RFQ Marketplace

A full-stack B2B Request for Quotation marketplace where **Buyers** create RFQs and **Suppliers** submit quotations.

## Live Demo

- 🔗 **Live Application URL:** [https://quotehub-yfat.onrender.com](https://quotehub-yfat.onrender.com)
- 📦 **GitHub Repository:** [https://github.com/Abhinav-Shrivas/QuoteHub](https://github.com/Abhinav-Shrivas/QuoteHub)

> [!NOTE]
> **Render Free Tier & Data Persistence:**  
> - **Cold Start:** Since this project is hosted on Render's free tier, the backend web service spins down after a period of inactivity. If the service is currently asleep, the initial load may take around **30 to 50 seconds** to wake up. Once active, the application responds immediately and smoothly.
> - **SQLite Persistence (Ephemeral Disk):** Because Render free web services run on ephemeral disks, new records (such as freshly registered accounts, newly posted RFQs, or new bids) will not persist permanently across instance spin-downs or redeployments. However, the pre-seeded demo accounts and base catalog are automatically re-initialized on every restart for uninterrupted testing.

### Demo Credentials

For quick testing, I have pre-seeded two demo accounts that can be auto-filled with one click on the login page:

| Role | Email | Password | Company |
|------|-------|----------|---------|
| **Buyer** | `buyer@test.com` | `password123` | Acme Global Corp |
| **Supplier** | `supplier@test.com` | `password123` | Apex Steel & Supplies Ltd |


## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (Vite), React Router v7 |
| **Styling** | Vanilla CSS |
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

**Key Architectural Decisions:**
- **I chose SQLite** over PostgreSQL for zero-configuration simplicity during evaluation. The application is a focused prototype where SQLite handles this workload cleanly. Because Render's free tier uses ephemeral storage, new records reset on instance spin-downs/redeployments; for a full-scale production deployment, I would attach persistent storage or migrate to PostgreSQL.
- **I used a monorepo structure** with `client/` and `server/` directories. For production deployment, I configured the Express server to serve the built Vite assets as a single unified process.
- **I configured JWT authentication** stored in `localStorage` with a 7-day expiry, encoding the user role directly in the payload for immediate frontend routing checks.
- **I enforced a single active quotation per supplier per RFQ** at the database level via a `UNIQUE(rfq_id, supplier_id)` constraint, while allowing suppliers to revise and update their submitted bids.

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/Abhinav-Shrivas/QuoteHub.git
cd QuoteHub
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

## Key Assumptions

1. **Closed-Bid Quotation Model**: Suppliers can inspect full RFQ specifications and buyer company details, but competing supplier quotations remain strictly private and visible only to the buyer who created the RFQ.
2. **Single Definitive Bid per Supplier**: A supplier submits one active quotation per RFQ rather than multiple competing entries. Suppliers can modify and refine their quote (price, delivery timeline, notes) at any time while the RFQ remains open, enforced by a database-level `UNIQUE(rfq_id, supplier_id)` constraint.
3. **RFQ Status & Lifecycle**: RFQs transition between `open` and `closed`. Once closed or past deadline, quote submissions are disabled. Buyers can manually close an RFQ at any time once satisfied with quotes.
4. **Zero-Configuration Review Setup**: I specifically chose SQLite with WAL (Write-Ahead Logging) so evaluators can run and test my application instantly without configuring external database services or Docker containers.
5. **Decoupled Stateless Auth**: I designed the JWT payload with user ID, role, and company details to allow immediate client-side route guarding while the backend independently enforces role-based access control on every endpoint.

---

## Limitations & Technical Debt 

1. **No Admin & Moderation Panel**: I implemented only Buyer and Supplier roles for this scope. I did not build a back-office administrative panel for platform oversight, user management, account suspensions, RFQ content moderation, or aggregate transaction analytics.
2. **Bloated Route Handlers (Lack of Layered Architecture)**: I wrote route handlers in `server/routes/` directly combining input validation, raw SQL queries, authorization checks, and response formatting. In an enterprise production codebase, I would refactor this into a clean layered architecture (Controllers → Service/Domain Layer → Data Access/Repository pattern).
3. **No Automated Unit or Integration Testing**: While I thoroughly verified the application flows through manual testing and end-to-end browser walkthroughs, I did not set up an automated CI test suite (e.g., Jest/Vitest for unit tests, Supertest for backend integration tests, or React Testing Library for component tests).
4. **Simplified User Interface**: I built the UI using custom Vanilla CSS, focusing on core marketplace workflows and responsive dark-mode aesthetics. I deliberately omitted complex enterprise UI features (e.g., multi-step creation wizards, rich-text WYSIWYG specifications, interactive analytics charts, or drag-and-drop document uploaders) to keep the prototype clean and focused.
5. **Single-Process Infrastructure**: I structured the application as a single Node.js process, so it currently runs without real-time WebSockets, background message queues (e.g., Redis/BullMQ) for deadline expiration workers, or Docker containerization.
6. **Token Storage**: I stored JWTs in `localStorage` for prototype simplicity rather than setting up hardened `httpOnly` secure cookies with CSRF mitigation.


