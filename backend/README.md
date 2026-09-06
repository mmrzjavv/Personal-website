# Portfolio content API

This small FastAPI service powers `/admin` and stores portfolio projects in PostgreSQL. Uploaded images are stored in MinIO/S3-compatible object storage; the API returns signed image URLs to the portfolio.

## Local run

```bash
cd backend
uv venv .venv
uv pip install --python .venv/bin/python -r requirements.txt
cp .env.example .env
# fill in PostgreSQL, MinIO and ADMIN_TOKEN values
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The Next.js app proxies requests to `PORTFOLIO_API_URL`, defaulting to `http://127.0.0.1:8000`. Open `/admin` and enter the value from `ADMIN_TOKEN`.

On first startup the service creates the two `portfolio_*` tables if needed and imports the bundled projects from `data/projects.json` without overwriting existing rows.
