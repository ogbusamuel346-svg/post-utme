import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BRAND_LOGO_URL, BRAND_NAME } from '../config/branding';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSubjectCombinations: () => void;
  supabaseConnected: boolean;
}

export function Navbar({
  currentTab,
  onSelectTab,
  onOpenSubjectCombinations,
  supabaseConnected
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105">
              <img src={BRAND_LOGO_URL} alt={`${BRAND_NAME} logo`} className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#0F294A] font-display">
                Sam <span className="text-orange-500">Edu Hub</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                Past Questions & Solutions
              </span>
            </div>
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-colors whitespace-nowrap hover:text-[#0F294A] ${
                currentTab === 'home' ? 'text-[#0F294A] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('jamb_utme')}
              className={`transition-colors whitespace-nowrap hover:text-[#0F294A] ${
                currentTab === 'jamb_utme' ? 'text-[#0F294A] font-semibold' : ''
              }`}
            >
              JAMB UTME
            </button>
            <button
              onClick={() => handleNavClick('post_utme')}
              className={`transition-colors whitespace-nowrap hover:text-[#0F294A] ${
                currentTab === 'post_utme' ? 'text-[#0F294A] font-semibold' : ''
              }`}
            >
              Post-UTME
            </button>
            <button
              onClick={() => handleNavClick('syllabus_novel')}
              className={`transition-colors whitespace-nowrap hover:text-[#0F294A] ${
                currentTab === 'syllabus_novel' ? 'text-[#0F294A] font-semibold' : ''
              }`}
            >
              Syllabus & Novels
            </button>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onOpenSubjectCombinations}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Brochure Guide
            </button>

            <button
              onClick={() => handleNavClick('all_resources')}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Browse Past Questions
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('jamb_utme')}
              className="text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              JAMB UTME Past Questions
            </button>
            <button
              onClick={() => handleNavClick('post_utme')}
              className="text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Post-UTME Past Questions
            </button>
            <button
              onClick={() => handleNavClick('syllabus_novel')}
              className="text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Syllabus & Novel Guides
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSubjectCombinations();
              }}
              className="text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Subject Combination Finder
            </button>
          </nav>

          <div className="pt-2">
            <button
              onClick={() => handleNavClick('all_resources')}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              Browse All Past Questions
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
