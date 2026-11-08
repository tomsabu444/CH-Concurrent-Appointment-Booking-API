# Concurrent Appointment Booking API

Technical Assessment Submission for the **Node.js Backend Developer** position.

---

## 📌 Problem Overview
Develop a single REST API endpoint (`POST /api/appointments/book`) to book a doctor's appointment using **Node.js, Express.js, TypeScript, and Microsoft SQL Server (MSSQL)**.

The core objective is to guarantee that when two patients attempt to book the exact same appointment slot simultaneously:
- Exactly **one** request succeeds (`200 OK` or `201 Created`).
- The competing request receives a booking conflict response (`409 Conflict`).
- **Zero duplicate records** are ever created.
- Database consistency and atomic rollback are strictly maintained.

---

## 📁 Project Architecture & Structure
For a full breakdown of the directory layout, layer responsibilities, and container configurations, refer to the documentation:
👉 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## 🛠️ Technology Stack
- **Runtime**: Node.js v22 LTS
- **Language**: TypeScript (Strict mode)
- **Framework**: Express.js
- **Database**: Microsoft SQL Server (MSSQL 2022)
- **Driver**: `mssql` (official Tedious TDS driver)
- **Logging**: `pino` & `pino-http` (zero-blocking structured logs with unique `X-Request-Id` correlation)
- **API Documentation**: OpenAPI / Swagger UI (`/api-docs`)
- **Containers**: Docker & Docker Compose

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
npm ci
```

### 2. Configure Environments
Create the environment files from the provided templates:
```bash
# Database environment
cp database/.env.example database/.env

# Backend API environment
cp apps/backend/.env.example apps/backend/.env
```

### 3. Run with Docker (Development Mode)
To start both the database and the backend with live hot-reload:
```bash
npm run docker:dev
```
Development uses polling to detect source edits on Docker Desktop for Windows. Changes under `apps/backend/src` restart the API automatically; dependency and Dockerfile changes require a rebuild.

To build and start the backend in the background (detached mode):
```bash
npm run compose:dev -- up -d
```
This also starts the required SQL Server service and waits for its health check. View backend logs with `npm run compose:dev -- logs -f backend`; stop the development stack with `npm run compose:dev -- down`.

- API Server: `http://localhost:3000`
- Swagger UI Docs: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

### 4. Local Development (Without containerizing the API)
You can also run SQL Server in Docker while running the Node.js API directly on your host machine. Set backend `DB_SERVER=localhost` and `DB_PORT=1433` to connect through the fixed published database port; local Node listens on backend `PORT`:
```bash
# Start just SQL Server
npm run compose:dev -- up sqlserver -d

# Initialize database schema and seed sample data
npm run db:init

# Start local dev server
npm run dev
```

---

## 🧪 Testing & Verification

### 1. Automated Test Suite (Jest + Supertest)
The test suite is structured following a **Feature-Mirrored Architecture** with full test isolation (dynamic test fixtures, zero manual database resets):
```bash
# Run all unit, integration, and concurrency tests (24 tests across 4 suites)
npm test
```

### 2. Dedicated Concurrency Testing Script (`tests/concurrency.test.ts`)
A dedicated, standalone HTTP verification script located at [`tests/concurrency.test.ts`](tests/concurrency.test.ts). It simulates race conditions by dispatching simultaneous requests via `Promise.all()` to `POST /api/appointments/book` (Slot 101, Patients 5001 & 5002).

It asserts all concurrency invariants:
- Exactly 1 request succeeds with `201 Created`.
- Competing requests receive `409 Conflict`.
- Zero duplicate booking records are created in MSSQL.

```bash
# Run locally against http://localhost:3000:
npm run test:concurrency

# Or inside the running Docker container:
npm run docker:test:concurrency
```

### Documentation
- 🏗️ **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Monorepo layout, system architecture flow, and 3NF database schema overview.
- ⚡ **[docs/CONCURRENCY_STRATEGY.md](docs/CONCURRENCY_STRATEGY.md)**: Explanation of MSSQL transactions, pessimistic row locking (`UPDLOCK, ROWLOCK, HOLDLOCK`), and unique constraints.
- 📊 **[docs/TEST_EXECUTION_RESULTS.md](docs/TEST_EXECUTION_RESULTS.md)**: Live execution output and invariant verification proofs.
