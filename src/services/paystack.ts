import type { LocalPurchase } from './userDashboard';

export interface PaymentInitialization {
  success: true;
  reference: string;
  accessCode: string;
  authorizationUrl?: string;
}

export interface DownloadGrant {
  success: true;
  reference: string;
  productId: string;
  title: string;
  fileUrl: string;
  fileSize: string;
  format: string;
}

interface PendingPaymentResponse {
  success: false;
  pending: true;
  message: string;
}

interface PurchaseHistoryResponse {
  success: true;
  purchases: LocalPurchase[];
}

type PaymentResponse = PaymentInitialization | DownloadGrant | PendingPaymentResponse | PurchaseHistoryResponse;

const PAYMENT_API_URL = import.meta.env.VITE_PAYSTACK_API_URL || '/api/paystack';
const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v2/inline.js';

let paystackScriptPromise: Promise<void> | null = null;

const callPaymentApi = async (payload: Record<string, unknown>, accessToken?: string): Promise<PaymentResponse> => {
  const response = await fetch(PAYMENT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false && !body?.pending) {
    throw new Error(body?.message || 'Payment service is unavailable. Please try again.');
  }
  return body as PaymentResponse;
};

export const initializePayment = async (productId: string, email: string): Promise<PaymentInitialization> => {
  const result = await callPaymentApi({ action: 'initialize', productId, email });
  if (!('accessCode' in result) || !result.accessCode) {
    throw new Error('Paystack did not return a checkout session.');
  }
  return result as PaymentInitialization;
};

export const verifyPayment = async (reference: string, email: string): Promise<DownloadGrant | PendingPaymentResponse> => {
  const result = await callPaymentApi({ action: 'verify', reference, email });
  return result as DownloadGrant | PendingPaymentResponse;
};

export const recoverPayment = async (reference: string, email: string): Promise<DownloadGrant | PendingPaymentResponse> => {
  const result = await callPaymentApi({ action: 'recover', reference, email });
  return result as DownloadGrant | PendingPaymentResponse;
};

export const getAuthenticatedPurchaseHistory = async (accessToken: string): Promise<LocalPurchase[]> => {
  const result = await callPaymentApi({ action: 'history' }, accessToken);
  if (!('purchases' in result) || !Array.isArray(result.purchases)) {
    throw new Error('Your purchase history could not be loaded. Please try again.');
  }
  return result.purchases;
};

export const getFreeDownload = async (productId: string): Promise<DownloadGrant> => {
  const result = await callPaymentApi({ action: 'free-download', productId });
  if (!('fileUrl' in result) || !result.fileUrl) {
    throw new Error('The free material could not be prepared for download.');
  }
  return result as DownloadGrant;
};

export const waitForPayment = async (
  reference: string,
  email: string,
  attempts = 18,
  delayMs = 2000
): Promise<DownloadGrant> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await verifyPayment(reference, email);
    if ('fileUrl' in result && result.fileUrl) return result;
    if (attempt < attempts - 1) {
      await new Promise(resolve => window.setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Payment is still being confirmed. Use the recovery form with your email and Paystack reference to download it shortly.');
};

const loadPaystackScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Paystack checkout is only available in a browser.'));
  if ((window as any).PaystackPop) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;

  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PAYSTACK_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Paystack checkout could not be loaded.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Paystack checkout could not be loaded. Check your internet connection and try again.'));
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
};

export const openPaystackCheckout = async (accessCode: string): Promise<void> => {
  await loadPaystackScript();
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) throw new Error('Paystack checkout is unavailable in this browser.');

  const popup = new PaystackPop();
  popup.resumeTransaction(accessCode);
};
