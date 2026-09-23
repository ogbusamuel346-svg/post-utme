import { useState } from 'react';
import { Resource } from '../types';
import { X, Download, Star, CheckCircle, FileText, Share2, MessageCircle, BookOpen, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Copy, Check } from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  onDownloaded?: (id: string) => void;
}

export function ResourceDetailModal({ resource, onClose, onDownloaded }: ResourceDetailModalProps) {
  if (!resource) return null;

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<'details' | 'checkout' | 'success'>('details');

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    try {
      const fileUrl = resource.fileUrl?.trim();
      if (!fileUrl) {
        throw new Error('This resource does not have an uploaded file attached yet.');
      }

      // Fetch the actual uploaded file so the browser downloads its original
      // bytes and extension instead of creating a generated text file.
      let downloadUrl = fileUrl;
      let revokeDownloadUrl = false;
      let contentType = '';

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`The uploaded file could not be fetched (${response.status}).`);
        }
        const fileBlob = await response.blob();
        contentType = fileBlob.type;
        downloadUrl = URL.createObjectURL(fileBlob);
        revokeDownloadUrl = true;
      } catch (fetchError) {
        // Some manually supplied third-party links do not allow CORS fetches.
        // Let the browser open/download that real URL directly as a fallback.
        if (!/^https?:\/\//i.test(fileUrl) && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:')) {
          throw fetchError;
        }
      }

      const parsedUrl = (() => {
        try {
          return new URL(fileUrl, window.location.href);
        } catch {
          return null;
        }
      })();
      const pathName = parsedUrl?.pathname || fileUrl;
      const originalName = decodeURIComponent(pathName.split('/').pop() || '').split('?')[0];
      const hasExtension = /\.[a-z0-9]{2,5}$/i.test(originalName);
      const extension = contentType.includes('word')
        ? '.docx'
        : contentType.includes('text')
          ? '.txt'
          : '.pdf';
      const downloadName = hasExtension
        ? originalName
        : `${resource.slug || 'edujamb-resource'}${extension}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (revokeDownloadUrl) {
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
      }

      await supabaseService.recordDownload(resource.id);
      if (onDownloaded) onDownloaded(resource.id);
      setDownloadSuccess(true);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The uploaded file could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const text = encodeURIComponent(
      `Hello EduJAMB, I would like to order the verified past questions: "${resource.title}" (${resource.institution || 'UTME'}) - Price: ₦${resource.price.toLocaleString()}. Please provide payment instructions and delivery details.`
    );
    window.open(`https://wa.me/2349162193327?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `?resource=${resource.slug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const simulateOnlinePayment = () => {
    setDownloading(true);
    setTimeout(async () => {
      setPurchaseMode('success');
      handleDownload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      {/* Modal Dialog */}
      <div 
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{resource.institution || 'JAMB Past Papers'}</span>
            <span aria-hidden="true">·</span>
            <span>{resource.yearRange}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy link to resource"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">

          {/* Top Section: Cover & Key Buying Decisions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Book Cover Visual */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-xs aspect-3/4 rounded-xl overflow-hidden border border-slate-300 shadow-xl bg-slate-100 relative">
                {resource.coverUrl ? (
                  <img
                    src={resource.coverUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0F294A] to-[#1E3A8A] text-white text-center">
                    <BookOpen className="w-16 h-16 text-orange-400 mb-3" />
                    <p className="font-bold text-base">{resource.title}</p>
                  </div>
                )}
                
                {resource.isFree && (
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md">
                    FREE ACCESS
                  </div>
                )}
              </div>

              {/* File Specs Unboxed Text */}
              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
                <span>{resource.fileSize}</span>
                <span aria-hidden="true">·</span>
                <span>{resource.pageCount} Pages</span>
                <span aria-hidden="true">·</span>
                <span>{resource.format}</span>
              </div>
            </div>

            {/* Title, Pricing & CTAs */}
            <div className="md:col-span-7 space-y-5">
              
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-orange-600">
                  {resource.subject || 'Verified Syllabus'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1 leading-tight">
                  {resource.title}
                </h1>
              </div>

              {/* Ratings & Downloads */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold tabular-nums">{resource.rating.toFixed(1)}</span>
                  <span className="text-amber-700">({resource.reviewCount} student reviews)</span>
                </div>
                <span className="text-slate-500 tabular-nums">
                  {resource.downloadsCount.toLocaleString()} successful downloads
                </span>
              </div>

              {/* Price Banner */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Study Material Price</p>
                  <p className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tabular-nums mt-0.5">
                    {resource.isFree ? (
                      <span className="text-emerald-700">100% Free</span>
                    ) : (
                      <>
                        <span>₦{resource.price.toLocaleString()}</span>
                        <span className="text-xs font-normal text-slate-400 ml-2">One-time payment</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified CBT Format</span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-3 pt-2">
                {resource.isFree ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Download className="w-5 h-5" />
                    <span>{downloading ? 'Downloading Uploaded File...' : 'Download Free Past Questions'}</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={simulateOnlinePayment}
                      disabled={downloading}
                      className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      <Download className="w-4 h-4 text-orange-400" />
                      <span>{downloading ? 'Processing...' : 'Instant Download (₦' + resource.price.toLocaleString() + ')'}</span>
                    </button>
                    
                    <button
                      onClick={handleWhatsAppOrder}
                      className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order on WhatsApp</span>
                    </button>
                  </div>
                )}

                {downloadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Download started! Check your browser downloads folder for the uploaded material.</span>
                  </div>
                )}

                {downloadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 text-center">
                  Instant mobile access · Printable PDF document · Complete answers & rationale
                </p>
              </div>

            </div>

          </div>

          {/* Description & Detailed Features */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 font-display">
              About This Resource
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {resource.description}
            </p>

            {/* Key Features Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {resource.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <CheckCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Questions & Step-by-Step Solutions */}
          {resource.sampleQuestions && resource.sampleQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Sample Exam Questions & Verified Solutions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Preview the depth and accuracy of step-by-step solutions included in this handbook.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {resource.sampleQuestions.map((q, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900">
                        Question #{idx + 1}: {q.question}
                      </span>
                      {expandedFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {expandedFaq === idx && (
                      <div className="p-4 space-y-3 text-xs border-t border-slate-200 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            const isCorrect = opt === q.answer;
                            return (
                              <div
                                key={oi}
                                className={`p-2 rounded-lg border flex items-center gap-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span>{opt}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <p className="font-semibold text-slate-900">Step-by-Step Solution & Working:</p>
                          <p className="text-slate-600 leading-relaxed font-mono text-[11px]">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
