# Caritas Hospital - Concurrent Appointment Booking API

Technical Assessment Submission for the **Node.js Backend Developer** position at **Caritas Hospital, Kottayam**.

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
👉 **[docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)**

---

## 🛠️ Technology Stack
- **Runtime**: Node.js v22 LTS
- **Language**: TypeScript (Strict mode)
- **Framework**: Express.js
- **Database**: Microsoft SQL Server (MSSQL 2022)
- **Driver**: `mssql` (official Tedious TDS driver)
- **Logging**: `pino` & `pino-http` (zero-blocking structured logs with unique `X-Request-Id` correlation)
- **API Documentation**: OpenAPI / Swagger UI (`/api-docs`)
- **Containers**: Docker & Docker Compose (Multi-stage dev & prod images)

---

## 🚀 Quickstart & Setup

### 1. Configure Environments
Create the environment files from the provided templates:
```bash
# Database environment
cp database/.env.example database/.env

# Backend API environment
cp apps/backend/.env.example apps/backend/.env
```

### 2. Run with Docker (Development Mode)
To start both the database and the backend with live hot-reload:
```bash
npm run docker:dev
```
Development uses polling to detect source edits on Docker Desktop for Windows. Changes under `apps/backend/src` restart the API automatically; dependency and Dockerfile changes require a rebuild.

To build and start the backend in the background with hot-reload:
```bash
npm run docker:backend
```
This also starts the required SQL Server service and waits for its health check. View backend logs with `npm run compose:dev -- logs -f backend`; stop the development stack with `npm run compose:dev -- down`.

- API Server: `http://localhost:3000`
- Swagger UI Docs: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

Run the npm Docker commands from the repository root; they load both service environment files for Compose interpolation. `PORT` in `apps/backend/.env` controls the API internal listener, while `MSSQL_TCP_PORT` in `database/.env` controls the SQL Server internal listener. External host ports are fixed in Compose: API `3000`, development SQL Server `1433`; production SQL Server is not published. For example, `PORT=4000` maps `3000:4000`, and `MSSQL_TCP_PORT=1444` maps `1433:1444`. Compose synchronizes the SQL health check and backend `DB_PORT` with the SQL internal listener. Run `npm run compose:dev -- up -d` or `npm run compose:prod -- up -d` after changes. Use the same wrappers for `config`, `logs`, and `down`.

### 3. Run with Docker (Production Deployment Mode)
To run the production-optimized compiled stack:
```bash
npm run docker:prod
```

### 4. Local Development (Without containerizing the API)
You can also run SQL Server in Docker while running the Node.js API directly on your host machine. Set backend `DB_SERVER=localhost` and `DB_PORT=1433` to connect through the fixed published database port; local Node listens on backend `PORT`:
```bash
# Start just SQL Server
npm run compose:dev -- up sqlserver -d

# Install dependencies and start local dev server
npm install
npm run dev:backend
```

---

## 🧪 Testing & Verification
Concurrency tests and execution results are planned for the booking implementation stage.
