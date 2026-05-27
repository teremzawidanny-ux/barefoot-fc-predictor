# Deployment Guide — Barefoot FC World Cup Predictor

## Architecture

- **Frontend:** Vercel (static React build)
- **Backend:** Railway (Bun/Hono API server)
- **Database:** Supabase PostgreSQL (already running, no changes needed)

The frontend and backend run on separate domains.
The frontend uses `VITE_BACKEND_URL` to reach the backend via absolute URLs.

---

## 1. Backend — Railway

### Setup

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) > New Project > Deploy from GitHub repo
3. Set **Root Directory:** `backend`
4. Set **Build Command:** `bun install`
5. Set **Start Command:** `bun run start`

### Environment Variables (set in Railway dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `3000` | Railway may override via `$PORT` |
| `SUPABASE_URL` | `https://kkxqhgotpgicqtrrfgzr.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your key)* | From Supabase Settings > API > service_role |
| `JWT_SECRET` | *(generate one)* | Must be >= 32 chars. Generate: `openssl rand -base64 48` |
| `ADMIN_EMAILS` | `teremzawi.danny@gmail.com` | Comma-separated admin emails |

### Verify

```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/health
# Expected: {"status":"ok"}

# Matches API
curl https://YOUR-RAILWAY-URL.up.railway.app/api/matches
# Expected: {"data":[...104 matches...]}
```

---

## 2. Frontend — Vercel

### Setup

1. Go to [vercel.com](https://vercel.com) > New Project > Import GitHub repo
2. Set **Root Directory:** `webapp`
3. Set **Build Command:** `bun run build`
4. Set **Output Directory:** `dist`
5. Set **Framework Preset:** Vite

### Environment Variables (set in Vercel dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_BACKEND_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` | Full Railway backend URL |

### Verify

1. Open the Vercel URL in a browser
2. Home page loads with World Cup branding
3. Click "Join" — registration form works
4. Click "Login" — login form works
5. Click "Predictions" — 104 matches appear with group labels
6. Open a Group Stage match — "Draw" option visible, no method selector
7. Open a Knockout match — winner required, method selector visible
8. Check "Leaderboard" — scores display correctly
9. Log in as admin email — `/admin` route shows match management

---

## 3. CORS

The backend CORS allowlist in `backend/src/index.ts` already includes:

- `http://localhost:*` (local dev)
- `*.vibecode.run`, `*.vibecodeapp.com`, `*.vibecode.dev` (preview)
- `barefootfcworldcup.com` and `www.barefootfcworldcup.com` (production)
- `barefoot-fc-world-cup.vercel.app` (Vercel default domain)

If your Vercel project gets a different `*.vercel.app` subdomain, update the regex
in `backend/src/index.ts` to match.

---

## 4. Custom Domain (later)

### Frontend (Vercel)

1. Vercel dashboard > Project Settings > Domains
2. Add `barefootfcworldcup.com`
3. Add DNS records Vercel provides (CNAME or A record) at your registrar

### Backend (Railway)

1. Railway dashboard > Service Settings > Custom Domain
2. Add `api.barefootfcworldcup.com` (optional — Railway URL works fine)
3. Add CNAME record at your registrar
4. Update `VITE_BACKEND_URL` in Vercel to the new domain

### After adding custom domain

- Update CORS allowlist if the domain pattern changed
- Update `VITE_BACKEND_URL` in Vercel env vars to match

---

## 5. Database

Supabase is already set up with Phase 3 schema and 104 real matches.
No database changes are needed for deployment.

If starting fresh with a new Supabase project:
1. Run `supabase/phase3-migration.sql` in SQL Editor
2. Run `supabase/official_schedule_seed.sql` in SQL Editor
3. Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Railway env vars

---

## 6. Security Checklist

- [ ] `JWT_SECRET` is cryptographically random (>= 32 chars), not the dev placeholder
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in Railway env vars, never in frontend code
- [ ] CORS allowlist matches actual frontend domain(s)
- [ ] HTTPS enforced (Railway and Vercel handle this automatically)
- [ ] `.env` files are in `.gitignore` (verified)
