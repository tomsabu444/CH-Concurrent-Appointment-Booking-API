# Project Architecture & Directory Structure

This document details the monorepo design, directory structure, environment decoupling, and containerization setup for the **Caritas Hospital - Concurrent Appointment Booking API**.

---

## 1. Directory Tree

```
CH-Concurrent-Appointment-Booking-API/
├── .vscode/                               # Editor configuration & settings
├── apps/
│   └── backend/                           # Node.js + Express + TypeScript service
│       ├── src/
│       │   ├── config/
│       │   │   ├── db.ts                  # Central MSSQL connection pool
│       │   │   ├── logger.ts              # Pino logger with pino-pretty
│       │   │   └── swagger.ts             # OpenAPI / Swagger UI config
│       │   ├── controllers/               # Request handling & HTTP status mappings
│       │   │   └── appointment.controller.ts
│       │   ├── middleware/                # Error handling & correlation loggers
│       │   │   ├── errorHandler.ts
│       │   │   └── httpLogger.ts          # Auto X-Request-Id correlation logger
│       │   ├── routes/                    # Express routing definitions
│       │   │   ├── appointment.routes.ts  # POST /api/appointments/book
│       │   │   └── health.routes.ts       # GET /health
│       │   ├── services/                  # Business logic & MSSQL transactions
│       │   │   └── appointment.service.ts # Concurrency locking & rollback logic
│       │   ├── app.ts                     # Express application definition
│       │   └── server.ts                  # HTTP server bootstrap & env loader
│       ├── tests/                         # Concurrency test suites
│       │   └── concurrency.test.ts        # Parallel booking verification script
│       ├── .env                           # Local API environment (gitignored)
│       ├── .env.example                   # API environment template
│       ├── Dockerfile                     # Multi-stage Dockerfile (dev & prod)
│       ├── package.json                   # Backend dependencies & scripts
│       └── tsconfig.json                  # Strict TypeScript compiler options
│
├── database/                              # Microsoft SQL Server assets
│   ├── data/                              # Persisted SQL Server data (gitignored)
│   ├── scripts/                           # Database migration & seed scripts
│   │   ├── 01_create_database_and_tables.sql # Production schema & constraints
│   │   └── 02_seed_sample_data.sql        # Sample doctors, patients, slot 101
│   ├── .env                               # Database environment (gitignored)
│   └── .env.example                       # Database environment template
│
├── docs/                                  # Technical assessment documentation
│   ├── PROJECT_STRUCTURE.md               # Repository architecture guide (this file)
│   ├── CONCURRENCY_STRATEGY.md            # Explanation of concurrency prevention
│   └── TEST_EXECUTION_RESULTS.md          # Benchmark & test execution evidence
│
├── .dockerignore                          # Excludes artifacts from Docker build
├── .gitignore                             # Ignores data, logs, node_modules, .env
├── docker-compose.yml                     # Development stack (hot-reload + MSSQL)
├── docker-compose.prod.yml                # Production deployment stack
├── package.json                           # Root monorepo workspace manifest
├── package-lock.json                      # Monorepo lockfile
└── README.md                              # Main overview & quickstart guide
```

---

## 2. Key Architectural Decisions

### A. Modular Monorepo Architecture
- Uses native **npm workspaces** (`apps/*`).
- Root level contains shared orchestration (`docker-compose.yml`, `package.json`).
- `apps/backend/` houses the isolated Express.js service.
- `database/` houses all database assets, SQL scripts, and container data mounts.

### B. Decoupled Environment Configuration
To prevent cross-pollution and hardcoded secrets:
- **`database/.env`**: SQL Server settings and internal listener (`MSSQL_TCP_PORT`). Development Compose publishes fixed host port `1433`; production leaves SQL Server unpublished. Health checks and backend container `DB_PORT` use this same internal port.
- **`apps/backend/.env`**: Application runtime settings. `PORT` controls the Node listener locally and inside Docker. Compose publishes fixed host port `3000` to this internal port. `DB_PORT` is for local execution; Compose derives the backend container database port from `MSSQL_TCP_PORT`.
- **Compose commands**: `npm run compose:dev -- <command>` and `npm run compose:prod -- <command>` explicitly load both service files for interpolation. No root environment file is required.

### C. Multi-Stage Dockerfile (`apps/backend/Dockerfile`)
Configured with targeted stages:
- **`base`**: Installs root & workspace dependencies cleanly using `npm ci`.
- **`development`**: Runs `npm run dev --workspace=backend` (`tsx watch`) and binds the source directory for hot-reloading.
- **`builder`**: Compiles TypeScript into JavaScript (`dist/`).
- **`production`**: Minimal runtime container using `node:22-alpine`, production-only dependencies (`npm ci --omit=dev`), and non-root execution (`USER node`).

### D. Dual Docker Compose Configurations
- **`docker-compose.yml` (Development)**:
  - Spawns MSSQL container with healthcheck + Backend targeting `development` stage with live code mounting.
- **`docker-compose.prod.yml` (Production Deployment)**:
  - Spawns MSSQL container + Backend targeting optimized `production` stage with automated restart policies.
