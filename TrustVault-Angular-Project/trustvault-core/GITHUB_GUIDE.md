# 📤 How to put this project on GitHub (step by step, explained simply)

Think of **GitHub** as a **shelf on the internet** where you keep your project so other people (and Netlify) can see it.
Follow the steps in order. Do not skip. You can do it! 💪

---

## 🧰 Step 0: Things you need (one time only)

| Tool | What it is | Get it |
|---|---|---|
| **GitHub account** | Your shelf on the internet | https://github.com → *Sign up* |
| **Git** | The tool that sends your files to the shelf | https://git-scm.com/downloads → install with all default options |
| **Node.js 22.22.0** | Matches the website's `.nvmrc` and Netlify runtime requirements | https://nodejs.org → *Previous Releases* |

Check that they work. Open **Terminal** (Windows: press the Windows key, type `cmd`, press Enter) and type:

```bash
git --version
node -v
```

You should see version numbers. If you see *"not recognized"*, close the window, reopen it, and try again.

---

## 🗂️ Step 1: Unzip the project

1. Find **`TrustVault-Angular-Project.zip`**.
2. Right-click → **Extract All**.
3. Open the new folder **`trustvault-core`**. You must see **`package.json`**, **`angular.json`** and a folder called **`src`** *directly inside it*.

> ❗ If you only see another folder inside, open that one. The folder that has `package.json` is your **project folder**.

### ✅ This is exactly how your project folder must look

```text
trustvault-core/                 <- the project folder (upload THIS)
├─ .gitignore                    <- tells Git what NOT to upload
├─ .nvmrc
├─ angular.json                  <- Angular settings
├─ package.json                  <- list of tools the project needs
├─ tailwind.config.js            <- colours and animations
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.worker.json
├─ netlify.toml                  <- Netlify settings (build + redirects)
├─ vercel.json                   <- (only if you ever use Vercel)
├─ README.md                     <- the pretty front page on GitHub
├─ API.md
├─ GITHUB_GUIDE.md
├─ DEPLOY_GUIDE.md
├─ docs/
│  └─ banner.svg                 <- the animated banner in the README
├─ public/
│  └─ _redirects                 <- makes page refresh work online
├─ single-file/
│  └─ TrustVault-single-file.html
└─ src/
   ├─ index.html
   ├─ main.ts
   ├─ styles.css                 <- all the glass + glow styles
   └─ app/
      ├─ app.component.ts
      ├─ app.config.ts
      ├─ app.routes.ts
      ├─ core/       (api, auth, cache, idle, mock data, translate ... 20 files)
      ├─ shared/     (card, gauge, heatmap, stepper, directives, pipes ... 15 files)
      ├─ scene/      quantum-core.component.ts      <- the 3D world
      ├─ auth/       login.component.ts
      ├─ shell/      shell.component.ts
      ├─ dashboard/  dashboard.component.ts
      ├─ workspace/  widgets.ts, workspace.component.ts
      ├─ records/    records.component.ts, record-modal.component.ts
      └─ admin/      admin.routes.ts, users, pipeline, audit, hash-chain.ts, hash.worker.ts
```

🚫 **Never upload these** (they are huge and Git ignores them automatically thanks to `.gitignore`):
`node_modules/`, `dist/`, `.angular/`.

---

## 🧪 Step 2: Test it on your computer first (very important!)

In the Terminal, go *into* the project folder. For example, if it is on your Desktop:

```bash
cd Desktop/trustvault-core
npm install
npm run build
```

* `npm install` downloads the tools (about 2 minutes).
* `npm run build` builds the website. **It must finish without red errors.** ✅
* Then try it: `npm start` → open http://localhost:4200

If anything fails, see *"Troubleshooting"* at the bottom. **Do not upload before the build works.**

---

## 🏗️ Step 3: Create the shelf (repository) on GitHub

1. Log in to https://github.com.
2. Click the green **New** button (or the **+** at the top right → *New repository*).
3. **Repository name:** `trustvault-core`
4. **Description:** `Angular + Tailwind + Three.js demo: TrustVault Core`
5. Choose **Public** (so recruiters can see it).
6. ❌ **Do NOT** tick *Add a README*, *.gitignore* or *license* (we already have them).
7. Click **Create repository**.

You land on an empty page with a web address like `https://github.com/YOUR-NAME/trustvault-core.git`. Copy it. 📋

---

## 🚀 Step 4: Send your files to GitHub

In the Terminal, inside the project folder, type these lines **one by one** (press Enter after each):

```bash
git init
git add .
git commit -m "feat: TrustVault Core - Angular demo with 24 pro features"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/trustvault-core.git
git push -u origin main
```

Replace `YOUR-NAME` with your GitHub username.

**First time using Git?** If it says *"Please tell me who you are"*, run this once, then repeat the `git commit` line:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

**When `git push` asks you to log in:** a browser window opens, click **Authorize**. (GitHub no longer accepts passwords in the terminal. It uses that browser sign-in, or a *Personal Access Token*.)

---

## 🖱️ Easier way: GitHub Desktop (no typing!)

1. Install **GitHub Desktop**: https://desktop.github.com and sign in.
2. **File → Add local repository** → choose the `trustvault-core` folder → *create a repository* if asked.
3. Bottom-left: type a message like `first upload` → **Commit to main**.
4. Click **Publish repository** → untick *Keep this code private* → **Publish**. Done! 🎉

---

## 🌐 Last resort: upload in the browser

1. Open your empty repository on GitHub → click **uploading an existing file**.
2. Drag the **contents** of `trustvault-core` (the files and folders inside, **not** `node_modules`) into the page.
3. Wait for the upload bar → **Commit changes**.

> GitHub's web upload accepts up to 100 files at a time. If it complains, do it in two batches: first `src`, then everything else.

---

## ✅ Step 5: Check that it worked

Open your repository page. You should see:

- [ ] The animated **TrustVault Core** banner and the badges at the top (that is the README ✨)
- [ ] Folders: `src`, `public`, `docs`, `single-file`
- [ ] Files: `package.json`, `angular.json`, `netlify.toml`
- [ ] **No** `node_modules` folder

Then edit the README link `https://YOUR-SITE-NAME.netlify.app` after you deploy (see `DEPLOY_GUIDE.md`).

---

## 🔁 Later: sending a change

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## 🆘 Troubleshooting

| You see | What it means | Fix |
|---|---|---|
| `git is not recognized` | Git is not installed | Install Git, **close and reopen** the terminal |
| `npm is not recognized` | Node is not installed | Install Node LTS, reopen the terminal |
| `fatal: not a git repository` | You are in the wrong folder | `cd` into the folder that contains `package.json` |
| `remote origin already exists` | You ran that line twice | `git remote set-url origin https://github.com/YOUR-NAME/trustvault-core.git` |
| `failed to push` / `rejected` | The repo is not empty | Use `git push -u origin main --force` (only on a brand-new repo) |
| `EACCES` / permission errors on `npm install` | Folder is protected | Move the project to `Documents` or `Desktop` |
| Build error `Cannot find module 'three'` | Install was skipped | Run `npm install` again |
