import { useState } from 'react';
import { MessageCircle, X, Send, HelpCircle, CheckCircle2 } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  // wa.me requires the Nigerian number without the leading zero.
  phoneNumber = '2349162193327',
  defaultMessage = 'Hello EduJAMB, I need assistance with JAMB / Post-UTME past questions.'
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const quickQuestions = [
    'I want to purchase UNILAG Post-UTME Past Questions',
    'I need help choosing my 4 JAMB Subject Combinations',
    'How will I receive the past questions after payment?',
    'Do you have past questions for my university screening?'
  ];

  const handleSendMessage = (messageText: string) => {
    const encoded = encodeURIComponent(messageText || defaultMessage);
    const url = `https://wa.me/${phoneNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Tooltip hint on hover (desktop) */}
        {!isOpen && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-[#0F294A] text-white text-xs font-medium rounded-full shadow-lg border border-slate-700 pointer-events-none transition-all animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Need Help? Chat on WhatsApp</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          aria-label="WhatsApp Student Support"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                1
              </span>
            </>
          )}
        </button>
      </div>

      {/* WhatsApp Interactive Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-90 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-[#0F294A] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F294A]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">EduJAMB Student Desk</h4>
                  <p className="text-[11px] text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online · Typically replies in 5 mins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-slate-50 text-slate-800 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <p className="font-medium text-slate-900">👋 Welcome to EduJAMB Support!</p>
              <p className="text-slate-600 leading-relaxed">
                Have questions about Post-UTME questions, downloading your syllabus, or payment? Tap a quick option below or chat directly.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Frequent Inquiries
              </p>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{q}</span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customMsg.trim()) {
                      handleSendMessage(customMsg);
                    }
                  }}
                  className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                />
                <button
                  onClick={() => handleSendMessage(customMsg || defaultMessage)}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0"
                  aria-label="Send WhatsApp Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Official EduJAMB WhatsApp Helpline</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
