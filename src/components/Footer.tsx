import { BookOpen, MessageCircle, Shield, Award, Mail, Phone } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onOpenCalculator: () => void;
  onOpenSubjectCombinations: () => void;
  onNavigateAdmin?: () => void;
}

export function Footer({ onSelectCategory, onOpenCalculator, onOpenSubjectCombinations, onNavigateAdmin }: FooterProps) {
  return (
    <footer className="bg-[#061126] text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0F294A] flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                Edu<span className="text-orange-500">JAMB</span>
              </span>
            </div>
            
            <p className="text-slate-400 leading-relaxed pr-6 max-w-sm">
              Nigeria's trusted repository for verified JAMB UTME past questions, 
              university Post-UTME aptitude screening test papers, syllabus summaries, 
              and cut-off score calculators.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <a
                href="https://wa.me/2349162193327"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Helpline: +234 916 219 3327</span>
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Examination Resources
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => onSelectCategory('post_utme')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Post-UTME Past Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('jamb_utme')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  JAMB UTME Past Papers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('syllabus_novel')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  JAMB Prescribed Reading Novels
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('formula_sheet')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Sciences Formula Booklets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('bundle')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Medicine & Law Bundles
                </button>
              </li>
            </ul>
          </div>

          {/* Student Admission Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Student Admission Tools
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={onOpenCalculator}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Aggregate Score Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSubjectCombinations}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  JAMB Subject Combination Finder
                </button>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-left">
                  UNILAG 50/30/20 Formula Guide
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-left">
                  Departmental Cut-Off Projections
                </span>
              </li>
            </ul>
          </div>

          {/* Universities Covered */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Screening Portals
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              UNILAG Akoka, University of Ibadan (UI), Obafemi Awolowo University (OAU), UNN Nsukka, ABU Zaria, UNIBEN, LASU Ojo, UNILORIN, FUTO.
            </p>
            <div className="pt-2 text-[10px] text-slate-500">
              Updated for 2026/2027 Academic Sessions
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EduJAMB Academic Services. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span>Sitemap</span>
            <span>Privacy Policy</span>
            <span>Terms of Study Resource Access</span>
            {onNavigateAdmin ? (
              <button
                onClick={onNavigateAdmin}
                className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                title="Staff Portal (/admin)"
              >
                Staff Portal
              </button>
            ) : (
              <a
                href="/admin"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                title="Staff Portal (/admin)"
              >
                Staff Portal
              </a>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
