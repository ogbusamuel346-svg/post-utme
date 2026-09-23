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

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React Icons, Motion
- **Backend & Database:** Supabase (PostgreSQL, Supabase Storage, Supabase Auth)
- **Deployment Ready:** Vercel, Netlify, Cloud Run, or any static/Node.js hosting

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
2. Go to the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  institution TEXT NOT NULL,
  subject TEXT,
  year_range TEXT,
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  cover_url TEXT,
  file_url TEXT,
  file_size TEXT,
  page_count INTEGER,
  format TEXT DEFAULT 'PDF',
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  downloads_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  sample_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products
CREATE POLICY "Public Read Access"
  ON products FOR SELECT
  USING (true);

-- Allow authenticated admins to insert, update, and delete
CREATE POLICY "Admin All Access"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for past questions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('past-questions', 'past-questions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage public read policy
CREATE POLICY "Public Download Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'past-questions');

-- Storage admin upload policy
CREATE POLICY "Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'past-questions');
```

3. Go to **Authentication -> Users** in Supabase and create your staff admin user account.
4. Navigate to `/admin` in the app and sign in with your admin credentials.

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
