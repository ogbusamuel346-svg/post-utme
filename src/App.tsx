import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Resource, ResourceCategory, FilterState } from './types';
import { supabaseService } from './services/supabase';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { AggregateCalculatorModal } from './components/AggregateCalculatorModal';
import { SubjectCombinationModal } from './components/SubjectCombinationModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { UserAuthModal } from './components/UserAuthModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Footer } from './components/Footer';
import { SEOHead } from './components/SEOHead';
import { INSTITUTIONS_LIST } from './data/initialResources';
import { 
  Search, Filter, BookOpen, Calculator, GraduationCap, 
  CheckCircle, ArrowRight, Star, Download, ChevronRight,
  ShieldCheck, HelpCircle, Sparkles, AlertCircle, Loader2
} from 'lucide-react';

const checkIsAdminPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    path === '/admin' || 
    path.startsWith('/admin/') || 
    hash === '#/admin' || 
    hash.startsWith('#/admin') ||
    params.get('view') === 'admin'
  );
};

export default function App() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  
  // Navigation & Route states
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminPath());
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [activeNavTab, setActiveNavTab] = useState<string>('home');

  // Modals
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSubjectCombinationOpen, setIsSubjectCombinationOpen] = useState(false);
  const [isUserAuthOpen, setIsUserAuthOpen] = useState(false);

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    category: 'all',
    institution: 'All Institutions',
    subject: 'All Subjects',
    priceFilter: 'all',
    sortBy: 'popular'
  });

  // Load resources from Supabase / Local Storage
  const loadResources = async () => {
    setLoading(true);
    const data = await supabaseService.fetchResources();
    setResources(data);
    setSupabaseConnected(supabaseService.getConfig().connected);
    setLoading(false);
  };

  // URL route change listener
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    let isMounted = true;
    supabaseService.getSession().then((session) => {
      if (isMounted) {
        setAdminUser(session?.user || null);
        setAuthChecking(false);
      }
    });

    const { data: authListener } = supabaseService.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAdminUser(session?.user || null);
        setAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    loadResources();

    // Check URL parameters for direct resource link
    const params = new URLSearchParams(window.location.search);
    const resourceSlug = params.get('resource');

    if (resourceSlug) {
      supabaseService.fetchResources().then(resList => {
        const found = resList.find(r => r.slug === resourceSlug || r.id === resourceSlug);
        if (found) setSelectedResource(found);
      });
    }
  }, []);

  const handleBackToSite = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    setActiveNavTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminSignOut = async () => {
    await supabaseService.signOut();
    setAdminUser(null);
  };

  // Filter logic
  const filteredResources = resources.filter((item) => {
    // Search
    if (filterState.search.trim()) {
      const q = filterState.search.toLowerCase();
      const match = 
        item.title.toLowerCase().includes(q) ||
        (item.institution && item.institution.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category
    if (filterState.category !== 'all' && item.category !== filterState.category) {
      return false;
    }

    // Institution
    if (filterState.institution !== 'All Institutions' && item.institution !== filterState.institution) {
      return false;
    }

    // Price
    if (filterState.priceFilter === 'free' && !item.isFree) return false;
    if (filterState.priceFilter === 'paid' && item.isFree) return false;

    return true;
  });

  // Dynamic institutions list combining defaults with all typed institutions in resources
  const availableInstitutions = Array.from(
    new Set([
      'All Institutions',
      'JAMB General',
      ...resources.map(r => r.institution?.trim()).filter(Boolean) as string[],
      ...INSTITUTIONS_LIST.filter(i => i !== 'All Institutions' && i !== 'JAMB General')
    ])
  );

  // Sorting
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (filterState.sortBy === 'popular') return (b.downloadsCount || 0) - (a.downloadsCount || 0);
    if (filterState.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filterState.sortBy === 'price_asc') return a.price - b.price;
    if (filterState.sortBy === 'price_desc') return b.price - a.price;
    if (filterState.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const handleNavSelect = (tab: string) => {
    setActiveNavTab(tab);
    if (tab === 'post_utme') {
      setFilterState(prev => ({ ...prev, category: 'post_utme', search: '' }));
    } else if (tab === 'jamb_utme') {
      setFilterState(prev => ({ ...prev, category: 'jamb_utme', search: '' }));
    } else if (tab === 'syllabus_novel') {
      setFilterState(prev => ({ ...prev, category: 'syllabus_novel', search: '' }));
    } else if (tab === 'all_resources') {
      setFilterState(prev => ({ ...prev, category: 'all', search: '' }));
    } else if (tab === 'home') {
      setFilterState(prev => ({ ...prev, category: 'all', search: '', institution: 'All Institutions' }));
    }
  };

  const handleSearchFromHero = (query: string) => {
    setFilterState(prev => ({ ...prev, search: query, category: 'all' }));
    const target = document.getElementById('catalog-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryFromHero = (category: string) => {
    setFilterState(prev => ({ ...prev, category: category as any }));
    const target = document.getElementById('catalog-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUniversityQuickFilter = (university: string) => {
    setFilterState(prev => ({
      ...prev,
      category: 'post_utme',
      institution: university,
      search: ''
    }));
    const target = document.getElementById('catalog-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Sam Edu Hub',
    'url': 'https://edujamb.ng',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://edujamb.ng/?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <SEOHead structuredData={structuredData} />

      {/* Admin Route Guard or Main Site */}
      {isAdminRoute ? (
        authChecking ? (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40 animate-pulse">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Verifying Supabase administrative session...</span>
              </div>
            </div>
          </div>
        ) : !adminUser || adminUser.user_metadata?.role === 'student' ? (
          <AdminLogin
            onLoginSuccess={(user) => setAdminUser(user)}
            onBackToSite={handleBackToSite}
          />
        ) : (
          <AdminDashboard
            resources={resources}
            onRefresh={loadResources}
            onBackToSite={handleBackToSite}
            onOpenResource={(res) => setSelectedResource(res)}
            currentUser={adminUser}
            onSignOut={handleAdminSignOut}
          />
        )
      ) : (
        <>
          {/* Public Top Navbar */}
          <Navbar
            currentTab={activeNavTab}
            onSelectTab={handleNavSelect}
            onOpenSubjectCombinations={() => setIsSubjectCombinationOpen(true)}
            supabaseConnected={supabaseConnected}
            user={adminUser}
            onOpenAuth={() => setIsUserAuthOpen(true)}
          />

          <main className="flex-1">
          
          {/* Hero Section */}
          <HeroSection
            onSearch={handleSearchFromHero}
            onSelectCategory={handleCategoryFromHero}
          />

          {/* Quick University Post-UTME Selector Strip */}
          <section className="bg-white border-b border-slate-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Post-UTME Past Questions by Top Nigerian Universities
                  </h2>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    Select your target institution for direct verified screening papers
                  </p>
                </div>
                
                {/* Clean unboxed interactive links */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {['University of Lagos (UNILAG)', 'University of Ibadan (UI)', 'Obafemi Awolowo University (OAU)', 'University of Nigeria Nsukka (UNN)'].map((uni) => (
                    <button
                      key={uni}
                      onClick={() => handleUniversityQuickFilter(uni)}
                      className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                        filterState.institution === uni 
                          ? 'bg-[#0F294A] text-white border-[#0F294A]' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {uni.split('(')[1]?.replace(')', '') || uni}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Student Tools Callout Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tool 1: Aggregate Calculator */}
              <div 
                onClick={() => setIsCalculatorOpen(true)}
                className="group bg-gradient-to-br from-[#0F294A] to-[#1E3A8A] text-white p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200 flex items-center justify-between"
              >
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold uppercase tracking-wider">
                    <Calculator className="w-4 h-4" />
                    <span>Free Admission Calculator</span>
                  </div>
                  <h3 className="text-lg font-bold font-display group-hover:text-orange-300 transition-colors">
                    Calculate Your JAMB & Post-UTME Aggregate Score
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Check your admission chances using UNILAG 50/30/20 formula or standard UI/OAU 50/50 scoring models.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-orange-500 flex items-center justify-center text-white shrink-0 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Tool 2: Subject Combination */}
              <div 
                onClick={() => setIsSubjectCombinationOpen(true)}
                className="group bg-white border border-slate-200 text-slate-900 p-6 rounded-2xl cursor-pointer hover:border-orange-400 hover:shadow-lg transition-all duration-200 flex items-center justify-between"
              >
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4" />
                    <span>Official JAMB Brochure Guide</span>
                  </div>
                  <h3 className="text-lg font-bold font-display group-hover:text-orange-600 transition-colors">
                    Verify Your 4 Compulsory JAMB Subjects
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Avoid disqualification. Check correct subject combinations for Medicine, Law, Engineering & Accounting.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-slate-700 shrink-0 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

            </div>
          </section>

          {/* Main Resource Catalog Section */}
          <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            
            {/* Catalog Header & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                  Browse Verified Past Questions & Study Materials
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Showing <span className="font-semibold text-slate-800 tabular-nums">{sortedResources.length}</span> verified resources
                  {filterState.search && <span> matching "{filterState.search}"</span>}
                </p>
              </div>

              {/* Reset Filters button if active */}
              {(filterState.search || filterState.category !== 'all' || filterState.institution !== 'All Institutions' || filterState.priceFilter !== 'all') && (
                <button
                  onClick={() => setFilterState({
                    search: '',
                    category: 'all',
                    institution: 'All Institutions',
                    subject: 'All Subjects',
                    priceFilter: 'all',
                    sortBy: 'popular'
                  })}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer self-start md:self-auto"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            {/* Filter Tabs & Selectors */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              
              {/* Category Segmented Controls (Interactive buttons) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Resources' },
                  { id: 'post_utme', label: 'Post-UTME Past Questions' },
                  { id: 'jamb_utme', label: 'JAMB UTME Papers' },
                  { id: 'syllabus_novel', label: 'Syllabus & Novels' },
                  { id: 'formula_sheet', label: 'Formulas' },
                  { id: 'bundle', label: '4-in-1 Bundles' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterState(prev => ({ ...prev, category: tab.id as any }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      filterState.category === tab.id
                        ? 'bg-[#0F294A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Secondary Selectors (Institution, Free/Paid, Sort) */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Institution Dropdown */}
                <select
                  value={filterState.institution}
                  onChange={(e) => setFilterState(prev => ({ ...prev, institution: e.target.value }))}
                  aria-label="Filter by Institution"
                  className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  {availableInstitutions.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>

                {/* Free vs Paid */}
                <select
                  value={filterState.priceFilter}
                  onChange={(e) => setFilterState(prev => ({ ...prev, priceFilter: e.target.value as any }))}
                  aria-label="Filter by Price"
                  className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="all">Free & Paid</option>
                  <option value="free">Free Downloads Only</option>
                  <option value="paid">Premium Packs</option>
                </select>

                {/* Sort By */}
                <select
                  value={filterState.sortBy}
                  onChange={(e) => setFilterState(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  aria-label="Sort past questions"
                  className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Latest Uploads</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

              </div>

            </div>

            {/* Grid of Product Cards */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading verified past questions from Supabase...</p>
              </div>
            ) : sortedResources.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">No Past Papers Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any resources matching your current search criteria. Try selecting "All Categories" or searching a general keyword like "UNILAG" or "English".
                </p>
                <button
                  onClick={() => setFilterState({
                    search: '',
                    category: 'all',
                    institution: 'All Institutions',
                    subject: 'All Subjects',
                    priceFilter: 'all',
                    sortBy: 'popular'
                  })}
                  className="py-2 px-4 bg-[#0F294A] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  View All Resources
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onSelect={(res) => setSelectedResource(res)}
                    onQuickDownload={(res) => setSelectedResource(res)}
                  />
                ))}
              </div>
            )}

          </section>

          {/* Academic Trust & Quality Guarantee Section */}
          <section className="bg-white border-t border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Standard of Excellence
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                  Why Serious JAMBites Choose Sam Edu Hub
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Every past question undergoes multiple verification reviews by university graduate scholars before release.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F294A] flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">100% Verified Answers</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No guesswork or wrong answer keys. Every solution includes detailed workings, formula citations, and explanations that teach the underlying concept.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F294A] flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">CBT Pattern Alignment</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formatted strictly to mirror the computerized testing interface of JAMB, UNILAG, UI, and OAU Post-UTME screening platforms.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F294A] flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Instant Mobile & PDF Access</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Read smoothly on Android, iPhone, tablet, or print as physical revision booklets. No bulky software or complicated logins required.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Student Success Proof Section */}
          <section className="bg-slate-100/70 border-t border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Student Testimonials
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                  From JAMB Aspirants to Matriculated Scholars
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "I scored 312 in JAMB and 26/30 in UNILAG Post-UTME for Medicine. The UNILAG past questions handbook gave me the exact recurring math patterns that appeared on my exam day."
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">Emmanuel Adebayo</p>
                    <p className="text-slate-500 text-[11px]">Admitted into Medicine & Surgery, UNILAG (2025/2026)</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "The UI Post-UTME model answers were a lifesaver. The explanations for the General Paper questions taught me how UI frames trick questions in English and Logic."
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">Chidinma Okonkwo</p>
                    <p className="text-slate-500 text-[11px]">Admitted into Faculty of Law, University of Ibadan</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "I downloaded the free JAMB English past questions and novel summary guide. I got 82 in Use of English alone! The chapter MCQs were spot-on."
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">Ibrahim Suleiman</p>
                    <p className="text-slate-500 text-[11px]">Admitted into Computer Engineering, ABU Zaria</p>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Frequently Asked Questions */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display text-slate-900">
                Frequently Asked Questions by Candidates
              </h2>
              <p className="text-xs text-slate-500">
                Quick answers regarding downloads, university screenings, and syllabus coverage.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900">How do I receive the past questions after downloading?</h4>
                <p className="text-slate-600 leading-relaxed">
                  Downloads start instantly in your web browser. Free materials download immediately as printable study PDFs. For premium packs, you also receive the file directly via WhatsApp or direct download link.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900">Are these the authentic questions used by UNILAG, UI, and OAU?</h4>
                <p className="text-slate-600 leading-relaxed">
                  Yes. Our editorial archive compiles genuine past examination questions gathered from official screening sessions over the past 10 to 15 years, with all mathematical and logical solutions independently verified by subject experts.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900">Can I access these past questions on my mobile phone?</h4>
                <p className="text-slate-600 leading-relaxed">
                  Absolutely. All documents are formatted specifically for easy reading on smartphones (Android and iOS) using any standard PDF reader or Adobe Acrobat, as well as laptops and tablets.
                </p>
              </div>
            </div>
          </section>

        </main>

        {/* Floating WhatsApp Support Button */}
        <WhatsAppButton />

        {/* Footer */}
        <Footer
          onSelectCategory={handleCategoryFromHero}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenSubjectCombinations={() => setIsSubjectCombinationOpen(true)}
          onNavigateAdmin={handleNavigateToAdmin}
        />
      </>
    )}

    {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onDownloaded={(id) => {
          setResources(prev => prev.map(r => r.id === id ? { ...r, downloadsCount: (r.downloadsCount || 0) + 1 } : r));
        }}
      />

      {/* Aggregate Score Calculator Modal */}
      <AggregateCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* JAMB Subject Combination Modal */}
      <SubjectCombinationModal
        isOpen={isSubjectCombinationOpen}
        onClose={() => setIsSubjectCombinationOpen(false)}
        onSelectResourceSubject={(sub) => {
          setIsSubjectCombinationOpen(false);
          setFilterState(prev => ({ ...prev, search: sub, category: 'all' }));
        }}
      />

      <UserAuthModal
        isOpen={isUserAuthOpen}
        user={adminUser}
        onClose={() => setIsUserAuthOpen(false)}
        onAuthenticated={(user) => setAdminUser(user)}
        onSignOut={async () => {
          await handleAdminSignOut();
          setIsUserAuthOpen(false);
        }}
      />

    </div>
  );
}
