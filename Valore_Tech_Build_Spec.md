# Valore Property Holdings — Technical Build Specification
### Phase 2 of 3 · In-house deal platform + public website · v1 (June 2026)

> Companion to the Business Plan (Phase 1). This spec is written so it can be handed
> directly to a developer or an AI coding agent (Cursor / Claude Code) and built module
> by module. It favours **open data and open source** to keep running costs low and to
> keep a clean path to a **SaaS product** in ~24 months.

---

## 0. Design principles

1. **Build once, sell twice.** Everything is built multi-tenant-ready so the internal tool can become SaaS without a rebuild. A `org_id` (tenant) column sits on every business table from day one.
2. **Open data first.** Use free government/open data for the core; pay for commercial APIs only where they clearly save time or unlock data you can't get compliantly.
3. **Compliant by design.** Never scrape Rightmove/Zoopla (their terms prohibit it). Use licensed feeds. Store personal data lawfully (UK GDPR / ICO).
4. **Thin slices.** Ship a working deal analyser first; add modules around it. Avoid a 6-month "big bang" build with nothing usable.
5. **Boring, proven stack.** Optimise for speed of build and hireability, not novelty.

---

## 1. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | One codebase for site + app; SSR for SEO on the public site |
| UI | **Tailwind CSS + shadcn/ui** | Fast, consistent, on-brand (navy/gold theme tokens) |
| Backend / DB | **Supabase (Postgres + Auth + Storage + Edge Functions)** | Open source, self-hostable later, row-level security = clean multi-tenancy |
| ORM | **Drizzle** (or Prisma) | Typed schema + migrations |
| Auth | Supabase Auth (email + magic link; roles via RLS) | Built in; investor/provider/admin roles |
| Background jobs | Supabase Edge Functions + scheduled cron (or Inngest) | Nightly data syncs, deal scoring, alerts |
| Payments (SaaS later) | **Stripe** | Subscriptions/billing when productised |
| PDF generation | `react-pdf` / Puppeteer | Deal packs, LOIs, investor reports |
| Email | Resend or Postmark | Lead notifications, investor updates |
| Hosting | Vercel (app) + Supabase Cloud → migrate to self-host (Docker) for SaaS | Cheap to start, portable later |
| Maps | Leaflet + OS/OSM tiles | Plot deals, demand heat |

**Monthly cost at MVP:** roughly £0–£50 (free tiers of Vercel + Supabase + open data). Commercial data APIs add £20–£150/mo when needed.

---

## 2. Data sources & APIs

### 2.1 Free / open (the backbone)
| Source | Data | Access |
|---|---|---|
| **HM Land Registry – Price Paid** | Sold prices since 1995 | Free bulk download + "Use land and property data" API |
| **HM Land Registry – UK House Price Index** | Area price trends | Free download |
| **MHCLG EPC Register** | EPC rating, floor area, property attributes | Free API (`epc.opendatacommunities.org`, register for key) |
| **VOA / LHA-Direct** | LHA rates by BRMA, council tax bands | LHA rates published as CSV; council tax via VOA |
| **Environment Agency** | Flood risk | Free API |
| **OS Open UPRN / OS Open data** | Unique property reference, addressing | Free (OS Data Hub) |
| **planning.data.gov.uk** | Article 4 directions, conservation areas, planning constraints | Free API |
| **Regulator of Social Housing** | Registered providers list (provider targeting) | Free published register |
| **ONS / council homelessness stats** | TA demand by area | Free download |

### 2.2 Commercial (fill the gaps)
| Source | Use | Note |
|---|---|---|
| **PropertyData API** | Comps, rents, yields, demand, HMO data | Paid tiers; strong UK coverage |
| **Homedata API** | 29M properties, UPRN + EPC + price history | Free tier (100 calls/mo), good for prototyping |
| **Rightmove / Zoopla** | Listings | **Only via official partner feeds / licensed agreements.** No scraping — terms prohibit it. Treat live listings as a later, licensed integration. |

