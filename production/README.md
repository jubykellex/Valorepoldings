# Valore Operating Portal — production codebase (seed)

This folder is the head-start for the **cloud / SaaS** version of the Valore platform.
The fully-working **offline app** is in `../app` (open `app/index.html`). This seed gives a
developer (or an AI coding agent) the parts that are tedious and error-prone to get right:
the **data model**, the **calculation engine**, and a **working open-data ingestion** script.

## What's here now
| Path | What it is | Status |
|---|---|---|
| `db/schema.sql` | Full multi-tenant Postgres schema with row-level security | Ready to apply |
| `lib/calc.ts` | Deal calculation engine (TS) — mirror of the tested `app/calc.js` and the spreadsheet | Ready |
| `scripts/ingest.mjs` | Open-data ingestion (postcodes.io + HM Land Registry; EPC behind a key) | **Runs today** |
| `package.json`, `.env.example` | Project + env scaffolding for Next.js + Supabase | Ready |

## Run the ingestion now (no keys needed)
```bash
cd production
node scripts/ingest.mjs "M1 4LF"
# → writes data/M14LF.json with area context + recent sold prices
```

## Stand up the cloud database (≈15 min, needs your Supabase account)
1. Create a free project at https://supabase.com → copy the URL + keys into `.env.local` (see `.env.example`).
2. In the Supabase SQL editor, paste and run `db/schema.sql`. This creates all tables, RLS policies and seeds the Valore tenant.
3. Get a free EPC key at https://epc.opendatacommunities.org and add `EPC_EMAIL` / `EPC_KEY` to enable EPC enrichment in the ingestion script.

## Build order (from the Tech Build Spec)
The full module spec, roadmap and feature detail live in `../Valore_Tech_Build_Spec.md`.
Recommended next steps for the cloud app:
1. `npx create-next-app@latest` in this folder (TypeScript + Tailwind), keep `lib/` and `scripts/`.
2. Add Supabase client + auth; wire `lib/calc.ts` into a `/analyser` route (UI already proven in `../app`).
3. Schedule `scripts/ingest.mjs` as a Supabase Edge Function / cron to populate `properties`.
4. Port the app's deal/scoring/pack features to server-backed pages; add the investor portal and compliance calendar.

## Why this split
The offline app proves the product and lets Valore operate **today**. This seed means the cloud
build is an *evolution* (same maths, same data model) rather than a rewrite — and because every
table has `org_id` + RLS, opening it to other operators as SaaS is a configuration step.

> Not financial/legal advice. Validate API terms, licensing and data-protection duties before going live.
