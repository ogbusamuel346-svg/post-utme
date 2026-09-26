import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Heart,
  Home,
  Library,
  LogOut,
  Menu,
  PackageOpen,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
  PlayCircle,
  Video
} from 'lucide-react';
import { Resource } from '../types';
import { ResourceCard } from './ResourceCard';
import { recoverPayment } from '../services/paystack';
import { getPurchaseHistory, PURCHASES_UPDATED_EVENT, syncPurchaseHistory } from '../services/userDashboard';
import type { LocalPurchase } from '../services/userDashboard';
import { BRAND_LOGO_URL, BRAND_NAME } from '../config/branding';

type DashboardSection = 'dashboard' | 'materials' | 'browse' | 'saved' | 'profile' | 'settings';

interface UserDashboardProps {
  user: User | null;
  resources: Resource[];
  savedIds: string[];
  onToggleSaved: (resource: Resource) => void;
  onSelectResource: (resource: Resource) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNavigateHome: () => void;
  onLogout: () => Promise<void>;
}

export function UserDashboard({
  user,
  resources,
  savedIds,
  onToggleSaved,
  onSelectResource,
  onOpenAuth,
  onOpenProfile,
  onNavigateHome,
  onLogout
}: UserDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [purchases, setPurchases] = useState<LocalPurchase[]>([]);
  const [isSyncingPurchases, setIsSyncingPurchases] = useState(false);
  const [purchaseSyncError, setPurchaseSyncError] = useState<string | null>(null);
  const [downloadingReference, setDownloadingReference] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [watchingPurchase, setWatchingPurchase] = useState<{ purchase: LocalPurchase; url: string } | null>(null);

  const refreshPurchases = useCallback(async () => {
    if (!user?.email) {
      setPurchases([]);
      setPurchaseSyncError(null);
      return;
    }

    setIsSyncingPurchases(true);
    setPurchaseSyncError(null);
    try {
      setPurchases(await syncPurchaseHistory(user.email));
    } catch (error) {
      setPurchases(getPurchaseHistory(user.email));
      setPurchaseSyncError(error instanceof Error ? error.message : 'Your verified purchases could not be loaded.');
    } finally {
      setIsSyncingPurchases(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void refreshPurchases();

    const handlePurchaseUpdate = (event: Event) => {
      const purchase = (event as CustomEvent<LocalPurchase>).detail;
      if (user?.email && purchase?.email?.trim().toLowerCase() === user.email.trim().toLowerCase()) {
        setPurchases(getPurchaseHistory(user.email));
      }
    };

    window.addEventListener(PURCHASES_UPDATED_EVENT, handlePurchaseUpdate);
    return () => window.removeEventListener(PURCHASES_UPDATED_EVENT, handlePurchaseUpdate);
  }, [refreshPurchases, user?.email]);

  const savedResources = useMemo(
    () => resources.filter(resource => savedIds.includes(resource.id)),
    [resources, savedIds]
  );

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Student';
  const firstName = displayName.split(' ')[0] || 'Student';

  const navigateTo = (section: DashboardSection) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    setDownloadError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchaseDownload = async (purchase: LocalPurchase) => {
    setDownloadingReference(purchase.reference);
    setDownloadError(null);

    try {
      const result = await recoverPayment(purchase.reference, purchase.email);
      if (!('fileUrl' in result) || !result.fileUrl) {
        throw new Error(('message' in result && result.message) || 'Payment is still being confirmed. Please try again shortly.');
      }

      let downloadUrl = result.fileUrl;
      let revokeUrl = false;
      let contentType = '';

      try {
        const response = await fetch(result.fileUrl);
        if (!response.ok) throw new Error(`The material could not be fetched (${response.status}).`);
        const blob = await response.blob();
        contentType = blob.type;
        downloadUrl = URL.createObjectURL(blob);
        revokeUrl = true;
      } catch (fetchError) {
        if (!/^https?:\/\//i.test(result.fileUrl)) throw fetchError;
      }

      const extension = contentType.includes('video/')
        ? `.${contentType.split('/')[1]?.split(';')[0] || 'mp4'}`
        : contentType.includes('word') ? '.docx' : contentType.includes('text') ? '.txt' : '.pdf';
      const safeTitle = result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sam-edu-hub-material';
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeTitle}${extension}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (revokeUrl) window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The material could not be downloaded.');
    } finally {
      setDownloadingReference(null);
    }
  };

  const handlePurchaseWatch = async (purchase: LocalPurchase) => {
    setDownloadingReference(purchase.reference);
    setDownloadError(null);

    try {
      const result = await recoverPayment(purchase.reference, purchase.email);
      if (!('fileUrl' in result) || !result.fileUrl) {
        throw new Error(('message' in result && result.message) || 'Payment is still being confirmed. Please try again shortly.');
      }
      if (result.mediaType !== 'video') {
        throw new Error('This purchase is a document. Use Download to open it.');
      }
      setWatchingPurchase({ purchase, url: result.fileUrl });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The video could not be opened.');
    } finally {
      setDownloadingReference(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F294A] text-white">
            <UserRound className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Your student dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Sign in to manage saved materials, purchases, and your personal profile.</p>
          <button onClick={onOpenAuth} className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700">
            Sign in or create an account
          </button>
          <button onClick={onNavigateHome} className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-900">
            Back to Sam Edu Hub
          </button>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: DashboardSection; label: string; icon: typeof Home }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'materials', label: 'My Materials', icon: Library },
    { id: 'browse', label: 'Browse Materials', icon: ShoppingBag },
    { id: 'saved', label: 'Saved Materials', icon: Heart },
    { id: 'profile', label: 'My Profile', icon: UserRound },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-[#061126] text-white">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={onNavigateHome} className="flex items-center gap-2.5 text-left">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src={BRAND_LOGO_URL} alt={`${BRAND_NAME} logo`} className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold">Sam <span className="text-orange-400">Edu Hub</span></span>
          </button>

          <div className="flex items-center gap-3">
            <button onClick={onNavigateHome} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white sm:flex">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </button>
            <div className="hidden items-center gap-2 border-l border-slate-700 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="max-w-32 truncate text-xs font-semibold text-slate-200">{displayName}</span>
            </div>
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 sm:hidden" aria-label="Toggle dashboard navigation">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className={`${mobileNavOpen ? 'block' : 'hidden'} fixed inset-x-4 top-20 z-30 sm:static sm:block sm:w-60 sm:shrink-0`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:sticky sm:top-24">
            <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Student area</p>
            <nav className="space-y-1">
              {navItems.slice(0, 4).map(item => <DashboardNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => navigateTo(item.id)} />)}
              <div className="my-3 border-t border-slate-100" />
              {navItems.slice(4).map(item => <DashboardNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => navigateTo(item.id)} />)}
              <button onClick={onLogout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Student dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{sectionTitle(activeSection)}</h1>
            </div>
            <button onClick={() => navigateTo('browse')} className="flex w-fit items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700">
              <Search className="h-4 w-4" /> Browse materials
            </button>
          </div>

          {activeSection === 'dashboard' && (
            <DashboardOverview
              firstName={firstName}
              purchaseCount={purchases.length}
              savedCount={savedResources.length}
              resourceCount={resources.length}
              onNavigate={navigateTo}
              featuredResource={resources[0]}
              onSelectResource={onSelectResource}
            />
          )}

          {activeSection === 'materials' && (
            <section className="space-y-4">
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Verified purchase history</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Purchases made with this account email are synced automatically after payment verification.</p>
                </div>
                <button onClick={() => void refreshPurchases()} disabled={isSyncingPurchases} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                  {isSyncingPurchases ? 'Checking...' : 'Refresh purchases'}
                </button>
              </div>
              {purchaseSyncError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{purchaseSyncError} Your locally saved purchases are still available below.</div>}
              {downloadError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{downloadError}</div>}
              {purchases.length === 0 ? (
                <EmptyState icon={PackageOpen} title="No purchased materials yet" description="Your successful Paystack purchases will appear here for quick recovery and download." actionLabel="Browse materials" onAction={() => navigateTo('browse')} />
              ) : (
                purchases.map(purchase => (
                  <div key={purchase.reference} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">{purchase.mediaType === 'video' ? <Video className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}</div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{purchase.title}</h2>
                        <p className="mt-1 text-xs text-slate-500">{purchase.mediaType === 'video' ? 'Video' : 'Document'} · Purchased {formatDate(purchase.purchasedAt)} · Reference {purchase.reference}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {purchase.mediaType === 'video' && (
                        <button onClick={() => void handlePurchaseWatch(purchase)} disabled={downloadingReference === purchase.reference} className="flex items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-100 disabled:bg-slate-100">
                          <PlayCircle className="h-4 w-4" /> {downloadingReference === purchase.reference ? 'Preparing...' : 'Watch online'}
                        </button>
                      )}
                      <button onClick={() => void handlePurchaseDownload(purchase)} disabled={downloadingReference === purchase.reference} className="flex items-center justify-center gap-2 rounded-lg bg-[#0F294A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123761] disabled:bg-slate-400">
                        <Download className="h-4 w-4" /> {downloadingReference === purchase.reference ? 'Preparing...' : purchase.mediaType === 'video' ? 'Download video' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {activeSection === 'browse' && <ResourceGrid resources={resources} savedIds={savedIds} onSelectResource={onSelectResource} onToggleSaved={onToggleSaved} />}
          {activeSection === 'saved' && (
            savedResources.length > 0
              ? <ResourceGrid resources={savedResources} savedIds={savedIds} onSelectResource={onSelectResource} onToggleSaved={onToggleSaved} />
              : <EmptyState icon={Heart} title="No saved materials yet" description="Tap the heart on any material you want to keep for later." actionLabel="Browse materials" onAction={() => navigateTo('browse')} />
          )}
          {activeSection === 'profile' && <ProfileSection user={user} onOpenProfile={onOpenProfile} />}
          {activeSection === 'settings' && <SettingsSection user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />}
        </main>
      </div>
      {watchingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setWatchingPurchase(null)}>
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">Purchased video</p>
                <h2 className="mt-1 text-base font-bold text-white">{watchingPurchase.purchase.title}</h2>
              </div>
              <button type="button" onClick={() => setWatchingPurchase(null)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close video player">
                <X className="h-5 w-5" />
              </button>
            </div>
            <video src={watchingPurchase.url} controls autoPlay playsInline className="max-h-[70vh] w-full rounded-xl bg-black">
              Your browser does not support embedded video playback.
            </video>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => void handlePurchaseDownload(watchingPurchase.purchase)} disabled={downloadingReference === watchingPurchase.purchase.reference} className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:bg-slate-500">
                <Download className="h-4 w-4" /> {downloadingReference === watchingPurchase.purchase.reference ? 'Preparing...' : 'Download video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardNavButton({ item, active, onClick }: { item: { label: string; icon: typeof Home }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-[#0F294A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <Icon className="h-4 w-4" /> {item.label}
    </button>
  );
}

function DashboardOverview({ firstName, purchaseCount, savedCount, resourceCount, onNavigate, featuredResource, onSelectResource }: { firstName: string; purchaseCount: number; savedCount: number; resourceCount: number; onNavigate: (section: DashboardSection) => void; featuredResource?: Resource; onSelectResource: (resource: Resource) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0F294A] to-[#1E3A8A] p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Welcome back</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Keep your admission preparation moving, {firstName}.</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Access your purchases, save important past questions, and discover verified materials for your next exam.</p>
        <button onClick={() => onNavigate('browse')} className="mt-5 rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-400">Explore materials</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Library} label="My Materials" value={purchaseCount} onClick={() => onNavigate('materials')} />
        <StatCard icon={Heart} label="Saved Materials" value={savedCount} onClick={() => onNavigate('saved')} />
        <StatCard icon={ShoppingBag} label="Available Materials" value={resourceCount} onClick={() => onNavigate('browse')} />
      </div>

      {featuredResource && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Recommended study material</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{featuredResource.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{featuredResource.institution || 'JAMB General'} · {featuredResource.format}</p>
            </div>
            <button onClick={() => onSelectResource(featuredResource)} className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">View</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, onClick }: { icon: typeof Library; label: string; value: number; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"><Icon className="h-5 w-5 text-orange-600" /><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></button>;
}

function ResourceGrid({ resources, savedIds, onSelectResource, onToggleSaved }: { resources: Resource[]; savedIds: string[]; onSelectResource: (resource: Resource) => void; onToggleSaved: (resource: Resource) => void }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{resources.map(resource => <ResourceCard key={resource.id} resource={resource} onSelect={onSelectResource} isSaved={savedIds.includes(resource.id)} onToggleSaved={onToggleSaved} />)}</div>;
}

function ProfileSection({ user, onOpenProfile }: { user: User; onOpenProfile: () => void }) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Student';
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0F294A] text-xl font-bold text-white">{name.slice(0, 1).toUpperCase()}</div><div><h2 className="text-lg font-bold text-slate-900">{name}</h2><p className="text-sm text-slate-500">{user.email}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><InfoItem label="Phone" value={user.user_metadata?.phone || 'Not added'} /><InfoItem label="Target institution" value={user.user_metadata?.institution || 'Not added'} /></div><button onClick={onOpenProfile} className="mt-6 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700">Edit profile</button></div>;
}

function SettingsSection({ user, onOpenProfile, onLogout }: { user: User; onOpenProfile: () => void; onLogout: () => Promise<void> }) {
  return <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-base font-bold text-slate-900">Account settings</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Your account uses Supabase Auth. Email/password credentials and profile metadata are kept securely with your account.</p><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-700">Signed-in email</p><p className="mt-1 text-sm text-slate-900">{user.email}</p></div><button onClick={onOpenProfile} className="mt-5 rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Manage profile</button></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="text-base font-bold text-rose-900">Sign out</h2><p className="mt-1 text-xs text-rose-700">Sign out from this device after using your dashboard.</p><button onClick={onLogout} className="mt-4 flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700"><LogOut className="h-4 w-4" /> Logout</button></div></div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: { icon: typeof Heart; title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p><button onClick={onAction} className="mt-5 rounded-lg bg-[#0F294A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#123761]">{actionLabel}</button></div>;
}

function sectionTitle(section: DashboardSection): string {
  return {
    dashboard: 'Dashboard',
    materials: 'My Materials',
    browse: 'Browse Materials',
    saved: 'Saved Materials',
    profile: 'My Profile',
    settings: 'Settings'
  }[section];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
