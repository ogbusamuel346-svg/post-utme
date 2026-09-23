import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Resource, SupabaseConfig } from '../types';
import { INITIAL_RESOURCES } from '../data/initialResources';

const STORAGE_KEY_RESOURCES = 'edujamb_resources_catalog';
const STORAGE_KEY_CONFIG = 'edujamb_supabase_config';

// Check environment variables first, then localStorage
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    connected: false
  };

  constructor() {
    this.initClient();
  }

  private initClient() {
    // 1. Check localStorage
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    let url = ENV_SUPABASE_URL;
    let anonKey = ENV_SUPABASE_ANON_KEY;

    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          anonKey = parsed.anonKey;
        }
      } catch (e) {
        console.error('Failed to parse saved Supabase configuration', e);
      }
    }

    if (url && anonKey) {
      try {
        this.client = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.config = {
          url,
          anonKey,
          connected: true,
          lastChecked: new Date().toISOString()
        };
      } catch (err) {
        console.error('Error creating Supabase client:', err);
        this.client = null;
        this.config.connected = false;
      }
    } else {
      this.client = null;
      this.config = {
        url: '',
        anonKey: '',
        connected: false
      };
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  // ==================== AUTHENTICATION METHODS ====================

  public async getSession(): Promise<Session | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        console.warn('Error fetching Supabase session:', error.message);
        return null;
      }
      return data.session;
    } catch (e) {
      console.warn('Supabase getSession exception:', e);
      return null;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch (e) {
      return null;
    }
  }

  public async signInWithPassword(email: string, password: string): Promise<{ success: boolean; user?: User | null; session?: Session | null; error?: string }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please enter your Supabase Project URL and Anon Key first.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during authentication.'
      };
    }
  }

  public async signUp(email: string, password: string): Promise<{ success: boolean; user?: User | null; session?: Session | null; error?: string; message?: string }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your project URL and Anon key first.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: data.session ? 'Admin account created successfully!' : 'Registration submitted! Please verify the confirmation email sent by Supabase if email confirmation is enabled in your project.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to sign up.'
      };
    }
  }

  public async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) return { success: true };
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!this.client) return { data: { subscription: { unsubscribe: () => {} } } };
    return this.client.auth.onAuthStateChange(callback);
  }

  public async updateConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      this.client = null;
      this.config = { url: '', anonKey: '', connected: false };
      return { success: true, message: 'Supabase configuration cleared. Running in local storage mode.' };
    }

    try {
      const testClient = createClient(trimmedUrl, trimmedKey);
      // Fast probe to check connection
      const { error } = await testClient.from('products').select('count', { count: 'exact', head: true });
      
      // Even if table doesn't exist yet, reaching Supabase means URL & key are active
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation "products" does not exist') && error.code !== '42P01') {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
          return { success: false, message: 'Invalid Supabase Anon Key. Please check your credentials.' };
        }
      }

      this.client = testClient;
      this.config = {
        url: trimmedUrl,
        anonKey: trimmedKey,
        connected: true,
        lastChecked: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return { success: true, message: 'Successfully connected to Supabase project!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Supabase';
      return { success: false, message: msg };
    }
  }

  public async fetchResources(): Promise<Resource[]> {
    // If Supabase is connected, attempt to fetch from Supabase 'products' table
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('products')
          .select('*')
          .order('downloads_count', { ascending: false });

        if (!error && data && data.length > 0) {
          // Map DB columns to Resource interface
          const mapped: Resource[] = data.map((item: any) => ({
            id: item.id,
            slug: item.slug || item.id,
            title: item.title,
            category: item.category,
            institution: item.institution,
            subject: item.subject,
            yearRange: item.year_range || item.yearRange || '',
            price: Number(item.price) || 0,
            isFree: Boolean(item.is_free ?? (Number(item.price) === 0)),
            coverUrl: item.cover_url || item.coverUrl || '',
            fileUrl: item.file_url || item.fileUrl || '',
            fileSize: item.file_size || item.fileSize || '5.0 MB',
            pageCount: item.page_count || item.pageCount || 100,
            format: item.format || 'PDF eBook',
            description: item.description || '',
            features: Array.isArray(item.features) ? item.features : (typeof item.features === 'string' ? JSON.parse(item.features || '[]') : []),
            downloadsCount: item.downloads_count || item.downloadsCount || 0,
            rating: item.rating || 5.0,
            reviewCount: item.review_count || item.reviewCount || 0,
            isFeatured: item.is_featured ?? true,
            sampleQuestions: item.sample_questions || [],
            createdAt: item.created_at || new Date().toISOString()
          }));

          // Cache in local storage for instant offline / fallback speed
          localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local storage cache:', err);
      }
    }

    // Fallback: local storage or initial seed data
    const local = localStorage.getItem(STORAGE_KEY_RESOURCES);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse local resources:', e);
      }
    }

    // Seed default data
    localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(INITIAL_RESOURCES));
    return INITIAL_RESOURCES;
  }

  private getLocalResourcesSync(): Resource[] {
    const local = localStorage.getItem(STORAGE_KEY_RESOURCES);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse local resources:', e);
      }
    }
    return INITIAL_RESOURCES;
  }

  private saveToLocalStorage(list: Resource[]): void {
    try {
      // Protect against localStorage 5MB quota limit:
      // Strip oversized base64 data URLs if any were generated
      const safeList = list.map(item => {
        const copy = { ...item };
        if (copy.fileUrl && copy.fileUrl.startsWith('data:') && copy.fileUrl.length > 500000) {
          copy.fileUrl = '';
        }
        if (copy.coverUrl && copy.coverUrl.startsWith('data:') && copy.coverUrl.length > 500000) {
          copy.coverUrl = '/src/assets/images/cover_postutme_unilag_1790125905105.jpg';
        }
        return copy;
      });
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(safeList));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  public async saveResource(resource: Resource): Promise<{ success: boolean; data: Resource; message?: string }> {
    // 1. Instant local storage update without blocking network fetch
    const currentList = this.getLocalResourcesSync();
    const index = currentList.findIndex(r => r.id === resource.id);
    let updatedList: Resource[];

    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = resource;
    } else {
      updatedList = [resource, ...currentList];
    }
    this.saveToLocalStorage(updatedList);

    // 2. If Supabase is connected, fast upsert into 'products' table with 6-second timeout
    if (this.client) {
      try {
        const payload = {
          id: resource.id,
          slug: resource.slug,
          title: resource.title,
          category: resource.category,
          institution: resource.institution,
          subject: resource.subject,
          year_range: resource.yearRange,
          price: resource.price,
          is_free: resource.isFree,
          cover_url: resource.coverUrl,
          file_url: resource.fileUrl,
          file_size: resource.fileSize,
          page_count: resource.pageCount,
          format: resource.format,
          description: resource.description,
          features: resource.features,
          downloads_count: resource.downloadsCount,
          rating: resource.rating,
          review_count: resource.reviewCount,
          is_featured: resource.isFeatured,
          sample_questions: resource.sampleQuestions,
          created_at: resource.createdAt
        };

        const upsertPromise = this.client.from('products').upsert(payload);
        const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase save timeout')), 6000)
        );

        const { error } = await Promise.race([upsertPromise, timeoutPromise]) as any;
        if (error) {
          console.warn('Supabase upsert warning (saved locally):', error.message);
          return { success: true, data: resource, message: `Saved locally. (Supabase notice: ${error.message})` };
        }
      } catch (err: any) {
        console.warn('Supabase upsert failed/timeout, saved to local cache:', err?.message || err);
        return { success: true, data: resource, message: 'Saved to local cache.' };
      }
    }

    return { success: true, data: resource, message: 'Resource saved successfully.' };
  }

  public async deleteResource(id: string): Promise<boolean> {
    // 1. Delete from local storage
    const currentList = this.getLocalResourcesSync();
    const filtered = currentList.filter(r => r.id !== id);
    this.saveToLocalStorage(filtered);

    // 2. Delete from Supabase if connected
    if (this.client) {
      try {
        await this.client.from('products').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete from Supabase:', err);
      }
    }

    return true;
  }

  public async recordDownload(id: string): Promise<void> {
    const list = this.getLocalResourcesSync();
    const item = list.find(r => r.id === id);
    if (item) {
      item.downloadsCount = (item.downloadsCount || 0) + 1;
      await this.saveResource(item);
    }
  }

  public async uploadFile(file: File, bucket = 'past-questions'): Promise<{ success: boolean; url: string; error?: string }> {
    // 1. If Supabase client exists, attempt fast upload to Supabase Storage with 6-second timeout
    if (this.client) {
      try {
        const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadPromise = this.client.storage
          .from(bucket)
          .upload(cleanName, file, { cacheControl: '3600', upsert: true });

        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Storage upload timeout')), 6000)
        );

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

        if (!error && data?.path) {
          const { data: pubData } = this.client.storage.from(bucket).getPublicUrl(data.path);
          if (pubData?.publicUrl) {
            return { success: true, url: pubData.publicUrl };
          }
        } else if (error) {
          console.warn('Supabase storage upload error, falling back to instant local URL:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase storage exception or timeout, using instant fallback:', err?.message || err);
      }
    }

    // 2. Instant fallback:
    // If it's a small image (< 800KB), read as DataURL so it persists in previews
    if (file.type.startsWith('image/') && file.size < 800 * 1024) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return { success: true, url: dataUrl };
      } catch (e) {
        // fallback to ObjectURL below
      }
    }

    // For PDFs, documents, or large files: create an instant Object URL in 0 milliseconds
    // This completely eliminates the 10-30s browser freeze caused by reading massive PDFs into base64
    const objectUrl = URL.createObjectURL(file);
    return { success: true, url: objectUrl };
  }

  public getSQLMigrationScript(): string {
    return `-- ====================================================================
-- EduJAMB: Official Database & Storage Migration for Supabase
-- Copy and run this script inside your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Create 'products' (Resources & Past Questions) Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    institution TEXT,
    subject TEXT,
    year_range TEXT,
    price NUMERIC DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    cover_url TEXT,
    file_url TEXT,
    file_size TEXT DEFAULT '5.0 MB',
    page_count INTEGER DEFAULT 100,
    format TEXT DEFAULT 'PDF eBook',
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    downloads_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 4.9,
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT TRUE,
    sample_questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access to all products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
USING (true);

-- 4. Policy: Allow insert/update/delete (public / anon for demo administration)
DROP POLICY IF EXISTS "Anyone can insert or update products" ON public.products;
CREATE POLICY "Anyone can insert or update products" 
ON public.products 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 5. Create Storage Bucket for Past Questions & Covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('past-questions', 'past-questions', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Bucket Public Access Policy
DROP POLICY IF EXISTS "Public Access for Past Questions" ON storage.objects;
CREATE POLICY "Public Access for Past Questions"
ON storage.objects FOR SELECT
USING ( bucket_id = 'past-questions' );

DROP POLICY IF EXISTS "Public Uploads for Past Questions" ON storage.objects;
CREATE POLICY "Public Uploads for Past Questions"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'past-questions' );
`;
  }
}

export const supabaseService = new SupabaseService();
