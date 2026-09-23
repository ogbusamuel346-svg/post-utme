import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  [key: string]: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: () => void;
};

type Order = {
  id: string;
  reference: string;
  product_id: string;
  email: string;
  amount_kobo: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'abandoned';
  paid_at?: string | null;
};

type Product = {
  id: string;
  title: string;
  price: number;
  is_free: boolean;
  file_url: string | null;
  file_size: string | null;
  format: string | null;
};

const json = (res: ApiResponse, status: number, payload: unknown) => {
  res.status(status).json(payload);
};

const getHeader = (req: ApiRequest, name: string): string => {
  const value = req.headers?.[name.toLowerCase()] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] || '' : value || '';
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
};

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url) throw new Error('Missing server environment variable: SUPABASE_URL');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

const getAuthenticatedEmail = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  req: ApiRequest
): Promise<string> => {
  const authorization = getHeader(req, 'authorization');
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error('Sign in to view your purchase history.');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) throw new Error('Your sign-in session could not be verified.');

  const email = normalizeEmail(data.user.email);
  assertEmail(email);
  return email;
};

const setCorsHeaders = (req: ApiRequest, res: ApiResponse) => {
  const origin = getHeader(req, 'origin');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Vary', 'Origin');
};

const readRawBody = async (req: ApiRequest): Promise<string> => {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

  const chunks: Buffer[] = [];
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

const parseBody = (rawBody: string): Record<string, any> => {
  if (!rawBody.trim()) return {};
  try {
    const parsed = JSON.parse(rawBody);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new Error('Invalid JSON request body.');
  }
};

const normalizeEmail = (email: unknown): string => String(email || '').trim().toLowerCase();

const assertEmail = (email: string) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address so your purchase can be recovered later.');
  }
};

const makeReference = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `SEH-${Date.now()}-${random}`;
};

const getProduct = async (supabase: ReturnType<typeof getSupabaseAdmin>, productId: string): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, is_free, file_url, file_size, format')
    .eq('id', productId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the selected product: ${error.message}`);
  if (!data) throw new Error('The selected product is no longer available.');
  return data as Product;
};

const getDeliverableUrl = async (supabase: ReturnType<typeof getSupabaseAdmin>, fileUrl: string): Promise<string> => {
  // New paid-materials uploads are private. The database stores the stable
  // storage URL as a pointer, and this endpoint exchanges it for a one-hour
  // signed URL only after the relevant access check.
  const match = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/i);
  if (!match || match[1] !== 'paid-materials') return fileUrl;

  const path = decodeURIComponent(match[2]);
  const { data, error } = await supabase.storage.from('paid-materials').createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    throw new Error(`Could not create a secure download link: ${error?.message || 'unknown storage error'}`);
  }
  return data.signedUrl;
};

const getOrder = async (supabase: ReturnType<typeof getSupabaseAdmin>, reference: string): Promise<Order> => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, reference, product_id, email, amount_kobo, currency, status, paid_at')
    .eq('reference', reference)
    .maybeSingle();

  if (error) throw new Error(`Could not load the payment record: ${error.message}`);
  if (!data) throw new Error('We could not find that payment reference. Check the reference and try again.');
  return data as Order;
};

const getDownloadGrant = async (supabase: ReturnType<typeof getSupabaseAdmin>, order: Order) => {
  const product = await getProduct(supabase, order.product_id);
  if (!product.file_url) throw new Error('This product has no uploaded material attached yet. Please contact Sam Edu Hub.');

  return {
    success: true,
    reference: order.reference,
    productId: product.id,
    title: product.title,
    fileUrl: await getDeliverableUrl(supabase, product.file_url),
    fileSize: product.file_size || '',
    format: product.format || 'PDF'
  };
};

const getVerifiedPurchaseHistory = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  secretKey: string,
  email: string
) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, reference, product_id, email, amount_kobo, currency, status, paid_at')
    .ilike('email', email)
    .in('status', ['paid', 'pending'])
    .order('paid_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Could not load your purchase history: ${error.message}`);

  const purchases = (await Promise.all((data || []).map(async (row: any) => {
    let order = row as Order;

    // A guest checkout can remain pending if the browser lost connection
    // after Paystack accepted the payment. Re-check those references when a
    // signed-in student opens the dashboard so verified purchases are linked.
    if (order.status !== 'paid') {
      try {
        const result = await verifyWithPaystack(supabase, secretKey, order.reference, email);
        if (!('fileUrl' in result) || !result.fileUrl) return null;
        order = await getOrder(supabase, order.reference);
      } catch {
        return null;
      }
    }

    const product = await getProduct(supabase, order.product_id);
    return {
      reference: order.reference,
      email: normalizeEmail(order.email),
      title: product.title,
      productId: product.id,
      purchasedAt: order.paid_at || new Date().toISOString()
    };
  }))).filter(Boolean);

  return { success: true, purchases };
};

const getFreeDownloadGrant = async (supabase: ReturnType<typeof getSupabaseAdmin>, productId: string) => {
  const product = await getProduct(supabase, productId);
  if (!product.is_free) throw new Error('This product requires payment before download.');
  if (!product.file_url) throw new Error('This product has no uploaded material attached yet.');

  return {
    success: true,
    reference: `free-${product.id}`,
    productId: product.id,
    title: product.title,
    fileUrl: await getDeliverableUrl(supabase, product.file_url),
    fileSize: product.file_size || '',
    format: product.format || 'PDF'
  };
};

