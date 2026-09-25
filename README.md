# HerPath

### Know where you stand. Know what's missing. Know your next step.

**HerPath** is a scholarship platform built for girls in Pakistan. It covers **Pakistani and foreign scholarships** for **undergraduate and graduate study**. It doesn't just list scholarships. It compares each one against the girl's saved profile, shows exactly which requirements she meets and which she's missing, and gives her a step-by-step plan to close each gap before the deadline.

> **Live link:** _[add link]_
> **Source code:** _[add GitHub link]_
> **Demo video:** _[add link, optional]_

---

## 1. The Problem

Pakistan has one of the largest education gaps for girls in the world.

<!-- VERIFY before submitting: confirm each figure matches the exact page linked. The 2026 Gender Gap rank and the Aug 2026 Fulbright renewal could not be independently confirmed. -->

- Pakistan has the **second-highest number of out-of-school children** in the world, an estimated **25.1 million** children aged 5–16 ([UNICEF Pakistan](https://www.unicef.org/pakistan/education)).
- The 2023 Population Census found that **more girls (13.41 million) than boys (11.96 million)** are out of school ([Gallup Pakistan](https://gallup.com.pk/post/37391)).
- In the World Economic Forum's **Global Gender Gap Index 2026**, Pakistan ranked **143rd out of 145** economies, with economic participation the weakest area ([Express Tribune](https://tribune.com.pk/story/2629953/pakistan-at-143rd-on-gender-parity)).

For girls who do finish school, higher education is the path to financial independence. But the money that exists to help them often doesn't reach them. The problem isn't only that scholarships are scarce. It's that girls **don't know they qualify**, **don't know what's missing**, and **don't have anyone to guide them** through the process.

Information about scholarships is scattered across HEC pages, provincial endowment funds, university financial aid offices, embassy websites and social media posts. Eligibility rules are written in dense language: domicile requirements, income caps, 16-year education requirements, board restrictions, and rules against holding two scholarships at once. A first-generation student has no easy way to tell whether she qualifies or what to do if she doesn't.

Research from South Asia describes the same pattern. Scholarship portals go underused because of limited digital access and low digital literacy, government sites are cluttered, and without one reliable source, first-generation learners have to dig through countless websites ([IDR](https://idronline.org/article/education/why-many-marginalised-students-cant-access-scholarships/)).

---

## 2. Inspiration

The idea for HerPath came from a well-known experiment at the University of Michigan: the **HAIL Scholarship**.

The university didn't offer any new money. It simply told high-achieving, low-income students, before they applied, that they would receive the aid they already qualified for. Parents and principals were sent letters too. Applications jumped from **26% to 68%**, and enrollment more than doubled from **12% to 27%**. The researchers concluded that **uncertainty** was one of the biggest barriers holding students back ([University of Michigan](https://events.umich.edu/event/83166)).

HAIL teaches two lessons, and HerPath is built on both:

1. **Certainty matters more than money.** A girl who knows exactly where she stands, and exactly what to do next, is far more likely to apply. So HerPath replaces "Here are 500 scholarships" with **"You qualify for these 6, and you're 2 steps away from these 4."**
2. **Reach matters as much as the message.** HAIL worked because Michigan mailed the letter. The students didn't have to go looking. A website that waits to be found repeats the problem it's trying to solve, so HerPath's launch plan (Section 6) treats schools, colleges and counsellors as the delivery channel, not a later add-on.

---

## 3. Who It's For

Girls in Pakistan who are:

- **Finishing Intermediate / A-Levels** and planning a Bachelor's degree
- **Currently in a BS program** looking for need-based or merit-based support
- **Graduates** planning a Master's or PhD, in Pakistan or abroad

HerPath is also designed for **their families**. In many households, a daughter's education depends on her parents' approval, so HerPath gives families clear, trustworthy information in Urdu.

It's also designed for **teachers and counsellors**, who often guide dozens of students at once and need a fast way to tell each one what she's missing.

---

## 4. Features

HerPath is built in two stages. **Version 1** is the complete core loop: profile, match, gap analysis, fix-it guides, and a page for parents. **Version 2** adds planning and comparison tools on top of a working, verified base.

### Version 1: the core loop

#### 4.1 Saved Profile
A short, friendly form (about 3 minutes) creates her profile, which is saved to her HerPath account so she never has to re-enter her details, on any phone. She can update it anytime, for example when new exam results arrive. She can also **browse and filter scholarships without creating a profile**, so the first visit has no barrier.

The profile is built around Pakistan's education system:

| Section | Fields |
|---|---|
| Personal | Age, province of domicile, district, special categories (orphan, person with disability, religious minority, child of BPS 1–4 government employee, BISP beneficiary family) |
| School | Board (Punjab/Sindh/KP/Balochistan BISE, FBISE, AJK, Cambridge O/A Levels), Matric %, Intermediate % and stream (Pre-Medical, Pre-Engineering, ICS, Commerce, Humanities) |
| University | Current or completed degree, years of education (14 or 16), CGPA, public or private university |
| Tests | MDCAT, ECAT, NAT, GAT/HAT, IELTS, TOEFL, Duolingo, GRE |
| Finances | Monthly household income (PKR) |
| Experience | Work experience in years, volunteering, leadership roles |
| Documents | CNIC / B-Form, domicile certificate, passport, income certificate, HEC-attested degree, IBCC equivalence (for O/A Levels), recommendation letters |
| Preferences | Study in Pakistan or abroad, preferred countries, fields of interest |

#### 4.2 Search and Smart Filters

| Filter | Options |
|---|---|
| Where to study | In Pakistan / Abroad / Both |
| Degree level | Undergraduate, Master's, PhD |
| Province | Scholarships open to her domicile |
| University type | Public, private, specific partner universities |
| Type | Need-based, merit-based, both |
| Funding | Fully funded, partial, tuition only, stipend only |
| Covers | Tuition, monthly stipend, hostel/accommodation, airfare, health insurance, books |
| Test required | IELTS/TOEFL required, English waiver possible, no test |
| For women | Women-only scholarships, scholarships with a female quota |
| Deadline | Closing this month, next 3 months, next cycle |
| Income limit | Only show scholarships within her family's income range |
| Special categories | Disability, minority, orphan and other reserved quotas |

#### 4.3 Scholarship Detail Page
Each scholarship has a clear, plain-language page covering:

- What it covers, with amounts in **PKR**
- Who it's for and the full requirements
- Required documents
- Application steps and official link
- Deadline and status: **open**, **closed**, or **expected** (with the usual month it opens)
- Whether it allows holding another scholarship at the same time
- **"Last verified" date**, so she always knows how fresh the information is

#### 4.4 Gap Analyzer: "What's missing?"
This is the heart of HerPath. Every scholarship is stored with **structured requirements**. Her profile is checked against each one, and every requirement gets one of four statuses:

| Status | Meaning |
|---|---|
| ✅ **Met** | She fulfils this requirement. |
| ⚠️ **Fixable** | She's missing it, but she can fix it before the deadline. |
| ⏳ **Fixable later** | She can fix it, but not in time for this cycle. |
| ❌ **Not eligible** | A fixed condition she can't change, like domicile or nationality. |

Every gap comes with a clear explanation, the next step, and a **"start by" date** worked backward from the deadline using the typical processing time for that step.

Real eligibility rules are rarely a simple list. Many scholarships accept **either** IELTS **or** TOEFL **or** an English-medium instruction letter. Fulbright accepts **either** a 16-year degree **or** a 4-year BS. So requirements can be grouped as "any one of these," and a rule can apply only in certain cases (for example, an age limit that depends on the degree level). This keeps the analysis honest instead of failing her on a test she doesn't actually need.

**Example: a graduate applicant**

> **Fulbright Master's Degree (USA): 3 of 5 requirements met**
>
> ✅ Pakistani citizen, living in Pakistan
> ✅ Field of study eligible
> ⚠️ **16 years of education required. You have 14 (BA).**
> _Fix:_ Complete a 2-year Master's or a BS degree first. See the Fix-It Guide.
> ⚠️ **GRE General score needed.**
> _Fix:_ Free GRE preparation guide. Start by 15 January to have results before the deadline.
> ✅ Willing to return to Pakistan after study

**Example: an undergraduate applicant**

> **Provincial Endowment Fund Scholarship: 4 of 5 requirements met**
>
> ✅ Punjab domicile
> ✅ Intermediate marks above 60%
> ✅ Family income within limit
> ✅ Enrolled in a partner university
> ⚠️ **Income certificate missing.**
> _Fix:_ How to get an income certificate, step by step. Start by 10 March.

HerPath is also **honest about gaps she can't fix**. If a scholarship is only for another province's domicile, it says so clearly and suggests similar scholarships she *can* apply for.

#### 4.5 Readiness Score and Result Tabs
Results are grouped into three tabs:

- **🟢 Apply now:** she meets every requirement and the application window is open.
- **🟢 Ready when it opens:** she meets every requirement; the cycle hasn't opened yet.
- **🟡 Almost there:** she has gaps she can fix before the deadline.
- **🔵 Future goals:** she can reach these in 1–2 years with a plan.

Scholarships with a **fixed requirement she doesn't meet** are never scored. They're shown separately as "Not eligible" with the reason, so she never sees a misleading "90% match" for something she can't apply to. For everything else, the score counts fixable gaps and how long each takes to close.

The "Almost there" tab turns "I don't qualify" into "I qualify if I do these two things."

#### 4.6 Fix-It Guides (Pakistan-specific)
Every common gap links to a short, practical guide written for the Pakistani context. Version 1 ships the five most common:

- How to get an **income certificate**
- How to get a **domicile certificate**
- How to get **HEC degree attestation**
- How to get **IBCC equivalence** for O/A Levels
- How to get a **passport**

Version 2 adds IELTS/TOEFL/Duolingo preparation with free resources, the **English-medium instruction letter** some scholarships accept instead of a test, recommendation letter templates, moving from a 14-year to a 16-year degree, and profile-building through volunteering and free online courses.

#### 4.7 Document Checklist
She ticks off the documents she already has. HerPath shows how many scholarships each missing document would unlock:

> "Get your passport and 7 more scholarships open up."
> "Get your IELTS done and 9 more scholarships open up."

This helps her decide **which gap to fix first**.

#### 4.8 Family Mode (Urdu and English)
With one tap, she can create a simple, shareable page for her parents **in Urdu**. It explains:

- What the scholarship covers, in rupees
- That it's free to apply and comes from a legitimate organization
- Where she would study and live, and whether hostel accommodation is provided

All Family Mode content comes from pre-written, verified templates.

#### 4.9 Share on WhatsApp
Share any scholarship, or the Family Mode page, directly on WhatsApp, the way most information travels in Pakistan.

#### 4.10 Saved Scholarships and Deadline Tracker
Bookmark scholarships and see a countdown to each deadline. When two saved scholarships can't be held together, HerPath flags the conflict so she can plan which to accept.

#### 4.11 Bilingual and Low-Data Design
- Full **English and Urdu** interface, with proper right-to-left layout
- Urdu set in a **Naskh** typeface rather than Nastaliq, because Naskh web fonts are far smaller and render reliably on low-cost Android phones
- **Mobile-first**, since most users will be on phones
- Static pages, small bundle, no heavy images, so it loads on a slow connection

### Version 2: planning and comparison

- **Pathway Planner ("Future Me"):** a long-term roadmap, for example Intermediate → BS (need-based scholarship in Pakistan) → work experience → Master's abroad. At each stage, it shows which scholarships open up and what to prepare now.
- **Scholarship Comparison:** 2–3 scholarships side by side on coverage, requirements, readiness, deadline and effort.
- **Calendar view** of all saved deadlines.
- **Essay and Personal Statement Guide** with each scholarship's prompts, a structure guide, and a self-check list.
- **Success Stories:** short profiles of Pakistani women who received these scholarships, from public sources or shared with permission.
- **Women-friendly study information:** women's universities, hostel coverage and female quotas highlighted per scholarship and university.

---

## 5. Scholarship Data

### 5.1 Coverage
HerPath's database is **hand-curated and verified**, with every listing linked to its official source and marked with a "last verified" date. Version 1 launches with 17 scholarships, chosen for the number of girls they can reach:

**In Pakistan**
- HEC Need-Based Scholarships
- Benazir Undergraduate Scholarship (formerly Ehsaas), which reserves **50% of scholarships for female students** ([PASS](https://pass.gov.pk/Detail/OTgzMGI5NzgtNjM0NC00ODM2LWIzMWUtOGEyZDUyODhhZjdl))
- Provincial endowment funds such as the Punjab Educational Endowment Fund (PEEF) and Sindh Educational Endowment Fund
- University-level merit and need-based scholarships
- Interest-free education loan programs

**Abroad**
- Fulbright (USA)
- Chevening and Commonwealth Scholarships (UK)
- DAAD (Germany)
- Türkiye Bursları (Türkiye)
- Chinese Government Scholarship (China)
- Stipendium Hungaricum (Hungary)
- Erasmus Mundus (Europe)
- Global Korea Scholarship (South Korea)
- MEXT (Japan)
- HEC overseas scholarship programs

### 5.2 Why verification matters
Scholarship programs change. In 2025, US funding cuts left the Fulbright program in Pakistan uncertain ([Dawn](https://www.dawn.com/news/1902981)), and in August 2026 a new five-year agreement renewed it ([ProPakistani](https://propakistani.pk/2026/08/11/pakistan-and-us-agree-to-extend-fulbright-scholarship-program/)). A girl relying on outdated information could miss an opportunity or waste months preparing for one that no longer exists. That's why every listing on HerPath shows its status and last-verified date.

### 5.3 How the data stays current
A "last verified" badge tells her the data is stale. It doesn't stop it going stale. So HerPath commits to a maintenance routine:

- **Cycle-based deadlines, not fixed dates.** Most Pakistani scholarships announce a new cycle every year. Each listing stores the month it usually opens and a status (open, closed, expected). A hard date is stored only once one is officially announced, so a listing never shows last year's deadline as if it were this year's. Until then, HerPath estimates the next deadline as the usual opening month plus a 60-day window, and labels it as an estimate.
- **A verification calendar.** Every listing has a "next check" date set to about a month before its usual opening. The admin panel lists every listing that's due, and a monthly review checks each one against its official page.
- **A public change log.** Every change to a listing is recorded automatically with a date, the fields that changed and the source, so anyone can see what changed and why.
- **Report a problem.** Each page has a one-tap link to report an error. Reports go to the curators' review queue, and a link to a public issue tracker appears when one is configured.
- **Provider portal (later).** Version 2 adds a way for scholarship providers to submit and update their own listings, which is the long-term answer to keeping data fresh.

---

## 6. Reaching Girls: Launch Plan

A website that waits to be found repeats the problem it's trying to solve. HerPath launches through the people who already talk to girls about their future:

- **Teachers and college counsellors.** A counsellor can run HerPath on her own phone with a student sitting beside her, in three minutes, and hand the student a WhatsApp link to the results. HerPath will start with a small set of partner colleges and girls' schools.
- **NGOs and community organizations** already working on girls' education, who can share HerPath through their existing networks.
- **WhatsApp-first sharing.** Every scholarship and every Family Mode page is built to be forwarded. A girl who finds one scholarship can pass it to a classmate in one tap.
- **Printable posters** with a QR code for school notice boards, in Urdu and English.

---

## 7. SDG Alignment

| SDG | How HerPath contributes |
|---|---|
| **SDG 4: Quality Education** (primary) | **Target 4.3:** equal access for all women and men to affordable, quality tertiary education. **Target 4.b:** expanding scholarships for students from developing countries. HerPath makes sure existing scholarships actually reach the girls they were created for. |
| **SDG 5: Gender Equality** | Removes information and family barriers that keep Pakistani girls out of higher education, which is the foundation for their economic participation. |
| **SDG 10: Reduced Inequalities** | Gives first-generation, low-income and rural girls the same guidance that wealthier students get from consultants, for free. Highlights quotas for students with disabilities, minorities and other underserved groups. |

---

## 8. Privacy and Safety

Many HerPath users will be teenage girls, so the data HerPath holds is kept to the minimum:

- **An account is an email and a password.** No phone number, no photo, no CNIC number, no location.
- **The profile holds facts, not documents.** Marks, income, and a yes/no for each document. Nothing is ever uploaded.
- **Delete everything in one tap** from Settings. The account and profile are removed immediately.
- **No AI and no third-party tracking.** Matching uses transparent rules she can read on every scholarship page.
- HerPath is **free**. It never charges to find or apply for scholarships.

**Shared phones.** Many girls will use a parent's or sibling's phone. Logging out removes her profile from the device and ends the session on the server, and she can log in again on any phone. Resetting her password logs out every other device.

**What HerPath counts.** To know whether it's working, HerPath keeps a small set of **anonymous, aggregate counters**: profiles created, gaps closed, scholarships moved to "Apply now", and Family Mode pages shared. These are plain numbers with no identifiers. Any user can switch them off in Settings.

---

## 9. How It Works (Technical Overview)

HerPath runs entirely on **transparent, rule-based logic**. There is no AI in the product.

1. **Scholarship database:** scholarships are curated in an admin panel and seeded from JSON files in Git. Each scholarship's requirements are stored as structured rules, and an invalid rule cannot be saved.
2. **Profile:** stored in the HerPath database against her account.
3. **Matching engine:** a Python rule engine on the server compares the profile to each rule and returns a status for every requirement. Rules can be grouped as "all of" or "any of," and a rule can apply only under a condition.
4. **Level match:** she says what she wants to study next (Bachelor's, Master's or PhD), and each scholarship is only matched for the levels it funds.
5. **Readiness score:** if any fixed requirement fails, the scholarship is marked "Not eligible" and not scored. If it only fails because she hasn't answered a question yet, it is shown as "Needs more information" instead, with a link back to her profile. Otherwise the score reflects how many fixable gaps remain and whether each can be closed before the deadline.
6. **Start-by dates:** for each fixable gap, deadline (official, or estimated from the usual opening month) minus the typical processing time for that step. If the start-by date has passed, the gap becomes "Fixable later" and the scholarship moves to Future goals for the next cycle.

**Example scholarship entry:**

```json
{
  "id": "peef-undergrad",
  "name": "PEEF Undergraduate Scholarship",
  "provider": "Punjab Educational Endowment Fund",
  "location": "pakistan",
  "levels": ["undergraduate"],
  "type": ["need", "merit"],
  "covers": ["tuition", "stipend"],
  "femaleQuota": false,
  "allowsOtherScholarship": false,
  "requirements": [
    { "field": "domicile", "rule": "in", "value": ["Punjab"], "fixable": false,
      "message": { "en": "Only for students with Punjab domicile", "ur": "…" } },
    { "field": "interPercent", "rule": ">=", "value": 60, "fixable": false,
      "message": { "en": "Minimum 60% in Intermediate", "ur": "…" } },
    { "field": "monthlyIncome", "rule": "<=", "value": 60000, "fixable": false,
      "message": { "en": "Family income limit", "ur": "…" } },
    { "field": "documents.incomeCertificate", "rule": "has", "fixable": true,
      "fixGuide": "income-certificate", "daysNeeded": 14 }
  ],
  "cycle": { "usualOpening": "February", "status": "expected", "deadline": null },
  "officialLink": "https://www.peef.org.pk",
  "lastVerified": "2026-09-22",
  "nextCheck": "2027-01-15"
}
```

**Example of an "any of" rule**, for a scholarship that accepts several proofs of English:

```json
{
  "anyOf": [
    { "field": "tests.ielts", "rule": ">=", "value": 6.5, "fixable": true,
      "fixGuide": "ielts", "daysNeeded": 60 },
    { "field": "tests.toefl", "rule": ">=", "value": 80, "fixable": true,
      "fixGuide": "toefl", "daysNeeded": 60 },
    { "field": "documents.englishMediumLetter", "rule": "has", "fixable": true,
      "fixGuide": "english-medium-letter", "daysNeeded": 10 }
  ],
  "message": { "en": "Proof of English: IELTS 6.5, TOEFL 80, or an English-medium instruction letter", "ur": "…" }
}
```

When she meets none of them, HerPath shows the **fastest** option first, here the letter at 10 days, rather than sending her to a test she may not need.

**Example of a conditional rule**, for an age limit that applies only to Master's applicants:

```json
{ "appliesWhen": { "field": "level", "rule": "==", "value": "masters" },
  "field": "age", "rule": "<=", "value": 35, "fixable": false,
  "message": { "en": "Master's applicants must be 35 or under", "ur": "…" } }
```

_Values shown are for illustration. Final values will be verified against official sources._

---

## 10. Technologies and Tools

| Purpose | Tool |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS with right-to-left support, next-intl |
| Backend | Django, Django REST Framework, JWT authentication |
| Database | PostgreSQL |
| Data | Scholarships and guides curated in Django admin, seeded from JSON and Markdown files versioned in Git, with a public change log |
| Logic | Python rule engine (matching, gap analysis, scoring, start-by dates) |
| Languages | English and Urdu, Noto Naskh Arabic web font |
| Usage counters | Aggregate counters in the database, no identifiers, opt-out in Settings |
| Design | Figma |
| Hosting | Vercel (frontend), Railway (backend and PostgreSQL) |
| Version control | GitHub, with a public issue tracker for data corrections |
| Planning and research | AI assistant (used for research and planning only; the product contains no AI) |

---

## 11. Measuring Impact

HerPath measures success with anonymous aggregate counts and voluntary follow-ups:

- Number of profiles created (anonymous counter)
- Number of scholarships moved from **"Almost there" to "Apply now"** (anonymous counter)
- Number of gaps marked closed, such as documents obtained or tests taken (anonymous counter)
- Number of Family Mode pages shared (anonymous counter)
- Applications submitted and scholarships won, collected through an **optional, anonymous survey** and through partner schools and counsellors

---

## 12. Future Plans

- Deadline reminders by SMS or WhatsApp
- More regional languages: Punjabi, Sindhi, Pashto and Balochi
- A provider portal so scholarship organizations can submit and update their own listings
- A mentorship network connecting applicants with Pakistani women who have won scholarships
- A counsellor view, so one teacher can guide many students from one phone

---

## 13. Screenshots

1. _Profile setup_
2. _"Apply now / Almost there / Future goals" results_
3. _Gap Analyzer for a scholarship, with start-by dates_
4. _Document checklist with "unlocks N more"_
5. _Family Mode in Urdu_

---

---

## 14. Running HerPath locally

Requirements: Python 3.12+, Node 24+ (npm 11, which the lockfile was written with), PostgreSQL 16 (or Docker).

```bash
# Database
docker run -d --name herpath-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=herpath -p 5432:5432 postgres:16

# Backend (http://localhost:8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DEBUG=1 DATABASE_URL=postgres://postgres:postgres@localhost:5432/herpath
python manage.py migrate
python manage.py seed              # 17 scholarships, 13 fix-it guides
python manage.py createsuperuser   # for /admin/
python manage.py runserver
pytest -q

# Frontend (http://localhost:3000)
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev
npm test && npm run lint

# Browser tests (uses your installed Google Chrome; both servers running and seeded)
E2E_WEB=http://localhost:3000 E2E_API=http://localhost:8000/api npm run e2e
```

**Deploying.** Backend: Railway with a PostgreSQL plugin, root directory `backend`, and `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `NUM_PROXIES=1` and SMTP `EMAIL_BACKEND`/`EMAIL_*` variables set (the server refuses to start without a real email backend); run `python manage.py seed` once. Frontend: Vercel with root directory `frontend` and `NEXT_PUBLIC_API_URL` pointing at the Railway API. Set `NEXT_PUBLIC_ISSUES_URL` to show a public issue-tracker link next to "Report a problem".

---

**HerPath: because no girl should miss a scholarship she could have won.**
