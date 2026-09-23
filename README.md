# EduJAMB - Nigerian JAMB & Post-UTME Past Questions & Educational Portal

A modern, high-performance web application designed for Nigerian students preparing for the Joint Admissions and Matriculation Board (JAMB UTME) and University Post-UTME screening examinations.

---

## 🚀 Key Features

- **Resource Catalog & Filtering:** Search and filter hundreds of verified Post-UTME screening papers, JAMB past questions, syllabus guides, novel summaries, and formula sheets by university or examination category.
- **Dynamic Institution Support:** Add, type, and manage past questions for any Nigerian University, Polytechnic, or College of Education directly.
- **Fast Product Management:** Admin dashboard with instantaneous PDF/document attachment and direct cloud link support.
- **Protected Staff Admin Portal (`/admin`):**
  - Secured behind Supabase Authentication (`auth.users`).
  - Catalog management: add, edit, pricing control, and delete.
  - Live analytics on total downloads and resource activity.
  - Real-time Supabase connection health check and SQL migration generator.
- **Student Utility Tools:**
  - **University Aggregate Score Calculator:** Calculate 50:50, 60:40, and custom admission screening aggregate scores for UNILAG, UI, OAU, UNN, ABU, etc.
  - **JAMB Subject Combination Checker:** Verify correct 4-subject UTME requirements across faculties (Medicine, Engineering, Law, Social Sciences, Arts).
- **Direct WhatsApp Order Integration:** One-click pre-filled WhatsApp ordering and customer support for students across Nigeria.
- **Guest Paystack Checkout:** Students pay without creating an account, receive the real uploaded material after server-side verification, and can recover a previous purchase with their email and Paystack reference.
- **Student Accounts:** Optional email/password signup, signin, and a personal profile for name, phone, and target institution. Guest purchasing remains available.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React Icons, Motion
- **Backend & Database:** Supabase (PostgreSQL, Supabase Storage, Supabase Auth)
- **Payments:** Paystack server-side initialization, verification, and signed download access
- **Deployment Ready:** Vercel (frontend plus `/api/paystack` serverless endpoint)

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/edujamb-portal.git
cd edujamb-portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:
```env
# Supabase Project URL (from Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Public API Key (from Project Settings -> API)
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Same-origin payment API for Vercel
VITE_PAYSTACK_API_URL=/api/paystack

# Server-only variables: add these to Vercel Project Settings -> Environment Variables.
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
APP_URL=https://your-deployed-domain.example
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🗄️ Supabase Setup & SQL Schema

If you wish to synchronize products with a Supabase cloud database:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Admin -> Supabase Settings** in the app, copy the complete generated migration, and run it in the **SQL Editor** in your Supabase dashboard. It creates the products table, private purchase records, the public cover bucket, and the private paid-materials bucket.

The application-generated migration is the source of truth. It also includes the RLS rules needed for the admin upload/delete workflow and should be preferred over an older hand-written schema.

3. Go to **Authentication -> Users** in Supabase and create your staff admin user account.
4. Navigate to `/admin` in the app and sign in with your admin credentials.

### Paystack deployment setup

1. Add the Paystack test or live **secret key** as `PAYSTACK_SECRET_KEY` in Vercel Project Settings -> Environment Variables. Never expose this key with a `VITE_` prefix.
2. Add `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `APP_URL` to the same Vercel environment settings. The service-role key is used only by `/api/paystack` and must not be put in frontend code.
3. Redeploy after saving the variables. The payment button initializes a transaction on the server, opens Paystack InlineJS in the browser, verifies the amount/reference on the server, then issues the download link.
4. In Paystack Dashboard -> API Keys & Webhooks, set the webhook URL to `https://your-deployed-domain.example/api/paystack`. The endpoint validates Paystack's signature and records successful payments even if the buyer loses connection after paying.
5. Buyers only enter an email address; they do not need an account. If a download is interrupted, they can reopen any paid resource, choose **Already paid? Recover your download**, and provide the same email plus the Paystack reference.

### Student account setup

Users can choose **Sign in** in the navbar and use email/password signup or signin. Profile details are stored in Supabase Auth user metadata; no extra profile table is required.

---

## 🚢 Pushing to GitHub

To push this codebase to your own GitHub repository:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Add all files
git add .

# 3. Commit your changes
git commit -m "Initial commit: EduJAMB portal with admin dashboard and Supabase integration"

# 4. Create a repository on GitHub (e.g. named edujamb-portal)

# 5. Link your local repository to GitHub
git remote add origin https://github.com/YOUR_USERNAME/edujamb-portal.git

# 6. Set default branch to main and push
git branch -M main
git push -u origin main
```

---

## 📁 Project Structure

```
├── .env                  # Local environment configuration (git-ignored)
├── .env.example          # Environment variables template for team / CI
├── .gitignore            # Git exclusion rules
├── index.html            # HTML entry point with educational SEO meta
├── api/
│   └── paystack.ts        # Server-side payment initialize, verify, webhook & recovery
├── package.json          # Node dependencies & npm scripts
├── README.md             # Project documentation
├── tsconfig.json         # TypeScript compiler configuration
├── vite.config.ts        # Vite configuration with Tailwind CSS
└── src/
    ├── assets/           # Curated book cover assets and logos
    ├── components/       # Reusable React UI components
    │   ├── AdminDashboard.tsx           # Full admin management portal
    │   ├── AdminLogin.tsx               # Supabase Auth login guard
    │   ├── AggregateCalculatorModal.tsx # University aggregate calculator
    │   ├── Footer.tsx                   # Page footer with staff link
    │   ├── HeroSection.tsx              # Landing hero with quick links
    │   ├── Navbar.tsx                   # Main navigation bar
    │   ├── ResourceCard.tsx             # Product display card
    │   ├── ResourceDetailModal.tsx      # Product preview & checkout
    │   ├── SEOHead.tsx                  # Meta tags & Schema.org JSON-LD
    │   ├── SubjectCombinationModal.tsx  # JAMB combination checker
    │   └── WhatsAppButton.tsx           # Direct support floating button
    ├── data/             # Initial offline resource catalog & seed data
    ├── services/         # Supabase client, storage, auth & persistence
    └── types.ts          # TypeScript interfaces & domain models
```

---

## 📄 License

This project is licensed under the MIT License.
