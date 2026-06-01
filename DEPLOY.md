# Deployment Guide — Google Cloud Run

Panduan deploy BeasiswaRadar ke Google Cloud Run (sesuai requirement JuaraVibeCoding).

## Prasyarat

1. **Akun Google Cloud** dengan billing aktif (Free Tier mencukupi untuk demo)
2. **gcloud CLI** terinstall ([install](https://cloud.google.com/sdk/docs/install))
3. **Docker Desktop** (opsional, untuk test build lokal)
4. Database Supabase + env vars sudah siap (lihat `.env.example`)

## Quick Start

### 1. Setup gcloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Buat Artifact Registry

```bash
gcloud artifacts repositories create beasiswa-radar \
  --repository-format=docker \
  --location=asia-southeast2 \
  --description="BeasiswaRadar container images"
```

### 3. Build & Push Image (via Cloud Build)

Cara termudah — Cloud Build akan baca `Dockerfile` dan push ke Artifact Registry:

```bash
gcloud builds submit \
  --tag asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest
```

Atau build lokal dulu lalu push (kalau punya Docker Desktop):

```bash
# Build
docker build -t asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest .

# Auth Docker ke Artifact Registry
gcloud auth configure-docker asia-southeast2-docker.pkg.dev

# Push
docker push asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest
```

### 4. Deploy ke Cloud Run

```bash
gcloud run deploy beasiswa-radar \
  --image=asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest \
  --region=asia-southeast2 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=120 \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co" \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx" \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=eyJxxx" \
  --set-env-vars="DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres" \
  --set-env-vars="GOOGLE_AI_API_KEY=AIzaxxx" \
  --set-env-vars="UPSTASH_REDIS_REST_URL=https://xxx.upstash.io" \
  --set-env-vars="UPSTASH_REDIS_REST_TOKEN=xxx" \
  --set-env-vars="NEXT_PUBLIC_APP_URL=https://beasiswa-radar-xxx.run.app"
```

Setelah deploy, gcloud akan return URL service. Update `NEXT_PUBLIC_APP_URL` dan **redeploy** dengan URL final.

### 5. Setup Supabase Auth Redirect

Di Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://beasiswa-radar-xxx.run.app`
- **Redirect URLs**: tambah `https://beasiswa-radar-xxx.run.app/api/auth/callback`

## Update / Redeploy

```bash
# Build new version
gcloud builds submit --tag asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest

# Deploy
gcloud run deploy beasiswa-radar \
  --image=asia-southeast2-docker.pkg.dev/YOUR_PROJECT_ID/beasiswa-radar/app:latest \
  --region=asia-southeast2
```

## Pakai Secret Manager (opsional, recommended untuk production)

Lebih aman daripada `--set-env-vars` literal:

```bash
# Simpan secret
echo -n "actual-secret-value" | gcloud secrets create google-ai-api-key --data-file=-

# Deploy dengan secret reference
gcloud run deploy beasiswa-radar \
  --image=... \
  --update-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest"
```

## Test Lokal Sebelum Deploy

```bash
# Build image
docker build -t beasiswa-radar:local .

# Run dengan env vars dari .env
docker run -p 3000:3000 --env-file .env beasiswa-radar:local

# Buka http://localhost:3000
```

## Troubleshooting

**Build gagal — Prisma engine missing:**
- Pastikan `prisma/schema.prisma` ada dan `npx prisma generate` jalan saat build
- Dockerfile sudah handle ini di stage builder

**Run gagal — DATABASE_URL not found:**
- Cek env vars: `gcloud run services describe beasiswa-radar --region=asia-southeast2`
- Update: `gcloud run services update beasiswa-radar --update-env-vars KEY=value`

**Cold start lambat:**
- Set `--min-instances=1` (akan ada cost continuous, sekitar $7/bulan untuk 256MB)

**Container exit dengan error 502:**
- Cek logs: `gcloud run services logs read beasiswa-radar --region=asia-southeast2`
- Pastikan `HOSTNAME=0.0.0.0` (sudah di-set di Dockerfile)
- Pastikan `PORT` env var dibaca (Cloud Run set otomatis ke 8080)

## Region Recommendation

Untuk pengguna Indonesia, gunakan:
- `asia-southeast2` (Jakarta) — latensi paling rendah
- `asia-southeast1` (Singapore) — alternatif

## Estimasi Cost (Free Tier)

Cloud Run free tier termasuk:
- 2 juta requests/bulan
- 360,000 vCPU-seconds/bulan
- 180,000 GiB-seconds memory

Untuk demo MVP dengan traffic ringan, **biaya ≈ $0/bulan** selama tidak melebihi free tier.

---

## Auto-Scraping dengan Cloud Scheduler

Scraping otomatis berkala (per PRD section 4.5) — Cloud Scheduler memanggil endpoint `/api/cron/scrape` tiap hari/minggu.

### 1. Set CRON_SECRET di Cloud Run

Generate random secret (32+ karakter), lalu update env vars Cloud Run:

```bash
# Generate secret di terminal
$secret = -join ((48..57) + (97..122) | Get-Random -Count 32 | % { [char]$_ })
Write-Output $secret

# Update Cloud Run dengan secret + auto-approve flag
gcloud run services update beasiswa-radar `
  --region=asia-southeast2 `
  --update-env-vars="CRON_SECRET=$secret,AUTO_APPROVE_HIGH_CONFIDENCE=true"
```

> **Auto-approve note:** Set `true` artinya beasiswa dengan `confidence:high` dari Gemini langsung publish tanpa admin review. Set `false` kalau ingin admin manual approve semua hasil.

### 2. Enable Cloud Scheduler API

```bash
gcloud services enable cloudscheduler.googleapis.com
```

### 3. Buat scheduled job — daily scraping

```bash
gcloud scheduler jobs create http beasiswa-radar-scrape-daily `
  --location=asia-southeast2 `
  --schedule="0 3 * * *" `
  --uri="https://beasiswa-radar-966798432161.asia-southeast2.run.app/api/cron/scrape?schedule=DAILY" `
  --http-method=GET `
  --headers="Authorization=Bearer $secret" `
  --time-zone="Asia/Jakarta" `
  --description="Daily scraping untuk source dengan schedule=DAILY"
```

### 4. Buat scheduled job — weekly scraping

```bash
gcloud scheduler jobs create http beasiswa-radar-scrape-weekly `
  --location=asia-southeast2 `
  --schedule="0 4 * * 1" `
  --uri="https://beasiswa-radar-966798432161.asia-southeast2.run.app/api/cron/scrape?schedule=WEEKLY" `
  --http-method=GET `
  --headers="Authorization=Bearer $secret" `
  --time-zone="Asia/Jakarta" `
  --description="Weekly scraping (Senin 04:00 WIB)"
```

### 5. Test scheduled job manual

Trigger sekali untuk verifikasi:

```bash
gcloud scheduler jobs run beasiswa-radar-scrape-daily --location=asia-southeast2
```

Lihat log Cloud Run setelahnya:

```bash
gcloud run services logs read beasiswa-radar --region=asia-southeast2 --limit=50
```

### 6. List & manage jobs

```bash
# List semua scheduled jobs
gcloud scheduler jobs list --location=asia-southeast2

# Pause job sementara
gcloud scheduler jobs pause beasiswa-radar-scrape-daily --location=asia-southeast2

# Resume
gcloud scheduler jobs resume beasiswa-radar-scrape-daily --location=asia-southeast2

# Delete
gcloud scheduler jobs delete beasiswa-radar-scrape-daily --location=asia-southeast2
```

### Cron schedule cheat sheet

| Cron | Artinya |
|------|---------|
| `0 3 * * *` | Setiap hari jam 03:00 |
| `0 4 * * 1` | Setiap Senin jam 04:00 |
| `0 0 1 * *` | Tanggal 1 setiap bulan jam 00:00 |
| `*/30 * * * *` | Setiap 30 menit |

### Cost Cloud Scheduler

Free tier: 3 jobs gratis selamanya. Setelahnya $0.10 per job/bulan. Untuk MVP demo cukup pakai 1-2 jobs (free).

---

## Trigger manual via Admin Panel

Selain cron, admin bisa trigger scraping kapan saja via UI di `/admin/scraping-review`:

- **🚀 Run all sources** — scrape semua sumber aktif sekaligus (1 klik)
- **Run** per-source — scrape satu sumber tertentu
- **Run URL** ad-hoc — paste URL apapun untuk scrape sekali

Plus checkbox **"Auto-approve confidence:high"** — kalau aktif, hasil dengan confidence tinggi dari Gemini langsung publish ke `/beasiswa`.
