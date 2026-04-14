# JD Intelligence — Wiseskulls Recruitment Tool
### Powered by Google Gemini AI (Free)

---

## STEP 1 — Get your FREE Gemini API Key (5 minutes)

1. Go to → https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key — it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXX`
5. Save it somewhere (Notepad is fine for now)

> ✅ This is 100% FREE — Google gives 1,500 requests/day at no cost. No credit card needed.

---

## STEP 2 — Upload files to GitHub (5 minutes)

1. Go to → https://github.com and sign in (or create a free account)
2. Click the **"+"** icon (top right) → **"New repository"**
3. Name it: `jd-analyzer` (or any name you like)
4. Set to **Public**
5. Click **"Create repository"**
6. On the next screen, click **"uploading an existing file"**
7. Drag and drop ALL files from the ZIP you downloaded:
   - `index.html`
   - `netlify.toml`
   - `netlify/functions/analyze.js`  ← upload this inside a folder called `netlify/functions/`
8. Click **"Commit changes"**

> 💡 To upload the `analyze.js` inside folders: click "Create new file", type `netlify/functions/analyze.js` as the filename, then paste the contents.

---

## STEP 3 — Deploy on Netlify (5 minutes)

1. Go to → https://netlify.com and sign up FREE (use your GitHub account to sign in — easiest)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"** → authorize Netlify → select your `jd-analyzer` repository
4. Leave all build settings as default
5. Click **"Deploy site"**
6. Wait ~1 minute for deployment to finish

---

## STEP 4 — Add your API Key (2 minutes) ← MOST IMPORTANT

1. In your Netlify site dashboard, go to:
   **Site configuration** → **Environment variables** → **Add a variable**
2. Fill in:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** paste your Gemini API key from Step 1
3. Click **Save**
4. Go to **Deploys** tab → click **"Trigger deploy"** → **"Deploy site"**

---

## STEP 5 — Get your link and share!

After deploy finishes, Netlify gives you a link like:
`https://amazing-sundae-123abc.netlify.app`

You can rename it under **Site configuration → Site details → Change site name**
Example: `wiseskulls-jd.netlify.app`

**Share this link with your whole team.** Anyone can open it in a browser — no login, no install, nothing to download.

---

## How to use the tool

1. Open the link
2. Paste any US IT job description in the box
3. Click **"Analyze JD"**
4. Read the results:
   - **Venn diagram** — shows where skills fall: Required / Preferred / Market Relevant and all overlaps
   - **Golden combo (purple center)** — the must-have combination to source first
   - **Screening checklist** — 5 yes/no questions for your first call with the candidate
   - **Red key notes** — recruiter tips, ATS keywords, red flags, market reality
   - **Market context** — US demand, C2C/W2 rates, candidate pool info

---

## Files in this project

```
jd-analyzer/
├── index.html                    ← The website (frontend)
├── netlify.toml                  ← Netlify settings
├── netlify/
│   └── functions/
│       └── analyze.js            ← Backend (keeps API key safe)
└── README.md                     ← This guide
```

---

## Updates and changes

Any time you push a change to GitHub → Netlify auto-deploys it.
No manual steps needed after initial setup.

---

Built for Wiseskulls US IT Recruitment team.
