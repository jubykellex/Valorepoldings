# Valore Property Holdings — Start Here

Everything built for you, and how to open it. Newest work is the **app**, **website** and **brand**.

## Open these first (they just work — double-click)
| Open this | What it is |
|---|---|
| `app/index.html` | **Valore Deal Engine** — your working in-house tool. Analyse R2SH & BRR deals, look up any UK postcode live, score & save deals, generate branded deal packs and letters of intent. Runs entirely on your machine; data saves in your browser. |
| `website/index.html` | **Your public website** — premium, on-brand, with landlord / investor / provider enquiry forms (they open a pre-filled email to oderinde12345@gmail.com). |
| `brand/Brand_Guidelines.html` | **Brand identity** — logo, colours, type, voice. Everything else spins off this. |

## The strategy documents
| File | What it is |
|---|---|
| `Valore_Business_Plan.docx` | The full business plan (strategy, market, targets, compliance, 90-day plan). |
| `Valore_Financial_Model.xlsx` | Working model — deal calculators + cashflow ramp to £10–15k/mo + portfolio build to £1m. Edit the blue cells. |
| `Valore_Tech_Build_Spec.md` | The technical blueprint for the full cloud platform. |

## Brand assets
- `brand/valore-wordmark.svg` — primary logo (use on light backgrounds)
- `brand/valore-monogram.svg` — crest mark (avatars, favicons, documents)

## The production codebase (for the cloud / SaaS version)
In `production/` — the head start for the online platform:
- `db/schema.sql` — full database, ready to paste into Supabase
- `lib/calc.ts` — the deal-maths engine (same numbers as the app & spreadsheet)
- `scripts/ingest.mjs` — **already pulls live UK open data** (try: `node scripts/ingest.mjs "M1 4LF"`)
- `README.md` — exact steps to stand up the cloud database

## What needs YOU (the only things I can't do safely on your behalf)
These are quick, one-time steps — I've built everything right up to them:
1. **Publish the website** — host `website/` (free options: Netlify, Vercel, Cloudflare Pages — drag-and-drop the folder).
2. **Create the Supabase account + keys** for the cloud app (free tier). Then `db/schema.sql` is one paste.
3. **Compliance registrations before trading** — HMRC AML, a redress scheme, ICO. (Flagged throughout the plan.)
4. **Send/connect email** — the website forms open your email ready to send; I don't send on your behalf.

Everything else — the analysis tool, the website, the brand, the model, the data ingestion — is done and working.
