import { useState } from 'react';
import { Search, ArrowRight, ShieldCheck, Download, Award, CheckCircle } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onSelectCategory: (cat: string) => void;
}

export function HeroSection({ onSearch, onSelectCategory }: HeroSectionProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const quickSearches = [
    { label: 'UNILAG Post-UTME', query: 'UNILAG' },
    { label: 'JAMB Use of English', query: 'Use of English' },
    { label: 'UI Past Questions', query: 'UI' },
    { label: 'Medicine 4-in-1 Bundle', query: 'Medicine' },
    { label: 'OAU Aptitude Test', query: 'OAU' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0A1B3D] via-[#0F294A] to-[#0A1B3D] text-white pt-12 pb-20 lg:pt-16 lg:pb-24">
      {/* Subtle background grid pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline, Search & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Unboxed editorial kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
              <span>National JAMB & Post-UTME Academic Repository</span>
              <span aria-hidden="true">·</span>
              <span>2026/2027 Admissions Guide</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.1] text-balance">
              Ace Your JAMB UTME & Secure First-Choice University Admission.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Download complete, verified past questions and step-by-step solutions for 
              JAMB UTME and top Nigerian universities including UNILAG, UI, OAU, UNIBEN, UNN, and ABU Zaria.
            </p>

            {/* Main Search Input */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="bg-white rounded-xl p-1.5 shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl border border-slate-200">
                <div className="flex-1 flex items-center px-3 gap-2.5">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by university (e.g. UNILAG), subject, or year..."
                    className="w-full text-slate-900 placeholder:text-slate-400 text-sm sm:text-base py-2 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                >
                  <span>Search Past Papers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Filter Tags (Interactive segmented buttons) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="text-slate-400">Popular:</span>
              {quickSearches.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSearch(item.query)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-md text-slate-200 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Proof metrics strictly adjacent to claim */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums">50,000+</p>
                <p className="text-xs text-slate-400">Past Exam Questions</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums">42</p>
                <p className="text-xs text-slate-400">Universities Covered</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-display text-orange-400 tabular-nums">99.4%</p>
                <p className="text-xs text-slate-400">Verified Answer Accuracy</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums">Instant</p>
                <p className="text-xs text-slate-400">PDF Mobile Access</p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Image */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              
              {/* Main Photo Frame */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl aspect-[2/3] bg-slate-800">
                <img
                  src="/src/assets/images/hero_jamb_students_1790125894091.jpg"
                  alt="Female Nigerian university student preparing for JAMB examinations"
                  className="absolute inset-0 w-full h-full object-cover object-[35%_center] scale-[1.65] origin-[35%_58%]"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                
                {/* Contrast scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1B3D]/90 via-transparent to-transparent" />
                
                {/* Overlay Text */}
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">2026/2027 Syllabus Updated</span>
                  </div>
                  <p className="text-[11px] text-slate-200">
                    All questions match recent CBT testing formats and official syllabuses from JAMB, UNILAG, UI & OAU.
                  </p>
                </div>
              </div>

              {/* Floating accent card */}
              <div className="hidden sm:flex absolute -top-5 -left-5 bg-white text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Over 48,000+ Downloads</p>
                  <p className="text-[11px] text-slate-500">Trusted by students nationwide</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
