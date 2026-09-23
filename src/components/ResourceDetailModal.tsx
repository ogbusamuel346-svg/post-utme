import { useState } from 'react';
import { Resource } from '../types';
import { X, Download, Star, CheckCircle, Share2, MessageCircle, BookOpen, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Check, RotateCcw, Mail } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { initializePayment, openPaystackCheckout, waitForPayment, recoverPayment, getFreeDownload } from '../services/paystack';
import { rememberPurchase } from '../services/userDashboard';

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
  const [buyerEmail, setBuyerEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryReference, setRecoveryReference] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleDownload = async (fileUrlOverride?: string) => {
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    try {
      const fileUrl = (fileUrlOverride || resource.fileUrl)?.trim();
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
        : `${resource.slug || 'sam-edu-hub-resource'}${extension}`;

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
      `Hello Sam Edu Hub, I would like to order the verified past questions: "${resource.title}" (${resource.institution || 'UTME'}) - Price: ₦${resource.price.toLocaleString()}. Please provide payment instructions and delivery details.`
    );
    window.open(`https://wa.me/2349162193327?text=${text}`, '_blank');
  };

  const handleFreeDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);
    try {
      const storedUrl = resource.fileUrl?.trim() || '';
      const isPrivateMaterial = /\/storage\/v1\/object\/(?:public|sign)\/paid-materials\//i.test(storedUrl);
      // Keep local/demo resources and legacy public links usable without the
      // payment API. New private-bucket files use the server grant below.
      if (storedUrl && !isPrivateMaterial) {
        await handleDownload();
        return;
      }
      const grant = await getFreeDownload(resource.id);
      await handleDownload(grant.fileUrl);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The free material could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `?resource=${resource.slug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePaystackPayment = async () => {
    const email = buyerEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDownloadError('Enter a valid email address. We use it to recover your purchase if the network interrupts the download.');
      return;
    }

    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    let paymentReference = '';
    try {
      const initialized = await initializePayment(resource.id, email);
      paymentReference = initialized.reference;
      await openPaystackCheckout(initialized.accessCode);
      const grant = await waitForPayment(initialized.reference, email);
      rememberPurchase({
        reference: grant.reference,
        email,
        title: grant.title,
        productId: grant.productId,
        purchasedAt: new Date().toISOString()
      });
      setPurchaseMode('success');
      await handleDownload(grant.fileUrl);
    } catch (error) {
      if (paymentReference) {
        setRecoveryEmail(email);
        setRecoveryReference(paymentReference);
        setShowRecovery(true);
      }
      setDownloadError(error instanceof Error ? error.message : 'Payment could not be completed.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRecoverPurchase = async () => {
    const email = recoveryEmail.trim().toLowerCase();
    const reference = recoveryReference.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDownloadError('Enter the email address used for the Paystack payment.');
      return;
    }
    if (!reference) {
      setDownloadError('Enter the Paystack payment reference from your receipt.');
      return;
    }

    setRecoveryLoading(true);
    setDownloadError(null);
    setDownloadSuccess(false);
    try {
      const result = await recoverPayment(reference, email);
      if (!('fileUrl' in result) || !result.fileUrl) {
        throw new Error(('message' in result && result.message) || 'This payment is still being confirmed. Please try again shortly.');
      }
      rememberPurchase({
        reference: result.reference,
        email,
        title: result.title,
        productId: result.productId,
        purchasedAt: new Date().toISOString()
      });
      await handleDownload(result.fileUrl);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The previous purchase could not be recovered.');
    } finally {
      setRecoveryLoading(false);
    }
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
                    onClick={handleFreeDownload}
                    disabled={downloading}
                    className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Download className="w-5 h-5" />
                    <span>{downloading ? 'Downloading Uploaded File...' : 'Download Free Past Questions'}</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="buyer-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email for payment receipt and recovery
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="buyer-email"
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handlePaystackPayment}
                      disabled={downloading}
                      className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      <Download className="w-4 h-4 text-orange-400" />
                      <span>{downloading ? 'Confirming payment...' : 'Pay & Download (₦' + resource.price.toLocaleString() + ')'}</span>
                    </button>
                    
                    <button
                      onClick={handleWhatsAppOrder}
                      className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order on WhatsApp</span>
                    </button>
                  </div>

                    <button
                      type="button"
                      onClick={() => setShowRecovery(!showRecovery)}
                      className="mx-auto flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-orange-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {showRecovery ? 'Hide purchase recovery' : 'Already paid? Recover your download'}
                    </button>

                    {showRecovery && (
                      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Recover a previous purchase</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            Enter the same email and the Paystack reference from your receipt. No account or sign-in is required.
                          </p>
                        </div>
                        <input
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="Payment email"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          autoComplete="email"
                        />
                        <input
                          type="text"
                          value={recoveryReference}
                          onChange={(e) => setRecoveryReference(e.target.value)}
                          placeholder="Paystack reference e.g. SEH-..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                        <button
                          type="button"
                          onClick={handleRecoverPurchase}
                          disabled={recoveryLoading || downloading}
                          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-700 disabled:bg-slate-400 cursor-pointer"
                        >
                          {recoveryLoading ? 'Checking payment...' : 'Recover & Download'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {downloadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{purchaseMode === 'success' ? 'Payment confirmed and your uploaded material is downloading.' : 'Download started! Check your browser downloads folder for the uploaded material.'}</span>
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