const markOrderPaid = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: Order,
  transaction: { id?: number | string; amount?: number | string; currency?: string; paid_at?: string }
) => {
  const amount = Number(transaction.amount);
  if (!Number.isFinite(amount) || amount !== Number(order.amount_kobo)) {
    throw new Error('The Paystack amount did not match the product price. The material was not released.');
  }

  if (transaction.currency && transaction.currency !== order.currency) {
    throw new Error('The Paystack currency did not match the product currency.');
  }

  if (order.status !== 'paid') {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'paid',
        paid_at: transaction.paid_at || new Date().toISOString(),
        transaction_id: transaction.id ? String(transaction.id) : null
      })
      .eq('id', order.id);

    if (error) throw new Error(`Payment succeeded but the purchase could not be recorded: ${error.message}`);
  }

  return getDownloadGrant(supabase, { ...order, status: 'paid' });
};

const verifyWithPaystack = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  secretKey: string,
  reference: string,
  email: string
) => {
  const order = await getOrder(supabase, reference);
  if (normalizeEmail(order.email) !== email) {
    throw new Error('The email does not match this payment reference.');
  }

  if (order.status === 'paid') return getDownloadGrant(supabase, order);

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const payload = await response.json() as any;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || 'Paystack could not verify this transaction.');
  }

  const transaction = payload.data || {};
  if (transaction.status !== 'success') {
    return { success: false, pending: true, message: 'Payment is still being confirmed. Try recovery again in a moment.' };
  }

  return markOrderPaid(supabase, order, transaction);
};

const initializeTransaction = async (
  req: ApiRequest,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  secretKey: string,
  productId: string,
  email: string
) => {
  const product = await getProduct(supabase, productId);
  const price = Number(product.price);
  if (product.is_free || !Number.isFinite(price) || price <= 0) {
    throw new Error('This product does not require a Paystack payment.');
  }

  if (!product.file_url) throw new Error('This product has no uploaded material attached yet.');

  const reference = makeReference();
  const amountKobo = Math.round(price * 100);
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      reference,
      product_id: product.id,
      email,
      amount_kobo: amountKobo,
      currency: 'NGN',
      status: 'pending'
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw new Error(`Could not create the payment record: ${orderError?.message || 'unknown database error'}`);
  }

  const origin = getHeader(req, 'origin') || process.env.APP_URL || '';
  const callbackUrl = origin ? `${origin.replace(/\/$/, '')}/?payment_reference=${encodeURIComponent(reference)}` : undefined;
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: String(amountKobo),
      currency: 'NGN',
      reference,
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      metadata: { product_id: product.id, product_title: product.title }
    })
  });
  const payload = await response.json() as any;

  if (!response.ok || !payload?.status || !payload?.data?.access_code) {
    await supabase.from('purchase_orders').update({ status: 'failed' }).eq('id', order.id);
    throw new Error(payload?.message || 'Paystack could not initialize the payment.');
  }

  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({ access_code: payload.data.access_code, authorization_url: payload.data.authorization_url })
    .eq('id', order.id);

  if (updateError) throw new Error(`Payment initialized but could not be saved: ${updateError.message}`);

  return {
    success: true,
    reference,
    accessCode: payload.data.access_code,
    authorizationUrl: payload.data.authorization_url
  };
};

const verifyWebhookSignature = (rawBody: string, signature: string, secretKey: string): boolean => {
  if (!signature) return false;
  const digest = createHmac('sha512', secretKey).update(rawBody).digest('hex');
  if (digest.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { success: false, message: 'Only POST requests are supported.' });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const body = parseBody(rawBody);
    const supabase = getSupabaseAdmin();
    const secretKey = getRequiredEnv('PAYSTACK_SECRET_KEY');
    const webhookSignature = getHeader(req, 'x-paystack-signature');

    // Paystack webhook delivery uses the same endpoint. The signature is
    // verified before any database update so a forged request cannot release a file.
    if (webhookSignature) {
      if (!verifyWebhookSignature(rawBody, webhookSignature, secretKey)) {
        json(res, 401, { success: false, message: 'Invalid Paystack webhook signature.' });
        return;
      }

      if (body.event === 'charge.success' && body.data?.reference) {
        const order = await getOrder(supabase, String(body.data.reference));
        await markOrderPaid(supabase, order, body.data);
      }
      json(res, 200, { success: true });
      return;
    }

    const action = String(body.action || '');
    if (action === 'history') {
      const email = await getAuthenticatedEmail(supabase, req);
      json(res, 200, await getVerifiedPurchaseHistory(supabase, secretKey, email));
      return;
    }

    if (action === 'initialize') {
      const productId = String(body.productId || '').trim();
      const email = normalizeEmail(body.email);
      if (!productId) throw new Error('A product is required.');
      assertEmail(email);
      json(res, 200, await initializeTransaction(req, supabase, secretKey, productId, email));
      return;
    }

    if (action === 'verify' || action === 'recover') {
      const reference = String(body.reference || '').trim();
      const email = normalizeEmail(body.email);
      if (!reference) throw new Error('Enter the Paystack payment reference.');
      assertEmail(email);
      json(res, 200, await verifyWithPaystack(supabase, secretKey, reference, email));
      return;
    }

    if (action === 'free-download') {
      const productId = String(body.productId || '').trim();
      if (!productId) throw new Error('A product is required.');
      json(res, 200, await getFreeDownloadGrant(supabase, productId));
      return;
    }

    json(res, 400, { success: false, message: 'Unknown payment action.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment request failed.';
    json(res, 400, { success: false, message });
  }
}
