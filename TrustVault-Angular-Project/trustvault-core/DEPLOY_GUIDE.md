# ☁️ Put TrustVault on the internet (free, 24/7)

Your website is a **static site**: after `npm run build` it is just files (HTML, JS, CSS). Static sites are served from a
worldwide network (a **CDN**) that **never sleeps**, so it is online **24 hours a day, 365 days a year**, with HTTPS, for free. 🌍

## 🏆 Best free hosts (pick one)

| Host | Always on? | Free plan | Best for | Difficulty |
|---|---|---|---|---|
| **Netlify** ⭐ (recommended, settings already included) | ✅ yes, no sleeping | 100 GB/month, HTTPS, auto-deploy from GitHub | Angular / React sites | ⭐ easiest |
| **Cloudflare Pages** | ✅ yes | Unlimited bandwidth | Maximum speed | ⭐⭐ |
| **Vercel** | ✅ yes | 100 GB/month | Frontends | ⭐⭐ |
| **Firebase Hosting** | ✅ yes | 10 GB storage, 360 MB/day | Google users | ⭐⭐⭐ |
| **GitHub Pages** | ✅ yes | 100 GB/month | Simple static sites (needs extra settings for Angular routing) | ⭐⭐⭐ |
| Render (static site) | ✅ yes for *static sites* | 100 GB/month | Static or APIs | ⭐⭐ |
| ⚠️ Render / Railway *web services* | ❌ **sleep** when idle on free plans | | APIs only: avoid for a demo | |

> 💡 TrustVault needs **no server**, because the demo API is built into the website. That is why a static host keeps it running 24/7.

---

## 🥇 Netlify: step by step

### A. One-time prep
1. Your code is on GitHub (see `GITHUB_GUIDE.md`) ✅
2. Create a free account at https://app.netlify.com/signup → choose **Sign up with GitHub**.

### B. Deploy
1. Click **Add new site → Import an existing project**.
2. Choose **GitHub** → authorize → pick the **`trustvault-core`** repository.
3. Netlify reads `netlify.toml` and fills everything in for you. Check that it says:

   | Setting | Value |
   |---|---|
   | Build command | `npm run build` |
   | Publish directory | `dist/client/browser` |
   | Node version | `20` (set in `netlify.toml`) |

4. Click **Deploy trustvault-core**. Wait about 2 to 4 minutes (watch the *Deploy log*).
5. When it says **Published** ✅ click the link (like `https://shiny-name-123.netlify.app`). 🎉

### C. Give it a nice name
**Site configuration → Change site name** → e.g. `trustvault-core` → your address becomes `https://trustvault-core.netlify.app`.
Put this link in your README and in your internship email.

### D. Updates are automatic
Every time you `git push`, Netlify rebuilds and publishes by itself. 🔄

---

## 🛟 Safest method: deploy WITHOUT building on Netlify

If you ever see a build error on Netlify, build on your own computer and just upload the result:

```bash
npm install
npm run build
```

1. Open https://app.netlify.com/drop
2. Drag the folder **`dist/client/browser`** into the page.
3. Done: instant live site (no build step, so no build errors possible).

## 🧯 Ultimate backup: ONE file

`single-file/TrustVault-single-file.html` is the **entire demo in one file**.
Drag it into https://app.netlify.com/drop and rename it `index.html` first. It works the same (it loads Tailwind and Three.js from a CDN).

---

## 🩺 If the Netlify build fails

Open the failed deploy → **Deploy log**, find the first red line, and match it here:

For a local Netlify CLI deployment, select a compatible Node.js runtime **before starting the CLI**. Run `nvm install` and `nvm use` from the application directory to select the version in `.nvmrc`, then confirm `netlify --version` reports Node.js 22.22.0 or a newer 22.x version. `NODE_VERSION` in `netlify.toml` selects the hosted build runtime; it does not replace the interpreter of an already-running local CLI process. An automated runner must likewise launch the CLI with a compatible Node.js executable.

| Error in the log | Meaning | Fix |
|---|---|---|
| `Node.js version ... is not supported` / Angular runtime plugin requires a newer Node | Wrong Node | Keep `NODE_VERSION = "22.22.0"` in `netlify.toml` and the same version in `.nvmrc`. Clear cache and redeploy |
| `npm ERR! ... ERESOLVE` | Dependency clash | Add an environment variable `NPM_FLAGS` = `--legacy-peer-deps` (Site configuration → Environment variables) |
| `Cannot find module 'three'` / `jspdf` | Install didn't run | **Deploys → Trigger deploy → Clear cache and deploy site** |
| `ng: not found` | Dependencies missing | Check `package.json` is at the **root** of the repo (not inside another folder) |
| `Output directory "dist/client/browser" not found` | Wrong publish path | The project name in `angular.json` must stay `client` |
| A TypeScript / template error in `src/...` | A code error | Run `npm run build` on your computer, fix the first error, push again |
| Page shows **404 on refresh** | Missing SPA redirect | Keep `netlify.toml` and `public/_redirects` (they are included) |

## 🔒 Good to know
- HTTPS is automatic and free.
- The demo's saved data lives in each visitor's own browser, so visitors never see each other's data.
- **Custom domain:** *Domain management → Add a domain* (optional, usually paid).
- To check uptime for free: https://uptimerobot.com (not required, since static hosting does not sleep).

## 🥈 Other hosts, quick recipes

**Cloudflare Pages:** Workers & Pages → Create → Connect GitHub → Framework **Angular** → build `npm run build` → output `dist/client/browser` → add env var `NODE_VERSION=22.22.0`.

**Vercel:** New Project → import repo → it reads `vercel.json` → Deploy.

**Firebase:** `npm i -g firebase-tools` → `firebase login` → `firebase init hosting` (public dir `dist/client/browser`, single-page app **yes**) → `npm run build` → `firebase deploy`.
