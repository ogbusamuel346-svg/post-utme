import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Resource, SupabaseConfig } from '../types';
import { INITIAL_RESOURCES } from '../data/initialResources';
import coverPostutme from '../assets/images/cover_postutme_unilag_1790125905105.jpg';
import coverJambEnglish from '../assets/images/cover_jamb_english_1790125914520.jpg';
import coverJambSciences from '../assets/images/cover_jamb_sciences_1790125924446.jpg';

const STORAGE_KEY_RESOURCES = 'edujamb_resources_catalog';
const STORAGE_KEY_CONFIG = 'edujamb_supabase_config';
const STORAGE_UPLOAD_TIMEOUT_MS = 60_000;
const PRODUCTS_TABLE_SETUP_MESSAGE = 'Supabase is connected, but public.products is missing. Run the SQL migration from Admin > Supabase Settings.';
const LEGACY_COVER_URLS: Record<string, string> = {
  '/src/assets/images/cover_postutme_unilag_1790125905105.jpg': coverPostutme,
  '/src/assets/images/cover_jamb_english_1790125914520.jpg': coverJambEnglish,
  '/src/assets/images/cover_jamb_sciences_1790125924446.jpg': coverJambSciences
};

const normalizeCoverUrl = (url: string): string => LEGACY_COVER_URLS[url] || url;
const inferMediaType = (fileUrl = ''): 'document' | 'video' =>
  /\.(mp4|webm|mov|m4v|ogg)(?:$|[?#])/i.test(fileUrl) ? 'video' : 'document';
const normalizeResource = (resource: Resource): Resource => ({
  ...resource,
  coverUrl: normalizeCoverUrl(resource.coverUrl || ''),
  mediaType: resource.mediaType || inferMediaType(resource.fileUrl || '')
});

const isProductsTableMissingError = (error: any): boolean => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes("could not find the table 'public.products'") ||
    message.includes('relation "products" does not exist');
};

const isRlsPolicyError = (error: any): boolean => {
  const message = String(error?.message || error || '').toLowerCase();
  return error?.code === '42501' || message.includes('row-level security policy');
};

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

  public async getAuthDiagnostics(): Promise<{
    hasSession: boolean;
    role: string;
    email: string;
    projectHost: string;
  }> {
    const session = await this.getSession();
    let projectHost = this.config.url || 'not configured';
    try {
      projectHost = new URL(this.config.url).host;
    } catch {
      // Keep the configured value when it is not a complete URL.
    }

    return {
      hasSession: Boolean(session?.access_token),
      role: session?.user?.role || 'anon',
      email: session?.user?.email || 'none',
      projectHost
    };
  }

  private async explainRlsFailure(table: string, operation: string, error: any): Promise<string> {
    const diagnostics = await this.getAuthDiagnostics();
    const session = diagnostics.hasSession
      ? `authenticated session (${diagnostics.email})`
      : 'no active authenticated session; request is using anon';
    return `Supabase RLS blocked ${operation} on ${table}. Project: ${diagnostics.projectHost}. Session: ${session}; role: ${diagnostics.role}. Confirm the matching INSERT/UPDATE policy exists in this project and sign in again. Original error: ${error?.message || error}`;
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

  public async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
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

  public async signInWithPassword(email: string, password: string): Promise<{ success: boolean; user?: User | null; session?: Session | null; error?: string; message?: string }> {
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

  public async signUpStudent(email: string, password: string, fullName: string): Promise<{ success: boolean; user?: User | null; session?: Session | null; error?: string; message?: string }> {
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
            role: 'student',
            full_name: fullName.trim()
          },
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined
        }
      });

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: data.session
          ? 'Your Sam Edu Hub account is ready.'
          : 'Account created. Check your email to confirm your account before signing in.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create your account.' };
    }
  }

  public async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your project URL and Anon key first.'
      };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined
      });

      if (error) return { success: false, error: error.message };
      return {
        success: true,
        message: 'Password reset link sent. Check your email to continue.'
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not send the password reset link.' };
    }
  }

  public async updatePassword(password: string): Promise<{ success: boolean; user?: User | null; error?: string }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your project URL and Anon key first.'
      };
    }

    try {
      const { data, error } = await this.client.auth.updateUser({ password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Could not update your password.' };
    }
  }

  public async updateUserProfile(profile: { fullName: string; phone?: string; institution?: string; role?: 'student' | 'admin' }): Promise<{ success: boolean; user?: User | null; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const metadata: Record<string, string> = {
        full_name: profile.fullName.trim(),
        phone: profile.phone?.trim() || '',
        institution: profile.institution?.trim() || ''
      };
      if (profile.role) metadata.role = profile.role;

      const { data, error } = await this.client.auth.updateUser({ data: metadata });

      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Your profile could not be updated.' };
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
      // Reconnecting from the admin settings creates a new Supabase client.
      // Preserve the current admin session so subsequent writes do not fall
      // back to the anonymous role and get rejected by RLS.
      let currentSession: Session | null = null;
      if (this.client) {
        try {
          const { data } = await this.client.auth.getSession();
          currentSession = data.session;
        } catch {
          currentSession = null;
        }
      }

      const testClient = createClient(trimmedUrl, trimmedKey);
      // Fast probe to check connection
      const { error } = await testClient.from('products').select('count', { count: 'exact', head: true });
      
      if (isProductsTableMissingError(error)) {
        return { success: false, message: PRODUCTS_TABLE_SETUP_MESSAGE };
      }

      if (error && error.code !== 'PGRST116' && !error.message.includes('relation "products" does not exist') && error.code !== '42P01') {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
          return { success: false, message: 'Invalid Supabase Anon Key. Please check your credentials.' };
        }
      }

      this.client = testClient;

      if (currentSession) {
        const { error: sessionError } = await this.client.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token
        });
        if (sessionError) {
          console.warn('Supabase admin session could not be restored:', sessionError.message);
        }
      }

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

        // An empty Supabase result is still an authoritative result. Do not fall
        // back to a stale local catalog when all products have been deleted.
        if (!error && Array.isArray(data)) {
          // Map DB columns to Resource interface
          const mapped: Resource[] = data.map((item: any) => {
            let features: string[] = [];
            if (Array.isArray(item.features)) {
              features = item.features;
            } else if (typeof item.features === 'string') {
              try {
                const parsedFeatures = JSON.parse(item.features || '[]');
                features = Array.isArray(parsedFeatures) ? parsedFeatures : [];
              } catch {
                features = [];
              }
            }

            return {
              id: item.id,
              slug: item.slug || item.id,
              title: item.title,
              category: item.category,
              institution: item.institution,
              subject: item.subject,
              yearRange: item.year_range || item.yearRange || '',
              price: Number(item.price) || 0,
              isFree: Boolean(item.is_free ?? (Number(item.price) === 0)),
              coverUrl: normalizeCoverUrl(item.cover_url || item.coverUrl || ''),
              mediaType: item.media_type || item.mediaType || inferMediaType(item.file_url || item.fileUrl || ''),
              fileUrl: item.file_url || item.fileUrl || '',
              fileSize: item.file_size || item.fileSize || '5.0 MB',
              pageCount: item.page_count || item.pageCount || 100,
              duration: item.duration || '',
              format: item.format || 'PDF eBook',
              description: item.description || '',
              features,
              downloadsCount: item.downloads_count || item.downloadsCount || 0,
              rating: item.rating || 5.0,
              reviewCount: item.review_count || item.reviewCount || 0,
              isFeatured: item.is_featured ?? true,
              sampleQuestions: item.sample_questions || [],
              createdAt: item.created_at || new Date().toISOString()
            };
          });

          // Cache in local storage for instant offline / fallback speed
          localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(mapped));
          return mapped;
        }

        if (error) {
          console.warn(
            isProductsTableMissingError(error)
              ? PRODUCTS_TABLE_SETUP_MESSAGE
              : `Supabase query failed, falling back to local storage cache: ${error.message}`
          );
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
        // [] is a valid, intentionally empty catalog. Treating it as missing
        // data would resurrect the seed products after the last item is deleted.
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeResource);
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
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeResource);
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
          copy.coverUrl = coverPostutme;
        }
        return copy;
      });
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(safeList));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  public async saveResource(resource: Resource): Promise<{ success: boolean; data: Resource; message?: string }> {
    // Build the local cache update once, but only commit it after a connected
    // Supabase save succeeds. This prevents a failed cloud write from looking
    // successful and then disappearing during the next refresh.
    const currentList = this.getLocalResourcesSync();
    const index = currentList.findIndex(r => r.id === resource.id);
    let updatedList: Resource[];

    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = resource;
    } else {
      updatedList = [resource, ...currentList];
    }
    // If Supabase is connected, upsert into 'products' first. The cloud catalog
    // is the source of truth for all browsers when a connection is configured.
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
          media_type: resource.mediaType || 'document',
          file_url: resource.fileUrl,
          file_size: resource.fileSize,
          page_count: resource.pageCount,
          duration: resource.duration || '',
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
          console.warn('Supabase upsert failed:', error.message);
          return {
            success: false,
            data: resource,
            message: isRlsPolicyError(error)
              ? await this.explainRlsFailure('public.products', 'product insert/update', error)
              : isProductsTableMissingError(error)
              ? PRODUCTS_TABLE_SETUP_MESSAGE
              : `Could not publish resource: ${error.message}`
          };
        }
      } catch (err: any) {
        console.warn('Supabase upsert failed:', err?.message || err);
        return {
          success: false,
          data: resource,
          message: isRlsPolicyError(err)
            ? await this.explainRlsFailure('public.products', 'product insert/update', err)
            : `Could not publish resource: ${err?.message || 'Supabase request failed.'}`
        };
      }

      this.saveToLocalStorage(updatedList);
      return { success: true, data: resource, message: 'Resource published successfully.' };
    }

    // Local-only mode remains fully usable without Supabase.
    this.saveToLocalStorage(updatedList);
    return { success: true, data: resource, message: 'Resource saved locally.' };
  }

  public async deleteResource(id: string): Promise<{ success: boolean; message?: string }> {
    // Delete from Supabase first when connected. Previously this method
    // discarded the local item even when Supabase rejected the delete, then a
    // refresh loaded the still-existing cloud row back into the frontend.
    if (this.client) {
      try {
        // Keep the delete request as a plain DELETE. Adding `.select()` turns
        // it into a `return=representation` request, which can be rejected by
        // otherwise-valid Supabase RLS policies that allow DELETE but do not
        // allow returning deleted rows.
        const { error } = await this.client
          .from('products')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('Failed to delete from Supabase:', error.message);
          return {
            success: false,
            message: isProductsTableMissingError(error)
              ? PRODUCTS_TABLE_SETUP_MESSAGE
              : `Supabase delete failed: ${error.message}`
          };
        }

        // RLS can make a delete affect zero rows without returning an error.
        // Verify that the row is no longer visible before updating the cache.
        const { data: remainingRow, error: verifyError } = await this.client
          .from('products')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (verifyError || remainingRow) {
          const message = verifyError
            ? `Delete verification failed: ${verifyError.message}`
            : 'Supabase refused the delete request. Check the DELETE policy for authenticated users.';
          console.error('Supabase did not remove resource:', message);
          return { success: false, message };
        }
      } catch (err) {
        console.error('Failed to delete from Supabase:', err);
        return { success: false, message: 'Supabase delete request failed unexpectedly.' };
      }
    }

    const currentList = this.getLocalResourcesSync();
    const filtered = currentList.filter(r => r.id !== id);
    this.saveToLocalStorage(filtered);
    return { success: true };
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
    // If Supabase is configured, a cloud URL is required. Persisting a blob:
    // URL in the database makes the attachment work only in the current tab
    // and leaves the public frontend unable to load it after a refresh.
    if (this.client) {
      try {
        const { error: bucketError } = await this.client.storage.getBucket(bucket);
        if (bucketError) {
          return {
            success: false,
            url: '',
            error: isRlsPolicyError(bucketError)
              ? await this.explainRlsFailure(`storage.buckets (${bucket})`, 'bucket lookup', bucketError)
              : `Storage bucket "${bucket}" is unavailable: ${bucketError.message}. Run the Supabase storage migration.`
          };
        }

        const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadPromise = this.client.storage
          .from(bucket)
          // Every path includes a timestamp, so this is always a new object.
          // Avoiding upsert keeps paid-material uploads dependent only on the
          // INSERT policy and never requires UPDATE access to storage.objects.
          .upload(cleanName, file, { cacheControl: '3600', upsert: false });

        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Storage upload timed out after ${STORAGE_UPLOAD_TIMEOUT_MS / 1000} seconds`)),
            STORAGE_UPLOAD_TIMEOUT_MS
          )
        );

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

        if (!error && data?.path) {
          const { data: pubData } = this.client.storage.from(bucket).getPublicUrl(data.path);
          if (pubData?.publicUrl) {
            return { success: true, url: pubData.publicUrl };
          }
        } else if (error) {
          console.warn('Supabase storage upload error:', error.message);
          return {
            success: false,
            url: '',
            error: isRlsPolicyError(error)
              ? await this.explainRlsFailure(`storage.objects (${bucket})`, 'file upload', error)
              : error.message
          };
        }
      } catch (err: any) {
        console.warn('Supabase storage exception:', err?.message || err);
        return {
          success: false,
          url: '',
          error: isRlsPolicyError(err)
            ? await this.explainRlsFailure(`storage.objects (${bucket})`, 'file upload', err)
            : err?.message || 'Storage upload failed.'
        };
      }

      return { success: false, url: '', error: 'Supabase did not return a public file URL.' };
    }

    // Local-only fallback:
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
    media_type TEXT DEFAULT 'document',
    file_url TEXT,
    file_size TEXT DEFAULT '5.0 MB',
    page_count INTEGER DEFAULT 100,
    duration TEXT,
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

-- Add video metadata to existing products tables created by older migrations.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'document';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration TEXT;
UPDATE public.products SET media_type = 'document' WHERE media_type IS NULL;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access to all products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Public Read Access" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
USING (true);

-- 4. Policies: authenticated admins can create, edit, and delete products
DROP POLICY IF EXISTS "Anyone can insert or update products" ON public.products;
DROP POLICY IF EXISTS "Admin All Access" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update products"
ON public.products 
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE TO authenticated
USING (true);

-- Refresh PostgREST's schema cache immediately after creating the table/policies
NOTIFY pgrst, 'reload schema';

-- 5. Create private guest purchase records for Paystack payments
-- The Vercel payment endpoint uses the Supabase service role to write these
-- rows. No public RLS policy is intentionally created for this table.
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    email TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'abandoned')),
    access_code TEXT,
    authorization_url TEXT,
    transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS purchase_orders_reference_idx ON public.purchase_orders(reference);
CREATE INDEX IF NOT EXISTS purchase_orders_email_idx ON public.purchase_orders(lower(email));

-- Refresh PostgREST after creating the payment table so the Vercel API can see it immediately
NOTIFY pgrst, 'reload schema';

-- 6. Create Storage Buckets
-- past-questions is kept public for legacy records. New covers go to the
-- public site-assets bucket, while new paid materials go to private storage.
INSERT INTO storage.buckets (id, name, public)
VALUES ('past-questions', 'past-questions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('paid-materials', 'paid-materials', false)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = false WHERE id = 'paid-materials';

-- Allow the authenticated admin client to verify that the bucket exists
DROP POLICY IF EXISTS "Admins can view past questions bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Admins can view upload buckets" ON storage.buckets;
CREATE POLICY "Admins can view upload buckets"
ON storage.buckets FOR SELECT TO authenticated
USING ( id IN ('past-questions', 'site-assets', 'paid-materials') );

-- 7. Storage Bucket Public Access Policy
DROP POLICY IF EXISTS "Public Access for Past Questions" ON storage.objects;
CREATE POLICY "Public Access for Past Questions"
ON storage.objects FOR SELECT
USING ( bucket_id = 'past-questions' );

DROP POLICY IF EXISTS "Public Access for Site Assets" ON storage.objects;
CREATE POLICY "Public Access for Site Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

DROP POLICY IF EXISTS "Public Uploads for Past Questions" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload past questions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload resource files" ON storage.objects;
CREATE POLICY "Admins can upload resource files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id IN ('past-questions', 'site-assets', 'paid-materials') );
`;
  }
}

export const supabaseService = new SupabaseService();
