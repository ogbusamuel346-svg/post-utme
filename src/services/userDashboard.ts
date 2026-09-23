export interface LocalPurchase {
  reference: string;
  email: string;
  title: string;
  productId: string;
  purchasedAt: string;
}

const SAVED_MATERIALS_PREFIX = 'sam_edu_hub_saved_materials:';
const PURCHASES_PREFIX = 'sam_edu_hub_purchases:';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

export const getSavedMaterialIds = (userId: string): string[] => {
  const value = readJson<unknown>(`${SAVED_MATERIALS_PREFIX}${userId}`, []);
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
};

export const saveMaterialIds = (userId: string, ids: string[]): void => {
  localStorage.setItem(`${SAVED_MATERIALS_PREFIX}${userId}`, JSON.stringify(Array.from(new Set(ids))));
};

export const getPurchaseHistory = (email: string): LocalPurchase[] => {
  const value = readJson<unknown>(`${PURCHASES_PREFIX}${email.trim().toLowerCase()}`, []);
  return Array.isArray(value) ? value as LocalPurchase[] : [];
};

export const rememberPurchase = (purchase: LocalPurchase): void => {
  const key = `${PURCHASES_PREFIX}${purchase.email.trim().toLowerCase()}`;
  const existing = getPurchaseHistory(purchase.email);
  const next = [purchase, ...existing.filter(item => item.reference !== purchase.reference)].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(next));
  localStorage.setItem('sam_edu_hub_last_purchase', JSON.stringify(purchase));
};