### 2.3 Integration pattern
- Nightly **ingestion jobs** pull open data into Postgres staging tables, keyed by UPRN/postcode.
- A **property record** is assembled by joining sold price + EPC + council tax + flood + planning constraints.
- Commercial APIs are called **on demand** (when a user opens a deal) and cached, to control cost.

---

## 3. Data model (core tables)

All business tables carry `org_id` (tenant), `created_at`, `updated_at`.

```
organisations      (id, name, plan, ...)                      -- tenant; "Valore" is org #1
users              (id, org_id, email, role)                   -- role: admin | analyst | investor | provider
properties         (id, uprn, address, postcode, lat, lng, beds, type, epc, council_tax_band,
                    flood_risk, article4_flag, last_sold_price, last_sold_date, source)
deals              (id, org_id, property_id, strategy[r2sh|brr|source], status, owner_user_id,
                    purchase_price, gdv, refurb_cost, target_rent, provider_rent, created_at)
deal_analysis      (id, deal_id, model_version, inputs_json, outputs_json, score)   -- snapshot of a calc
leads              (id, org_id, type[landlord|investor|provider], name, contact, message, source, status)
providers          (id, org_id, name, type[HA|council|TA|support], contacts_json, areas[], needs_notes)
units              (id, org_id, property_id, provider_id, lease_start, lease_end, rent_in, rent_out,
                    status[pipeline|live|ended])
tenancies          (id, unit_id, occupant_ref, start, end, status)
compliance_items   (id, unit_id, type[gas|EICR|EPC|HMO_licence|fire], expires_on, doc_url, status)
investors          (id, org_id, user_id, name, kyc_status)
investments        (id, investor_id, deal_id, amount, terms_json, status)
documents          (id, org_id, deal_id|unit_id, kind[pack|LOI|report|cert], url)
payments           (id, org_id, unit_id, direction[in|out], amount, due_on, paid_on)
audit_log          (id, org_id, user_id, action, entity, meta_json, ts)
```

Use **Postgres Row-Level Security**: every query auto-filters by `org_id = auth.org`. This is what makes the eventual SaaS safe with one database.

---

## 4. Modules (functional spec + build order)

Build in this order. Each is independently useful.

### MODULE 1 — Deal Analyser  *(build first; the heart of the system)*
Inputs and instant outputs for both strategies.

**R2SH calculator**
- Inputs: rent to owner, expected provider rent (or rooms × per-room rate), bills/utilities, void allowance, management %, refurb/setup, lease length.
- Outputs: monthly net profit, annual net, cash-on-cash, payback months, RAG score vs target (£/unit threshold).

**BRR calculator**
- Inputs: purchase price, refurb cost, GDV, bridging rate & term, BTL refinance LTV & rate, buying/legal/SDLT, expected rent.
- Outputs: money left in after refinance, ROI, monthly cashflow post-refinance, "deposit fully recycled?" flag, stress test (rate +2%, GDV −10%).

**Acceptance criteria:** enter a deal, get a scored verdict in <1s; save the analysis snapshot to `deal_analysis`.

### MODULE 2 — Property data ingestion & enrichment
- Nightly jobs load Land Registry, EPC, council tax, flood, planning (Article 4) into `properties`.
- On opening a deal, enrich with PropertyData/Homedata comps & rents (cached).
- **Output:** a clean property record + auto-filled defaults into the analyser.

### MODULE 3 — Deal Sourcing & Matching engine
- Define **Valore criteria profiles** (e.g. "BRR Manchester: 2–3 bed, ≤£140k, ≥25% BMV, not Article 4"; "R2SH HMO: 4–6 beds, strong TA demand postcode").
- Nightly scan of ingested + licensed listing data → score each candidate against profiles → surface a ranked **opportunity feed** with alerts (email/in-app).
- **Output:** "deals that match my criteria landing in my portal," exactly as in the business plan.

### MODULE 4 — Pack & LOI Generator
- One click on a deal → branded PDF: summary, numbers, photos, comps, strategy, returns.
- LOI template auto-filled from deal fields (owner/agent, address, headline terms, conditions).
- **Output:** investor-ready pack + LOI in Valore branding; stored in `documents`.

