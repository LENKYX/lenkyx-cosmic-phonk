import { authFetch } from './api';

export interface SaleItem {
  id: string;
  name: string;
  brand: string;
  qty: number;
  unitBrl: number;
  totalBrl: number;
}

export interface SaleOrder {
  id: string;
  createdAt: string;
  items: SaleItem[];
  totalBrl: number;
  commissionRatePct: number;
  commissionBrl: number;
  buyerName: string;
  buyerContact: string;
  channel: string;
  source: string;
  status: 'pendente' | 'confirmada' | 'paga' | 'cancelada';
  paidAt: string | null;
}

export interface CommissionConfig {
  enabled: boolean;
  ratePct: number;
  pixKey: string;
  pixName: string;
  pixCity: string;
  privateNote: string;
  updatedAt: string | null;
}

export interface CommissionTotals {
  sales: number;
  gross: number;
  commission: number;
  paid: number;
  pending: number;
}

export interface CommissionLedger {
  config: CommissionConfig;
  orders: SaleOrder[];
  totals: CommissionTotals;
}

/**
 * Registra uma venda (público). O servidor devolve APENAS o total —
 * comissão, taxa e dados do comprador nunca saem daqui.
 */
export async function registerSale(payload: {
  items: { id: string; name?: string; brand?: string; qty: number; unitBrl?: number }[];
  buyerName?: string;
  buyerContact?: string;
  channel?: string;
  source?: string;
}): Promise<{ ok: boolean; recorded?: boolean; orderId?: string | null; totalBrl?: number; error?: string }> {
  try {
    const r = await fetch('/api/shop/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    return data as { ok: boolean; recorded?: boolean; orderId?: string | null; totalBrl?: number; error?: string };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

/** Ledger privado: exige token de Criador (somente o dono). */
export async function fetchCommissionLedger(): Promise<CommissionLedger | null> {
  try {
    const r = await authFetch('/api/shop/commissions');
    if (!r.ok) return null;
    return (await r.json()) as CommissionLedger;
  } catch {
    return null;
  }
}

export async function saveCommissionConfig(config: Partial<CommissionConfig>): Promise<boolean> {
  try {
    const r = await authFetch('/api/shop/commissions/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function setSaleStatus(id: string, status: SaleOrder['status']): Promise<boolean> {
  try {
    const r = await authFetch(`/api/shop/commissions/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function removeSale(id: string): Promise<boolean> {
  try {
    const r = await authFetch(`/api/shop/commissions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return r.ok;
  } catch {
    return false;
  }
}
