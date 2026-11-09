# WORKNEX AI — Cloud & Container Deployment Guide

This guide describes how to run and deploy WORKNEX AI locally or in production.

## 1. Local Containerized Run (Docker Compose)

### Step 1: Prepare Environment

```bash
cp .env.example .env
# Set secure values for MCP_API_KEY, ADMIN_API_KEY, and SECRET_KEY
```

### Step 2: Build & Start Containers

```bash
docker compose up --build
```

This starts:

1. **PostgreSQL** (`localhost:15432`) pre-seeded with sample enterprise data.
2. **Backend API & MCP Server** (`localhost:8000`) with Swagger docs at `http://localhost:8000/docs`.
3. **React Enterprise Frontend** (`localhost:5173`) serving the responsive dark UI.

## 2. Cloud Deployment (Render / Railway / Vercel)

### Option A: Managed Full-Stack Container (Render / Railway)

- **Database**: Spin up a managed PostgreSQL database.
- **Backend**: Deploy a container service pointing to `Dockerfile`.
  - Environment variables:
    - `DATABASE_URL`: Set to your managed Postgres connection string.
    - `SECRET_KEY`: Random 64-char hex string.
    - `MCP_API_KEY`: Secret API key for MCP transport.
    - `ADMIN_API_KEY`: Secret API key for admin routes.
    - `MCP_HOST`: `0.0.0.0`
- **Frontend**: Deploy `frontend/` as a static site (e.g. on Vercel) or container on Render.
  - Set `VITE_API_URL` to your production backend URL (e.g., `https://backend.example.com/api/v1`).

## 3. Production Verification Checklist

- [x] Run test suite: `uv run pytest` (all 36 tests pass).
- [x] Build frontend: `cd frontend && npm run build` (zero type errors).
- [x] Passwords hashed with Argon2id.
- [x] Approval tokens hashed and compared with constant-time equality checks.
- [x] Sensitive arguments redacted in audit log.
- [x] CORS restricted to authorized domains in production settings.
