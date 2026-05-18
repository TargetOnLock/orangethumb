# Deploy Orange Thumb (Vercel + Supabase)

This guide sets up **free-tier production** with:

- **Vercel** — hosts the website and admin API
- **Supabase** — stores site content (database) and uploaded images/videos (storage)

---

## Part 1: Supabase setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → pick a name and password → create.

### 2. Create the database table

1. In Supabase: **SQL Editor** → **New query**.
2. Paste everything from `supabase/schema.sql` in this repo.
3. Click **Run**.

### 3. Create the storage bucket

1. **Storage** → **New bucket**.
2. Name: `media` (must match `SUPABASE_STORAGE_BUCKET` if you change it).
3. Turn **Public bucket** ON (so image URLs work on the public site).
4. Create bucket.

### 4. Get API keys

1. **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
     Never put this in the browser or commit it to Git.

---

## Part 2: Environment variables

Use these on **Vercel** (and locally in `.env` for testing).

| Variable | Required | Example |
|----------|----------|---------|
| `SESSION_SECRET` | Yes | Long random string (32+ characters) |
| `ADMIN_USER` | Yes | `owner` |
| `ADMIN_PASSWORD` | Yes* | Your admin password |
| `SUPABASE_URL` | Yes | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbG...` (service role) |
| `SUPABASE_STORAGE_BUCKET` | No | `media` (default) |
| `ADMIN_PASSWORD_HASH` | No | Use instead of `ADMIN_PASSWORD` |

\* Use either `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`, not both.

Generate bcrypt hash (optional):

```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
```

---

## Part 3: Deploy to Vercel

### 1. Push code to GitHub

Make sure `.env` is **not** committed (it is in `.gitignore`).

### 2. Import on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project**.
2. Import your GitHub repo.
3. Framework: **Other** (Node app uses `server.js` via `vercel.json`).
4. **Environment Variables** — add every variable from Part 2 for **Production** (and Preview if you want).
5. Deploy.

### 3. After deploy

- Storefront: `https://your-project.vercel.app`
- Admin: `https://your-project.vercel.app/admin`
- Health check: `https://your-project.vercel.app/api/health`  
  Should show `"storage": "supabase"`.

### 4. Redeploy when env changes

Any time you change env vars on Vercel: **Deployments** → **⋯** → **Redeploy**.

---

## Part 4: First-time content

On first request with Supabase configured:

- If `data/site-content.json` exists in the repo, it is copied into Supabase automatically.
- Otherwise default Orange Thumb content is created.

Upload new images in **Admin** → they go to Supabase Storage and URLs are saved in the database.

---

## Local development with Supabase

1. Copy `.env.example` to `.env`.
2. Fill in Supabase + admin variables.
3. Run:

```bash
npm install
npm start
```

Open `http://localhost:3000` and `http://localhost:3000/admin`.

Without Supabase env vars, the app falls back to local `data/site-content.json` and `uploads/`.

---

## SEO after you have a live URL

Update canonical/sitemap URLs in:

- `public/index.html` (`link rel="canonical"`)
- `public/robots.txt`
- `public/sitemap.xml`

Replace `http://localhost:3000` with `https://your-project.vercel.app`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Admin login fails | Check `ADMIN_USER` / `ADMIN_PASSWORD` on Vercel; redeploy |
| Upload fails | Bucket named `media`, public; `SUPABASE_SERVICE_ROLE_KEY` set |
| Site empty / 500 | Run `schema.sql`; check Vercel function logs |
| Old `/uploads/...` images broken | Re-upload in admin or migrate files to Supabase Storage |
| Session lost on Vercel | Set `SESSION_SECRET`; use HTTPS (Vercel does this automatically) |

---

## Security notes

- Never commit `.env` or the **service_role** key.
- Only the server uses `SUPABASE_SERVICE_ROLE_KEY`.
- Change default admin password before showing clients.
