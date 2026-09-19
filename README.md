# Resume Screener

React frontend with a Python (FastAPI) serverless backend, deployable to Vercel as one project.

## Structure

```
api/index.py      FastAPI app, served at /api/*
requirements.txt  Python dependencies
src/              React app (Vite)
vercel.json       Build output and /api rewrite
```

## Local development

Backend:

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

Frontend (separate terminal):

```
npm install
npm run dev
```

Vite proxies `/api` to port 8000. Copy `.env.example` to `.env` and set `GROQ_API_KEY`.

## Deploy

```
npm i -g vercel
vercel
```

In the Vercel dashboard, add environment variables `GROQ_API_KEY` and optionally `GROQ_MODEL`, then run `vercel --prod`.

## Notes

Scoring weights are skills 50, experience 30, education 20. Limits: 20 resumes per request, 10 MB per file, 10 requests per minute per instance. Serverless functions have an execution timeout, so large batches may need the Pro plan `maxDuration` setting or a queued backend.