### MODULE 5 — Provider CRM
- `providers` with type, areas, current needs, contacts, interaction log.
- Match **secured units** to **provider needs**; track conversations from intro → LOI → live.
- **Output:** a managed provider pipeline (the relationship engine from the plan).

### MODULE 6 — Investor Portal
- Investor login (role-scoped). Sees: available deals, their investments, documents, returns, updates.
- KYC status flag (manual at first), investment records, auto investor-update emails/reports.
- **Output:** credible, self-serve experience that supports JV/raise for BRR.

### MODULE 7 — Property & Compliance Management
- Units, tenancies, rent-in/rent-out, payment tracking, and a **compliance calendar** (gas, EICR, EPC, HMO licence, fire) with expiry alerts.
- **Output:** run the live portfolio to standard; never miss a certificate.

### MODULE 8 — Public website (parallel track)
- Marketing site (SSR for SEO): brand story, how-it-works for landlords / investors / providers, case studies.
- Three capture funnels → `leads` → notify admin: **List your property**, **Invest with us**, **Provider enquiry**.
- **Output:** brand presence + inbound lead flow.

### MODULE 9 — Dashboard & reporting
- KPIs: live units, monthly net cashflow vs the £10–15k target, portfolio GAV vs £1m target, pipeline value, compliance status.
- **Output:** steer the business against the plan's two targets.

---

## 5. Roles & access
| Role | Sees |
|---|---|
| Admin (you) | Everything |
| Analyst | Deals, properties, sourcing, packs |
| Investor | Their deals/investments, documents, updates only |
| Provider (optional) | Shared units / availability only |

Enforced by Supabase RLS, not just UI hiding.

---

## 6. Build roadmap (suggested)

| Sprint (2 wks) | Deliverable |
|---|---|
| 1 | Repo, auth, schema, theme; **Deal Analyser (R2SH + BRR)** working manually |
| 2 | Property ingestion (Land Registry + EPC + council tax + flood + Article 4); enrich analyser |
| 3 | Deals CRUD + saved analyses + **Pack/LOI generator** |
| 4 | **Sourcing & matching** (criteria profiles + ranked feed + alerts) |
| 5 | **Provider CRM** + units/pipeline |
| 6 | **Public website** + lead funnels |
| 7 | **Investor portal** (read-only deals + documents + updates) |
| 8 | **Property & compliance management** + dashboard |
| 9+ | Harden, multi-tenant polish, billing (Stripe) → **SaaS beta** |

A focused solo developer or capable AI-pair can reach a usable internal tool (Modules 1–4) in ~6–8 weeks.

---

## 7. SaaS path (the 24-month asset)
1. **Internal use** — prove it on Valore's own deals (above).
2. **Hardening** — full multi-tenancy QA, audit logging, backups, usage limits, docs.
3. **Billing** — Stripe subscriptions; tiered plans (Starter = analyser + packs; Pro = sourcing + CRM; Portfolio = full).
4. **Beta** — invite a handful of trusted operators; gather feedback; price-test.
5. **Launch** — public sign-up, onboarding, marketing via the same brand.

Because `org_id` + RLS exist from day one, opening to external tenants is a configuration step, not a rewrite.

---

## 8. Security, compliance & data
- **UK GDPR / ICO:** register; lawful basis for lead and investor data; retention policy; DSAR process.
- **Secrets** in env vars / Supabase vault; never in the repo.
- **Backups:** automated daily Postgres backups; test restores.
- **Audit log** on every write to support investor trust and future SOC-style asks.
- **Listings data:** licensed feeds only — document the source/licence for each integration.

---

## 9. What to do this week (kickoff)
1. Register a Companies House org record in the tool as tenant #1 ("Valore").
2. Spin up Supabase + Next.js from a SaaS starter; apply the navy/gold theme.
3. Build Module 1 (Deal Analyser) using the **same formulas as the Phase 3 financial model** so the spreadsheet and the app never disagree.
4. Get the EPC API key and a Homedata free key; load one area's Land Registry data as a test.
5. Hand this spec + the financial model to your builder as the single source of truth.

---

*This is an initial technical blueprint for review. Validate API terms, licensing and data-protection obligations with the providers and an adviser before going live.*
