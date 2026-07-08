/* Valore Deal Engine — shared calculation engine (single source of truth)
   Mirrors the formulas in Valore_Financial_Model.xlsx exactly.
   Works in the browser (attaches to window.ValoreCalc) and in Node (module.exports). */
(function (root) {
  "use strict";

  const n = (v, d = 0) => {
    const x = parseFloat(v);
    return isFinite(x) ? x : d;
  };

  // ---- R2SH: single-let corporate let ----
  function r2shSingle(i) {
    const providerRent = n(i.providerRent);
    const ownerRent = n(i.ownerRent);
    const bills = n(i.bills);
    const mgmt = n(i.mgmt);
    const setup = n(i.setup);
    const netMonth = providerRent - ownerRent - bills - mgmt;
    const netYear = netMonth * 12;
    const payback = netMonth > 0 ? setup / netMonth : 0;
    const roi = setup > 0 ? netYear / setup : 0;
    return { strategy: "R2SH single-let", netMonth, netYear, payback, roi, setup };
  }

  // ---- R2SH: HMO / TA (rooms) ----
  function r2shHmo(i) {
    const rooms = n(i.rooms);
    const perRoom = n(i.perRoom);
    const providerTotal = i.providerTotal != null && i.providerTotal !== ""
      ? n(i.providerTotal) : rooms * perRoom;
    const ownerRent = n(i.ownerRent);
    const bills = n(i.bills);
    const mgmt = n(i.mgmt);
    const setup = n(i.setup);
    const netMonth = providerTotal - ownerRent - bills - mgmt;
    const netYear = netMonth * 12;
    const payback = netMonth > 0 ? setup / netMonth : 0;
    const roi = setup > 0 ? netYear / setup : 0;
    return { strategy: "R2SH HMO/TA", providerTotal, rooms, netMonth, netYear, payback, roi, setup };
  }

  // ---- BRR: buy-refurbish-refinance ----
  function brr(i) {
    const purchase = n(i.purchase);
    const buyCostPct = n(i.buyCostPct, 0.05);
    const refurb = n(i.refurb);
    const bridgeLTV = n(i.bridgeLTV, 0.70);
    const bridgeRate = n(i.bridgeRate, 0.0085);     // monthly
    const bridgeFeePct = n(i.bridgeFeePct, 0.03);
    const bridgeTerm = n(i.bridgeTerm, 8);          // months
    const gdv = n(i.gdv);
    const refiLTV = n(i.refiLTV, 0.75);
    const btlRate = n(i.btlRate, 0.055);            // annual
    const rent = n(i.rent);
    const netMargin = n(i.netMargin, 0.30);

    const buyingCosts = purchase * buyCostPct;
    const bridgeLoan = purchase * bridgeLTV;
    const deposit = purchase - bridgeLoan;
    const bridgeInterest = bridgeLoan * bridgeRate * bridgeTerm;
    const bridgeFees = bridgeLoan * bridgeFeePct;
    const totalCashIn = buyingCosts + refurb + deposit + bridgeInterest + bridgeFees;

    const refinanceLoan = gdv * refiLTV;
    const cashReleased = refinanceLoan - bridgeLoan;
    const moneyLeftIn = totalCashIn - cashReleased;

    const btlMonthly = (refinanceLoan * btlRate) / 12;
    const netMonth = rent * netMargin;
    const netYear = netMonth * 12;
    const roi = moneyLeftIn > 0 ? netYear / moneyLeftIn : Infinity;

    const recycled = moneyLeftIn <= 2000 ? "YES — fully recycled"
      : moneyLeftIn <= 8000 ? "MOSTLY" : "NO — capital stuck";

    // stress tests
    const stressCashReleased = gdv * 0.9 * refiLTV - bridgeLoan;
    const stressBtlMonthly = (refinanceLoan * (btlRate + 0.02)) / 12;

    return {
      strategy: "BRR", purchase, gdv, buyingCosts, bridgeLoan, deposit,
      bridgeInterest, bridgeFees, totalCashIn, refinanceLoan, cashReleased,
      moneyLeftIn, btlMonthly, netMonth, netYear, roi, recycled,
      stressCashReleased, stressBtlMonthly
    };
  }

  // ---- Deal scoring against a criteria profile (Module 3) ----
  // profile: { minNetMonth, maxPrice, minBeds, areaKeywords:[] }
  function scoreDeal(deal, profile) {
    let score = 0, max = 0, reasons = [];
    const p = profile || {};
    // net cashflow vs threshold (40 pts)
    max += 40;
    if (p.minNetMonth) {
      const ratio = (deal.netMonth || 0) / p.minNetMonth;
      const pts = Math.max(0, Math.min(40, Math.round(ratio * 40)));
      score += pts;
      reasons.push(`Cashflow ${money(deal.netMonth)}/mo vs target ${money(p.minNetMonth)} → ${pts}/40`);
    } else { score += 20; }
    // price ceiling (20 pts) — only relevant to BRR/purchase deals
    max += 20;
    if (p.maxPrice && deal.purchase) {
      const pts = deal.purchase <= p.maxPrice ? 20 : Math.max(0, 20 - Math.round((deal.purchase - p.maxPrice) / p.maxPrice * 40));
      score += pts; reasons.push(`Price ${money(deal.purchase)} vs max ${money(p.maxPrice)} → ${pts}/20`);
    } else { score += 10; }
    // beds (15 pts)
    max += 15;
    if (p.minBeds && deal.beds) {
      const pts = (deal.beds >= p.minBeds) ? 15 : 5;
      score += pts; reasons.push(`${deal.beds} beds vs min ${p.minBeds} → ${pts}/15`);
    } else { score += 8; }
    // area match (15 pts)
    max += 15;
    if (p.areaKeywords && p.areaKeywords.length && deal.area) {
      const hit = p.areaKeywords.some(k => deal.area.toLowerCase().includes(k.toLowerCase().trim()) && k.trim());
      const pts = hit ? 15 : 3;
      score += pts; reasons.push(`Area "${deal.area}" ${hit ? "matches" : "no match"} → ${pts}/15`);
    } else { score += 8; }
    // recycled / payback bonus (10 pts)
    max += 10;
    if (deal.strategy === "BRR") {
      const pts = (deal.moneyLeftIn != null && deal.moneyLeftIn <= 8000) ? 10 : 3;
      score += pts; reasons.push(`BRR capital efficiency → ${pts}/10`);
    } else {
      const pts = (deal.payback && deal.payback <= 12) ? 10 : 5;
      score += pts; reasons.push(`Payback ${deal.payback ? deal.payback.toFixed(1) : "-"} mo → ${pts}/10`);
    }
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    const verdict = pct >= 75 ? "STRONG" : pct >= 55 ? "WORKABLE" : "WEAK";
    return { score, max, pct, verdict, reasons };
  }

  function money(v) {
    const x = Math.round(n(v));
    return (x < 0 ? "-£" : "£") + Math.abs(x).toLocaleString("en-GB");
  }

  const api = { r2shSingle, r2shHmo, brr, scoreDeal, money, _n: n };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ValoreCalc = api;
})(typeof window !== "undefined" ? window : globalThis);
