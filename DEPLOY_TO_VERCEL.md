# Deploy the Valore website to Vercel

The site is a static multi-page site in **`website/`**. The project is already a Git repo with a `website/vercel.json` (clean URLs). Pick one route.

> Why you have to do the login step: publishing requires authenticating to Vercel (and GitHub for auto-deploy) and handling a deploy token — Claude can't enter credentials or complete OAuth, even with permission. Everything up to that point is done.

---

## Route A — Fastest live URL (Vercel CLI, ~2 min)
Good for "view it anytime". Re-run the command to push updates.

1. Open **Terminal** and run:
   ```
   cd "/Users/jubriloderinde/Claude/Projects/Valore Property Holdings/website"
   npx vercel@latest deploy --prod
   ```
2. First run asks you to **log in** — choose GitHub/Google/email, confirm in the browser, return to Terminal.
3. Accept the prompts (scope = your account; "Set up and deploy?" = Y; project name e.g. `valore`; keep defaults).
4. It prints a live URL like `https://valore-xxx.vercel.app`. Done.
5. **To update after changes:** re-run `npx vercel@latest deploy --prod`.

---

## Route B — Auto-deploy on every change (recommended for "see changes immediately")
Every push to GitHub redeploys automatically.

1. Create an empty repo at **https://github.com/new** (e.g. name `valore`, private).
2. Push this project (already a Git repo):
   ```
   cd "/Users/jubriloderinde/Claude/Projects/Valore Property Holdings"
   git branch -M main
   git remote add origin https://github.com/<your-username>/valore.git
   git push -u origin main
   ```
3. Go to **vercel.com → Add New → Project → Import** your `valore` repo.
4. **Important:** set **Root Directory = `website`** (the site lives in that subfolder). Framework Preset = **Other**. No build command (it's static). Click **Deploy**.
5. You get a live URL, and from now on **every `git push` auto-deploys**.

---

## Making MY changes appear immediately (no effort from you each time)
With Route B connected, changes go live the moment they're pushed. For Claude to push automatically after editing:
- **Authorise the GitHub connector** in your claude.ai **connector settings**. Once authorised, in a later session Claude can commit & push edits directly to the repo, and Vercel auto-deploys — so you see changes with zero manual steps.
- Until then, after Claude edits files you just run `git add -A && git commit -m "update" && git push`, and Vercel redeploys.

---

## Custom domain (optional, later)
In the Vercel project → **Settings → Domains**, add e.g. `www.valorepholdings.com` and point the DNS as Vercel instructs (your DNS is Google-managed, so add the record there). Gives you a branded URL instead of `*.vercel.app`.
