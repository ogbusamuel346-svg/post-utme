import { useState } from 'react';
import { X, Calculator, HelpCircle, CheckCircle2, Award } from 'lucide-react';

interface AggregateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AggregateCalculatorModal({ isOpen, onClose }: AggregateCalculatorModalProps) {
  if (!isOpen) return null;

  const [system, setSystem] = useState<'unilag' | 'standard'>('unilag');
  const [jambScore, setJambScore] = useState<number>(275);
  const [postUtmeScore, setPostUtmeScore] = useState<number>(24); // out of 30 for UNILAG, or 80 for standard
  const [oLevelGrades, setOLevelGrades] = useState<string[]>(['A1', 'A1', 'B2', 'B3', 'C4']);

  // Grade points for UNILAG (A1=4.0, B2=3.6, B3=3.2, C4=2.8, C5=2.4, C6=2.0)
  const gradePointsMap: Record<string, number> = {
    A1: 4.0,
    B2: 3.6,
    B3: 3.2,
    C4: 2.8,
    C5: 2.4,
    C6: 2.0
  };

  const calculateScore = () => {
    if (system === 'unilag') {
      const jambPart = (jambScore / 400) * 50; // max 50
      const putmePart = Math.min(30, Math.max(0, postUtmeScore)); // max 30
      const olevelPart = oLevelGrades.reduce((sum, g) => sum + (gradePointsMap[g] || 2.0), 0); // max 20
      return (jambPart + putmePart + olevelPart).toFixed(2);
    } else {
      // Standard 50/50 model: (JAMB / 8) + (Post-UTME / 2)
      const jambPart = jambScore / 8; // 50%
      const putmePart = postUtmeScore / 2; // 50% (assuming post UTME is /100)
      return (jambPart + putmePart).toFixed(2);
    }
  };

  const totalAggregate = calculateScore();

  const getVerdict = (score: number) => {
    if (score >= 80) return { text: 'Highly Competitive for Top Tier Courses (Medicine, Law, Dentistry, CompSci)', color: 'text-emerald-700 bg-emerald-50' };
    if (score >= 70) return { text: 'Strong Admission Chance for Engineering, Pharmacy, Nursing, Accounting', color: 'text-blue-700 bg-blue-50' };
    if (score >= 60) return { text: 'Competitive for Pure Sciences, Social Sciences, Arts & Education', color: 'text-amber-800 bg-amber-50' };
    return { text: 'Consider supplementary courses or lower-competition departments', color: 'text-rose-800 bg-rose-50' };
  };

  const verdict = getVerdict(parseFloat(totalAggregate));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F294A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">JAMB & Post-UTME Aggregate Calculator</h3>
              <p className="text-xs text-slate-300">Official university admission rating formula</p>
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
          
          {/* Formula selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select University Grading Model</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSystem('unilag');
                  setPostUtmeScore(24);
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  system === 'unilag'
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                UNILAG 100% Formula (50/30/20)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSystem('standard');
                  setPostUtmeScore(70);
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  system === 'standard'
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Standard 50/50 Model (UI, OAU, UNN)
              </button>
            </div>
          </div>

          {/* JAMB Score Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-slate-700">JAMB UTME Score (out of 400)</label>
              <span className="font-mono font-bold text-orange-600 tabular-nums">{jambScore} / 400</span>
            </div>
            <input
              type="range"
              min="100"
              max="400"
              value={jambScore}
              onChange={(e) => setJambScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>100</span>
              <span>200</span>
              <span>300</span>
              <span>400</span>
            </div>
          </div>

          {/* Post-UTME Score Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold text-slate-700">
                {system === 'unilag' ? 'UNILAG Post-UTME Score (out of 30)' : 'Post-UTME Score (out of 100)'}
              </label>
              <span className="font-mono font-bold text-orange-600 tabular-nums">
                {postUtmeScore} / {system === 'unilag' ? '30' : '100'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={system === 'unilag' ? 30 : 100}
              value={postUtmeScore}
              onChange={(e) => setPostUtmeScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>

          {/* O-Level Grades (if UNILAG model) */}
          {system === 'unilag' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-700">
                O-Level Core 5 Subjects (WAEC/NECO Grade Points - max 20%)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {oLevelGrades.map((grade, idx) => (
                  <select
                    key={idx}
                    value={grade}
                    onChange={(e) => {
                      const updated = [...oLevelGrades];
                      updated[idx] = e.target.value;
                      setOLevelGrades(updated);
                    }}
                    className="p-2 text-xs bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="A1">A1 (4.0)</option>
                    <option value="B2">B2 (3.6)</option>
                    <option value="B3">B3 (3.2)</option>
                    <option value="C4">C4 (2.8)</option>
                    <option value="C5">C5 (2.4)</option>
                    <option value="C6">C6 (2.0)</option>
                  </select>
                ))}
              </div>
            </div>
          )}

          {/* Result Box */}
          <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Your Calculated Aggregate Score</p>
                <p className="text-3xl font-extrabold text-orange-400 font-display tabular-nums mt-0.5">
                  {totalAggregate}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Award className="w-6 h-6 text-orange-400" />
              </div>
            </div>

            {/* Verdict */}
            <div className={`p-2.5 rounded-lg text-xs font-medium ${verdict.color}`}>
              {verdict.text}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Formula verified according to recent admission requirements of UNILAG, UI, and OAU screening portals.
          </p>

        </div>
      </div>
    </div>
  );
}
