/* Valore calculation engine (TypeScript) — production mirror of app/calc.js.
   Keep this in sync with the spreadsheet model and the standalone app:
   ONE source of truth for deal maths. Used by API routes and the analyser UI. */

const num = (v: unknown, d = 0): number => {
  const x = parseFloat(String(v));
  return isFinite(x) ? x : d;
};

export interface R2shSingleInput { providerRent:number; ownerRent:number; bills:number; mgmt:number; setup:number; }
export interface R2shHmoInput { rooms:number; perRoom:number; providerTotal?:number; ownerRent:number; bills:number; mgmt:number; setup:number; }
export interface BrrInput {
  purchase:number; buyCostPct:number; refurb:number; bridgeLTV:number; bridgeRate:number;
  bridgeFeePct:number; bridgeTerm:number; gdv:number; refiLTV:number; btlRate:number; rent:number; netMargin:number;
}

export function r2shSingle(i: R2shSingleInput) {
  const netMonth = num(i.providerRent) - num(i.ownerRent) - num(i.bills) - num(i.mgmt);
  const netYear = netMonth * 12;
  const setup = num(i.setup);
  return { strategy:"R2SH single-let", netMonth, netYear,
    payback: netMonth > 0 ? setup/netMonth : 0, roi: setup > 0 ? netYear/setup : 0, setup };
}

export function r2shHmo(i: R2shHmoInput) {
  const providerTotal = i.providerTotal != null ? num(i.providerTotal) : num(i.rooms)*num(i.perRoom);
  const netMonth = providerTotal - num(i.ownerRent) - num(i.bills) - num(i.mgmt);
  const netYear = netMonth * 12;
  const setup = num(i.setup);
  return { strategy:"R2SH HMO/TA", providerTotal, netMonth, netYear,
    payback: netMonth > 0 ? setup/netMonth : 0, roi: setup > 0 ? netYear/setup : 0, setup };
}

export function brr(i: BrrInput) {
  const purchase = num(i.purchase);
  const buyingCosts = purchase * num(i.buyCostPct, 0.05);
  const bridgeLoan = purchase * num(i.bridgeLTV, 0.70);
  const deposit = purchase - bridgeLoan;
  const bridgeInterest = bridgeLoan * num(i.bridgeRate, 0.0085) * num(i.bridgeTerm, 8);
  const bridgeFees = bridgeLoan * num(i.bridgeFeePct, 0.03);
  const totalCashIn = buyingCosts + num(i.refurb) + deposit + bridgeInterest + bridgeFees;
  const refinanceLoan = num(i.gdv) * num(i.refiLTV, 0.75);
  const cashReleased = refinanceLoan - bridgeLoan;
  const moneyLeftIn = totalCashIn - cashReleased;
  const btlMonthly = (refinanceLoan * num(i.btlRate, 0.055)) / 12;
  const netMonth = num(i.rent) * num(i.netMargin, 0.30);
  const netYear = netMonth * 12;
  return {
    strategy:"BRR", purchase, gdv:num(i.gdv), buyingCosts, bridgeLoan, deposit,
    bridgeInterest, bridgeFees, totalCashIn, refinanceLoan, cashReleased, moneyLeftIn,
    btlMonthly, netMonth, netYear,
    roi: moneyLeftIn > 0 ? netYear/moneyLeftIn : Infinity,
    recycled: moneyLeftIn <= 2000 ? "fully" : moneyLeftIn <= 8000 ? "mostly" : "no",
  };
}

export interface Profile { minNetMonth?:number; maxPrice?:number; minBeds?:number; areaKeywords?:string[]; }
export function scoreDeal(deal: any, p: Profile = {}) {
  let score = 0, max = 0;
  max += 40; score += p.minNetMonth ? Math.max(0, Math.min(40, Math.round((deal.netMonth||0)/p.minNetMonth*40))) : 20;
  max += 20; score += (p.maxPrice && deal.purchase) ? (deal.purchase <= p.maxPrice ? 20 : 5) : 10;
  max += 15; score += (p.minBeds && deal.beds) ? (deal.beds >= p.minBeds ? 15 : 5) : 8;
  max += 15; score += (p.areaKeywords?.length && deal.area)
    ? (p.areaKeywords.some(k => k.trim() && deal.area.toLowerCase().includes(k.toLowerCase().trim())) ? 15 : 3) : 8;
  max += 10; score += deal.strategy === "BRR"
    ? ((deal.moneyLeftIn != null && deal.moneyLeftIn <= 8000) ? 10 : 3)
    : ((deal.payback && deal.payback <= 12) ? 10 : 5);
  const pct = Math.round(score/max*100);
  return { score, max, pct, verdict: pct >= 75 ? "STRONG" : pct >= 55 ? "WORKABLE" : "WEAK" };
}
