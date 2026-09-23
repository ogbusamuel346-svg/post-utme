import { useState } from 'react';
import { X, Search, BookOpen, CheckCircle, GraduationCap, AlertCircle } from 'lucide-react';
import { JAMB_COURSES_DATA } from '../data/initialResources';

interface SubjectCombinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResourceSubject?: (subject: string) => void;
}

export function SubjectCombinationModal({ isOpen, onClose, onSelectResourceSubject }: SubjectCombinationModalProps) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(JAMB_COURSES_DATA[0]);

  const filtered = JAMB_COURSES_DATA.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.faculty.toLowerCase().includes(query.toLowerCase()) ||
      c.jambSubjects.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F294A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">JAMB Subject Combination Directory</h3>
              <p className="text-xs text-slate-300">Official brochure requirements for Nigerian universities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search course (e.g., Medicine, Law, Computer Science, Nursing)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Quick Course Pills / Selection */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Course</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {filtered.map((course) => (
                <button
                  key={course.name}
                  onClick={() => setSelectedCourse(course)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedCourse.name === course.name
                      ? 'bg-[#0F294A] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {course.name}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Course Specification Card */}
          {selectedCourse && (
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  {selectedCourse.faculty}
                </span>
                <h4 className="text-xl font-bold text-slate-900 font-display mt-0.5">
                  {selectedCourse.name}
                </h4>
              </div>

              {/* 4 Compulsory Subjects */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span>The 4 Compulsory JAMB UTME Subjects:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourse.jambSubjects.map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-orange-50/60 border border-orange-200/80 rounded-lg text-xs font-semibold text-orange-950">
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* O-Level Requirements */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-900">WAEC / NECO O'Level Requirements:</p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedCourse.oLevelReqs}
                </p>
              </div>

              {/* Competitive Cut-off Projection */}
              <div className="flex items-center justify-between p-3 bg-[#0F294A] text-white rounded-lg">
                <span className="text-xs font-medium text-slate-300">Competitive JAMB Cut-off Target:</span>
                <span className="text-sm font-bold text-orange-400 font-mono tabular-nums">
                  {selectedCourse.competitiveCutoff}
                </span>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Always verify special waivers in the official JAMB IBASS brochure if applying to State or Private universities.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
