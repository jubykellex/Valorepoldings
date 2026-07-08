#!/usr/bin/env node
/* Valore — open-data ingestion (Module 2, runnable today, no API key required).
 * Pulls area context (postcodes.io) + recent sold prices (HM Land Registry open
 * linked data) for a postcode and writes a clean property/area record to data/.
 *
 * Usage:  node scripts/ingest.mjs "M1 4LF"
 * Requires Node 18+ (global fetch).  No keys needed for these two sources.
 * EPC / PropertyData enrichment hooks are included but gated behind env keys.
 */
import { writeFileSync, mkdirSync } from "node:fs";

const pcRaw = process.argv[2] || "M1 4LF";
const pc = pcRaw.toUpperCase().trim();
const pcNoSpace = pc.replace(/\s+/g, "");

async function getArea(p) {
  const r = await fetch("https://api.postcodes.io/postcodes/" + encodeURIComponent(p.replace(/\s+/g, "")));
  const j = await r.json();
  if (j.status !== 200) throw new Error("Postcode not found: " + p);
  const d = j.result;
  return {
    postcode: d.postcode, region: d.region, admin_district: d.admin_district,
    constituency: d.parliamentary_constituency_2024 || d.parliamentary_constituency,
    lsoa: d.lsoa, imd_rank: d.index_of_multiple_deprivation,
    lat: d.latitude, lng: d.longitude,
    demand_signal: d.index_of_multiple_deprivation
      ? (d.index_of_multiple_deprivation <= 10000 ? "high" : d.index_of_multiple_deprivation <= 20000 ? "moderate" : "lower")
      : "unknown",
  };
}

async function getSoldPrices(p) {
  // HM Land Registry Price Paid linked data (open, no key). Best-effort.
  try {
    const url = "https://landregistry.data.gov.uk/data/ppi/transaction-record.json"
      + "?propertyAddress.postcode=" + encodeURIComponent(p) + "&_pageSize=20";
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return [];
    const j = await r.json();
    const items = j?.result?.items || [];
    return items.map(it => ({
      price: it.pricePaid,
      date: it.transactionDate,
      paon: it.propertyAddress?.paon,
      street: it.propertyAddress?.street,
      town: it.propertyAddress?.town,
      type: it.propertyType?.prefLabel?.[0]?._value || it.propertyType?._value,
    })).filter(x => x.price);
  } catch { return []; }
}

async function getEpc(p) {
  // Optional: MHCLG EPC register. Requires EPC_EMAIL + EPC_KEY env vars.
  const email = process.env.EPC_EMAIL, key = process.env.EPC_KEY;
  if (!email || !key) return { enabled: false, note: "Set EPC_EMAIL and EPC_KEY to enable EPC enrichment." };
  try {
    const auth = Buffer.from(`${email}:${key}`).toString("base64");
    const r = await fetch("https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=" + encodeURIComponent(p) + "&size=20",
      { headers: { Authorization: "Basic " + auth, Accept: "application/json" } });
    if (!r.ok) return { enabled: true, error: "EPC API " + r.status };
    const j = await r.json();
    return { enabled: true, rows: (j.rows || []).map(x => ({ address: x.address, rating: x["current-energy-rating"], area: x["total-floor-area"] })) };
  } catch (e) { return { enabled: true, error: String(e) }; }
}

(async () => {
  console.log(`\nValore ingestion — ${pc}\n${"-".repeat(34)}`);
  const area = await getArea(pc);
  console.log("Area:", area.admin_district, "·", area.region, "· demand:", area.demand_signal, "· IMD rank:", area.imd_rank);
  const sold = await getSoldPrices(pc);
  console.log("Sold records found:", sold.length);
  if (sold.length) {
    const prices = sold.map(s => Number(s.price)).filter(Boolean);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    console.log("Avg recent sold price:", "£" + avg.toLocaleString("en-GB"));
  }
  const epc = await getEpc(pc);
  console.log("EPC:", epc.enabled ? (epc.rows ? epc.rows.length + " certs" : epc.error) : epc.note);

  const record = { postcode: pc, fetched_at: new Date().toISOString(), area, sold_prices: sold, epc };
  mkdirSync("data", { recursive: true });
  const f = `data/${pcNoSpace}.json`;
  writeFileSync(f, JSON.stringify(record, null, 2));
  console.log("Saved →", f, "\n");
})().catch(e => { console.error("Ingestion error:", e.message); process.exit(1); });
