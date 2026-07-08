# Valore Property Holdings — Business Setup & Team Structure

A practical guide to four foundations: **email**, **registered office (privacy-safe)**, **a professional phone that routes to you**, and **the team/roles structure**. None of this is legal or tax advice — confirm anything with company-number/financial consequences with an accountant or solicitor.

---

## 1. Email scheme (on your valorepholdings.com domain)

You have Google Workspace + the domain but mailboxes aren't set up yet. Recommended addresses:

| Address | Type | Purpose |
|---|---|---|
| **jubril@valorepholdings.com** | User mailbox (licensed seat) | You — founder/primary |
| **halimat@valorepholdings.com** | User mailbox (licensed seat) | Your sister — operations |
| **enquiries@valorepholdings.com** | **Google Group** (no extra licence) | Public address on the website + contact form; delivers to both of you |
| **info@valorepholdings.com** | Alias → the enquiries group | Catch-all people expect; points to the same place |
| **admin@valorepholdings.com** (optional) | Alias → jubril@ | Companies House "registered email", invoices, official mail |

**Why a Group for enquiries@:** a Google Group costs nothing (no seat), and both you and Halimat receive every enquiry — nothing falls through a single inbox. The website form and footer already point at `enquiries@valorepholdings.com`.

### Setup steps (Google Admin console — admin.google.com)
1. **Verify the domain** (if not done): Admin console → *Account → Domains*; add the TXT record Google gives you at your domain registrar.
2. **Add MX records** at your registrar so mail routes to Google (Google shows the exact MX values). Allow up to a few hours to propagate.
3. **Create users**: *Directory → Users → Add* → `jubril` and `halimat` (each uses one licensed seat).
4. **Create the enquiries group**: *Directory → Groups → Create group* → `enquiries@valorepholdings.com`; add Jubril + Halimat as members; under *Access settings* allow **"External / anyone on the internet"** to post so outside enquiries arrive.
5. **Add info@ as an alias**: either a second group, or *Groups → enquiries → add alias* `info@`.
6. **Deliverability** (so mail doesn't land in spam): add **SPF**, **DKIM** (turn on in *Apps → Google Workspace → Gmail → Authenticate email*), and a basic **DMARC** record at your registrar.
7. **Companies House registered email**: set this to `admin@` or `jubril@` — it's required since March 2024 and is **not** published publicly.

---

## 2. Registered office — keeping your home/location private

**The problem:** a registered office and a director's "service address" are **published on the public Companies House register**. Using your home exposes where you live.

**The rules (since 4 March 2024):** the registered office must be an **"appropriate address"** — a real UK address where post can be received and delivery acknowledged. **PO boxes are no longer allowed.** Non-compliance risks fines up to £1,000 and, ultimately, strike-off.

**The solution — a Registered Office Address service** (a.k.a. virtual registered office). A formation agent or accountant provides a compliant business address; they receive and scan/forward your official mail. This satisfies the "appropriate address" rule and **keeps your home off the public register.**

- Typical cost: **~£40–£60 per year** (often bundled with a "director's service address" for a few pounds more — use that too, so your home isn't on *your* director record either).
- Providers to look at: 1st Formations, Companies Made Simple, Rapid Formations, or your accountant.
- Use the **same service address** for: company registered office, your director service address, and Halimat's if she becomes a director.

**Net effect:** your name appears as a director (unavoidable), but your **home address and town do not** — which is exactly the privacy you asked for.

---

## 3. Professional phone that routes to you

Get a **virtual business number (VoIP)** that forwards to your mobile — a separate, professional line without a second handset.

- **Number type:**
  - **0333** — national, non-premium; **free to call** from most UK mobile/landline bundles; looks national and established.
  - **Local 01/02** (e.g. an 0161 Manchester or 0121 Birmingham number) — looks local and credible in your target area.
  - Recommendation: an **0333** for nationwide credibility, *or* a **local number for your focus area** — both forward to your mobile.
- **Cost:** roughly **£6–£12 / month**, 30-day rolling, same-day setup.
- **Features that make it look like a real company:** call forwarding to your mobile, **voicemail-to-email**, a branded greeting, business-hours routing, and a separate caller ID so you know it's a Valore call.
- **Providers to look at:** bOnline, CircleLoop, Tamar Telecommunications, Virtual Landline, 8x8.

**Net effect:** clients call a professional Valore number; it rings your phone; out of hours it takes a branded voicemail that emails you.

---

## 4. Team & roles structure (you + Halimat)

A credible property business looks "bigger than two people" by defining clear **roles and responsibilities** — even when you both wear several hats. Below is a structure that reads as a real, governed company.

### The two principals

**Jubril Oderinde — Founder & Managing Director** *(statutory director)*
Owns strategy and the numbers.
- Acquisitions & deal sourcing (finding and underwriting deals)
- Finance, funding & investor relations
- Overall accountability, signatory, and the in-house tech/portal
- Final sign-off on every deal

**Halimat — Director of Operations & Compliance** *(see the choice below)*
Owns delivery and standards.
- Day-to-day operations and property/tenancy management
- **Compliance**: AML checks, HMO licensing, certificates (gas/EICR/EPC/fire), GDPR/ICO, the compliance calendar
- Provider and tenant liaison; onboarding new units
- Records, admin, and contract administration

> **Two-director credibility vs. simplicity — your choice:**
> - **Make Halimat a statutory Director** (e.g. *Director of Operations*): strongest credibility, shared accountability, signatory cover, "board" optics. **But** directors carry legal duties (Companies Act 2006) and it affects how she's paid (payroll and/or dividends if she's also a shareholder) — get accountant advice first.
> - **Or bring her in as "Head of Operations" / "Operations Manager"** (employee) now, and appoint her as a director later once roles bed in. Lower commitment, still credible on the website and to partners.
> Recommended for credibility now: **Director of Operations & Compliance**, with an accountant confirming the pay/shareholding setup.

### Functional "hats" (held by you two now; outsourced or hired later)

| Function | Owner now | Move to later |
|---|---|---|
| Acquisitions / deal sourcing | Jubril | + a sourcer/analyst |
| Compliance officer | Halimat | retain in-house |
| Property & tenancy management | Halimat | + a property manager |
| Finance / bookkeeping | **Outsource to an accountant** (Jubril oversees) | keep outsourced |
| Investor relations | Jubril | retain |
| Marketing / brand | Shared / outsource | freelancer/agency |
| Technology / portal | Jubril | + a developer |

### Titles that signal credibility (pick one each)
- **Jubril:** *Founder & Managing Director* (or *Founder & Director*)
- **Halimat:** *Director of Operations & Compliance* (or *Head of Operations*)

### Simple governance to look (and be) professional
- A one-page **"who signs what"**: deals and funding = Jubril; compliance sign-off and property go-live = Halimat; anything over £X or any new lease = both.
- A monthly 30-minute **"board" check-in** with brief minutes — cheap, and it *is* good governance.
- Put both roles on the **About page** with a line each — two named people with clear remits reads far more credibly than an anonymous "we".

---

## Quick action checklist
- [ ] Workspace: create `jubril@` and `halimat@` users; create `enquiries@` group (+`info@` alias); turn on SPF/DKIM/DMARC.
- [ ] Buy a **registered office + director service address** service (~£40–60/yr); update Companies House; put nothing of your home on the register.
- [ ] Get a **virtual 0333 or local number** (~£10/mo) forwarding to your mobile with voicemail-to-email.
- [ ] Decide Halimat's status (**Director** recommended) with your accountant; add both to the About page.
- [ ] Send me the registered office address + phone number once live and I'll drop them into the website footer and contact page.

*Sources: Companies House 2024 registered-office "appropriate address" rules; UK virtual-number provider pricing (2025–26). Setup steps reflect Google Workspace Admin console at time of writing — confirm current screens in your console.*
