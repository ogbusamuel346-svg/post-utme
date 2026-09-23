import { useState, useRef } from 'react';
import { Resource, ResourceCategory, SupabaseConfig } from '../types';
import { supabaseService } from '../services/supabase';
import coverPostutme from '../assets/images/cover_postutme_unilag_1790125905105.jpg';
import coverJambEnglish from '../assets/images/cover_jamb_english_1790125914520.jpg';
import coverJambSciences from '../assets/images/cover_jamb_sciences_1790125924446.jpg';
import { 
  Plus, Edit2, Trash2, Database, Upload, CheckCircle2, 
  AlertCircle, RefreshCw, Copy, Check, ExternalLink, 
  FileText, Image as ImageIcon, Search, Shield, ArrowLeft,
  DollarSign, Download, BookOpen, Star, LogOut, User as UserIcon
} from 'lucide-react';

interface AdminDashboardProps {
  resources: Resource[];
  onRefresh: () => Promise<void>;
  onBackToSite: () => void;
  onOpenResource: (resource: Resource) => void;
  currentUser?: any;
  onSignOut?: () => void;
}

export function AdminDashboard({ resources, onRefresh, onBackToSite, onOpenResource, currentUser, onSignOut }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'supabase'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ success: boolean; text: string } | null>(null);
  
  // Supabase connection state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(supabaseService.getConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseConfig.anonKey);
  const [connectionStatus, setConnectionStatus] = useState<{ testing: boolean; message?: string; success?: boolean }>({ testing: false });
  const [copiedSql, setCopiedSql] = useState(false);

  // File upload state for form
  const [coverUploading, setCoverUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'post_utme' as ResourceCategory,
    institution: '',
    subject: 'General Paper',
    yearRange: '2015 - 2025 Solved',
    price: 2500,
    isFree: false,
    coverUrl: coverPostutme,
    fileUrl: '',
    fileSize: '7.5 MB',
    pageCount: 140,
    format: 'PDF (Printable & Mobile)',
    description: '',
    featuresText: 'Verified CBT past questions\nStep-by-step verified explanations\nDetailed scoring rubrics\nBonus mock examination'
  });

  // Calculate stats
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloadsCount || 0), 0);
  const totalRevenue = resources.reduce((acc, r) => acc + ((r.downloadsCount || 0) * (r.price || 0)), 0);
  const freeResourcesCount = resources.filter(r => r.isFree).length;

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.institution && r.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.subject && r.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || r.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setEditingResource(null);
    setActionMessage(null);
    setFormData({
      title: '',
      slug: '',
      category: 'post_utme',
      institution: '',
      subject: 'General Paper',
      yearRange: '2015 - 2025 Solved',
      price: 2500,
      isFree: false,
      coverUrl: coverPostutme,
      fileUrl: '',
      fileSize: '7.5 MB',
      pageCount: 140,
      format: 'PDF (Printable & Mobile)',
      description: 'Comprehensive Post-UTME screening questions with step-by-step verified solutions and departmental cut-off requirements.',
      featuresText: 'Verified CBT past questions\nStep-by-step verified explanations\nDetailed scoring rubrics\nBonus mock examination'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (res: Resource) => {
    setEditingResource(res);
    setActionMessage(null);
    setFormData({
      title: res.title,
      slug: res.slug,
      category: res.category,
      institution: res.institution || 'JAMB General',
      subject: res.subject || '',
      yearRange: res.yearRange,
      price: res.price,
      isFree: res.isFree,
      coverUrl: res.coverUrl,
      fileUrl: res.fileUrl || '',
      fileSize: res.fileSize,
      pageCount: res.pageCount,
      format: res.format,
      description: res.description,
      featuresText: res.features.join('\n')
    });
    setIsModalOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const result = await supabaseService.uploadFile(file, 'past-questions');
    if (result.success && result.url) {
      setFormData(prev => ({ ...prev, coverUrl: result.url }));
      setActionMessage(null);
    } else {
      setActionMessage({ success: false, text: result.error || 'Cover upload failed.' });
    }
    setCoverUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    const result = await supabaseService.uploadFile(file, 'past-questions');
    if (result.success && result.url) {
      setFormData(prev => ({ 
        ...prev, 
        fileUrl: result.url,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      setActionMessage(null);
    } else {
      setActionMessage({ success: false, text: result.error || 'Document upload failed.' });
    }
    setFileUploading(false);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    setActionMessage(null);
    try {
      const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const features = formData.featuresText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const resourceToSave: Resource = {
        id: editingResource ? editingResource.id : `res-${Date.now()}`,
        slug,
        title: formData.title.trim(),
        category: formData.category as any,
        institution: formData.institution.trim() || 'JAMB General',
        subject: formData.subject.trim() || 'General Subject',
        yearRange: formData.yearRange.trim() || 'Recent Solved',
        price: formData.isFree ? 0 : Number(formData.price),
        isFree: Boolean(formData.isFree),
        coverUrl: formData.coverUrl.trim() || coverPostutme,
        fileUrl: formData.fileUrl.trim(),
        fileSize: formData.fileSize || '5.0 MB',
        pageCount: Number(formData.pageCount) || 120,
        format: formData.format || 'PDF (Printable & Mobile)',
        description: formData.description || `Comprehensive examination past questions and detailed solutions for ${formData.institution.trim() || 'tertiary screening'}.`,
        features: features.length > 0 ? features : ['Verified past questions', 'Detailed solutions', 'Bonus mock tests'],
        downloadsCount: editingResource ? editingResource.downloadsCount : 0,
        rating: editingResource ? editingResource.rating : 5.0,
        reviewCount: editingResource ? editingResource.reviewCount : 12,
        isFeatured: true,
        sampleQuestions: editingResource?.sampleQuestions || [
          {
            question: `Official screening past question for ${formData.institution || 'JAMB UTME'} (${formData.subject}): What is the primary method of evaluation?`,
            options: ['Direct CBT Exam', 'Screening of O Level', 'Oral Interview', 'Essay Paper'],
            answer: 'Direct CBT Exam',
            explanation: 'Most top universities in Nigeria conduct computer-based aptitude tests to screen candidates scoring above the 200 threshold.'
          }
        ],
        createdAt: editingResource ? editingResource.createdAt : new Date().toISOString()
      };

      const result = await supabaseService.saveResource(resourceToSave);
      if (!result.success) {
        setActionMessage({ success: false, text: result.message || 'The resource could not be published.' });
        return;
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch (err) {
      console.error('Save error:', err);
      setActionMessage({ success: false, text: 'The resource could not be published. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    const result = await supabaseService.deleteResource(id);
    setDeleteConfirmId(null);
    if (!result.success) {
      setActionMessage({
        success: false,
        text: result.message || 'The resource was not deleted from Supabase.'
      });
      return;
    }

    setActionMessage({ success: true, text: 'Resource deleted successfully.' });
    await onRefresh();
  };

  const handleTestConnection = async () => {
    setConnectionStatus({ testing: true });
    const result = await supabaseService.updateConfig(supabaseUrlInput, supabaseKeyInput);
    setSupabaseConfig(supabaseService.getConfig());
    setConnectionStatus({
      testing: false,
      success: result.success,
      message: result.message
    });
    if (result.success) {
      await onRefresh();
    }
  };

  const copySqlToClipboard = () => {
    const sql = supabaseService.getSQLMigrationScript();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToSite}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Return to Student Portal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                    EduJAMB Admin Console
                  </h1>
                  {supabaseConfig.connected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Supabase Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Local Storage Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Manage JAMB & Post-UTME Past Questions, Pricing, and Storage
                </p>
              </div>
            </div>

            {/* Navigation Tabs and User Auth Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Products & Resources
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Supabase Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>

              {/* User Identity & Sign Out */}
              {currentUser && (
                <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs text-slate-600">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] max-w-[140px] truncate text-slate-700" title={currentUser.email}>
                    {currentUser.email}
                  </span>
                </div>
              )}

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="py-1.5 px-2.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sign out of Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {actionMessage && !isModalOpen && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            actionMessage.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {actionMessage.success
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}
        
        {/* Metric Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Total Resources</span>
              <BookOpen className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-display tabular-nums">
              {resources.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {freeResourcesCount} Free / {resources.length - freeResourcesCount} Premium
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Total Student Downloads</span>
              <Download className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-display tabular-nums">
              {totalDownloads.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all faculties</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Estimated Value</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-display tabular-nums">
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime resource orders</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Avg Scholar Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-display tabular-nums">
              4.9 / 5.0
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified Nigerian students</p>
          </div>
        </section>

        {/* Tab 1: Product & Resource Management */}
        {activeTab === 'catalog' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Table Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by university, title, or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-900"
                  />
                </div>

                {/* Filter Category */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none text-slate-700 bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="post_utme">Post-UTME Past Questions</option>
                  <option value="jamb_utme">JAMB UTME Papers</option>
                  <option value="syllabus_novel">Syllabus & Novel</option>
                  <option value="formula_sheet">Formula Sheets</option>
                  <option value="bundle">Bundles</option>
                </select>
              </div>

              {/* Add New Product Button */}
              <button
                onClick={openAddModal}
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Resource</span>
              </button>

            </div>

            {/* Resources Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
                    <th className="py-3 px-4">Resource & Cover</th>
                    <th className="py-3 px-4">Category / Institution</th>
                    <th className="py-3 px-4">Year Range</th>
                    <th className="py-3 px-4">Pricing</th>
                    <th className="py-3 px-4">Downloads</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredResources.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No resources found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredResources.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Cover & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-13 rounded overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                              {res.coverUrl ? (
                                <img
                                  src={res.coverUrl}
                                  alt={res.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[9px] text-center font-bold">
                                  PDF
                                </div>
                              )}
                            </div>
                            <div className="max-w-xs">
                              <p 
                                onClick={() => onOpenResource(res)}
                                className="font-semibold text-slate-900 hover:text-orange-600 line-clamp-1 cursor-pointer"
                              >
                                {res.title}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {res.subject || 'General'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Institution */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-medium">{res.institution || 'JAMB General'}</p>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {res.category.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Year Range */}
                        <td className="py-3.5 px-4 text-slate-700 tabular-nums">
                          {res.yearRange}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          {res.isFree ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded">
                              FREE
                            </span>
                          ) : (
                            <span className="font-bold text-slate-900 tabular-nums">
                              ₦{res.price.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Downloads */}
                        <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                          {res.downloadsCount.toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(res)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="Edit Resource"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(res.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Resource"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Supabase Connection & Storage Settings */}
        {activeTab === 'supabase' && (
          <div className="space-y-6">
            
            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Supabase Database & Storage Connection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect your project to live Supabase PostgreSQL and Storage buckets.
                  </p>
                </div>
                {supabaseConfig.connected ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Connected</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Running in Local Storage Mode</span>
                  </span>
                )}
              </div>

              {/* Credential Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Found in Supabase Project Settings → API → Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Found in Supabase Project Settings → API → anon/public key
                  </span>
                </div>
              </div>

              {/* Connection Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={connectionStatus.testing}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus.testing ? 'animate-spin' : ''}`} />
                  <span>{connectionStatus.testing ? 'Testing...' : 'Save & Test Connection'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Feedback Alert */}
              {connectionStatus.message && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  connectionStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{connectionStatus.message}</span>
                </div>
              )}
            </div>

            {/* SQL Migration Script Box */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Official Supabase SQL Schema Migration
                  </h4>
                  <p className="text-xs text-slate-500">
                    Run this SQL script in your Supabase SQL Editor to automatically create tables, RLS security rules, and storage buckets.
                  </p>
                </div>
                <button
                  onClick={copySqlToClipboard}
                  className="py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono max-h-64 overflow-y-auto leading-relaxed">
                  {supabaseService.getSQLMigrationScript()}
                </pre>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this resource? This will remove it from the catalog and database.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-1.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteResource(deleteConfirmId)}
                className="py-1.5 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0F294A] text-white p-5 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-base font-bold font-display">
                {editingResource ? 'Edit Resource Details' : 'Upload New Post-UTME / JAMB Resource'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveResource} className="p-6 space-y-4 text-xs">
              
              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product / Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UNILAG Post-UTME Comprehensive Past Questions & Solutions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category & Institution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                  >
                    <option value="post_utme">Post-UTME Past Questions</option>
                    <option value="jamb_utme">JAMB UTME Past Papers</option>
                    <option value="syllabus_novel">Syllabus & Novel Guide</option>
                    <option value="formula_sheet">Formula Sheets</option>
                    <option value="bundle">Bundle / Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institution / School Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Type school name manually (e.g. UNILAG, LASU, FUTA, RSU...)"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500 text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Manually enter any university, polytechnic, or college name.
                  </p>
                </div>
              </div>

              {/* Subject & Year Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject / Coverage</label>
                  <input
                    type="text"
                    placeholder="e.g. Use of English, Mathematics & General Knowledge"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year Range Covered</label>
                  <input
                    type="text"
                    placeholder="e.g. 2010 - 2025 Solved"
                    value={formData.yearRange}
                    onChange={(e) => setFormData({ ...formData, yearRange: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Pricing & Free Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price in Nigerian Naira (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={formData.isFree}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none disabled:bg-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, price: e.target.checked ? 0 : 2000 })}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="isFree" className="font-semibold text-slate-800 cursor-pointer">
                    Offer as 100% Free Download
                  </label>
                </div>
              </div>

              {/* Cover Photo Upload & Presets */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Book Cover Image
                  </label>
                  {formData.coverUrl && (
                    <span className="text-[10px] text-emerald-600 font-medium">Cover configured</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {formData.coverUrl ? (
                    <img
                      src={formData.coverUrl}
                      alt="Cover Preview"
                      className="w-12 h-14 object-cover rounded-md border border-slate-300 shadow-2xs shrink-0 bg-white"
                      onError={(e) => {
                        // Fallback on broken image
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-14 bg-slate-200 rounded-md flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={coverUploading}
                        className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{coverUploading ? 'Uploading...' : 'Upload Image'}</span>
                      </button>

                      <input
                        type="text"
                        placeholder="or paste image URL"
                        value={formData.coverUrl}
                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                        className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Preset Cover Picks */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverUrl: coverPostutme })}
                        className="text-slate-600 hover:text-orange-600 underline cursor-pointer"
                      >
                        UNILAG / Post-UTME
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverUrl: coverJambEnglish })}
                        className="text-slate-600 hover:text-orange-600 underline cursor-pointer"
                      >
                        JAMB English
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverUrl: coverJambSciences })}
                        className="text-slate-600 hover:text-orange-600 underline cursor-pointer"
                      >
                        Science Bundle
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study PDF File Upload or Direct Link */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Past Question PDF / Document File *
                  </label>
                  {formData.fileUrl ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Document Ready ({formData.fileSize})
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Upload PDF or paste Google Drive / Cloud link
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fileUploading}
                      className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-xs whitespace-nowrap shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      <span>{fileUploading ? 'Attaching PDF...' : 'Choose PDF File'}</span>
                    </button>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Or paste direct download link (Google Drive, Cloud URL, or Supabase)"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-4">
                      <span>
                        Size: <input type="text" value={formData.fileSize} onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })} className="p-0.5 px-1 bg-white border border-slate-200 rounded w-18 text-center font-mono text-[11px]" />
                      </span>
                      <span>
                        Pages: <input type="number" value={formData.pageCount} onChange={(e) => setFormData({ ...formData, pageCount: Number(e.target.value) })} className="p-0.5 px-1 bg-white border border-slate-200 rounded w-14 text-center font-mono text-[11px]" />
                      </span>
                    </div>

                    {!formData.fileUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fileUrl: 'https://storage.googleapis.com/edujamb-demo/sample-past-question.pdf', fileSize: '4.8 MB' })}
                        className="text-[11px] text-orange-600 hover:text-orange-700 underline cursor-pointer"
                      >
                        Use Sample PDF Link
                      </button>
                    )}

                    {formData.fileUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fileUrl: '' })}
                        className="text-[11px] text-rose-600 hover:text-rose-800 underline cursor-pointer"
                      >
                        Clear File
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description & Syllabus Scope
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Key Features & Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              {actionMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  actionMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {actionMessage.success
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 text-slate-700 font-semibold hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer disabled:bg-slate-400"
                >
                  {isSaving ? 'Saving to Database...' : (editingResource ? 'Update Resource' : 'Save & Publish Resource')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
