# ==========================================
# Stage 1: Base / Dependencies (Shared)
# ==========================================
FROM node:22-alpine AS base

WORKDIR /app

# Copy root monorepo files and package manifests
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install all dependencies (workspaces supported)
RUN npm ci

# ==========================================
# Stage 2: Development Stage (target: development)
# Used by docker-compose.yml for hot-reload dev
# ==========================================
FROM base AS development

WORKDIR /app

# Copy backend source code for initial container state
COPY apps/backend/src ./apps/backend/src

ENV NODE_ENV=development

# Runs via tsx watch for instant live-reload
CMD ["npm", "run", "dev", "--workspace=backend"]

# ==========================================
# Stage 3: Builder Stage
# Compiles TypeScript into JavaScript (dist)
# ==========================================
FROM base AS builder

WORKDIR /app

COPY apps/backend/src ./apps/backend/src

RUN npm run build --workspace=backend

# ==========================================
# Stage 4: Production Runtime (target: production / default)
# Used by docker-compose.prod.yml for deployment
# ==========================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Secure non-root user
USER node


CMD ["node", "apps/backend/dist/server.js"]
