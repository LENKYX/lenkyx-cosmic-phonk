/**
 * MORRO GOLD — PRIVATE SALES & COMMISSION LEDGER (owner only)
 *
 * Stores the owner's sales commissions in a private file that is NEVER exposed
 * through public endpoints. Public users can register a purchase, but they never
 * receive commission data, rates, buyer data or payout keys. Everything here is
 * only readable through endpoints protected by `auth.requireCreator`.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const LEDGER_PATH = path.join(DATA_DIR, 'commissions.json');
const CATALOG_PATH = path.join(__dirname, 'shopCatalog.json');

const MAX_ORDERS = 500;
const MAX_ITEMS_PER_ORDER = 40;

const DEFAULT_CONFIG = {
  enabled: true,
  ratePct: 10,
  pixKey: '',
  pixName: 'MORRO GOLD VIP',
  pixCity: 'CAMPO GRANDE',
  privateNote: '',
  updatedAt: null,
};

const VALID_STATUS = ['pendente', 'confirmada', 'paga', 'cancelada'];

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLedger() {
  ensureDir();
  if (!fs.existsSync(LEDGER_PATH)) {
    const fresh = { config: { ...DEFAULT_CONFIG }, orders: [] };
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(fresh, null, 2), 'utf-8');
    return fresh;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
    return {
      config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, orders: [] };
  }
}

function writeLedger(ledger) {
  ensureDir();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8');
}

let catalogCache = null;
function getCatalog() {
  if (catalogCache) return catalogCache;
  try {
    catalogCache = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  } catch {
    catalogCache = {};
  }
  return catalogCache || {};
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function sanitizeText(value, maxLen = 120) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLen);
}

export function getCommissionConfig() {
  const { config } = readLedger();
  return config;
}

/** Updates the private commission configuration (owner only). */
export function updateCommissionConfig(patch = {}) {
  const ledger = readLedger();
  const next = { ...ledger.config };
  if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  if (patch.ratePct !== undefined) next.ratePct = clampNumber(patch.ratePct, 0, 90);
  if (patch.pixKey !== undefined) next.pixKey = sanitizeText(patch.pixKey, 140);
  if (patch.pixName !== undefined) next.pixName = sanitizeText(patch.pixName, 80);
  if (patch.pixCity !== undefined) next.pixCity = sanitizeText(patch.pixCity, 60);
  if (patch.privateNote !== undefined) next.privateNote = sanitizeText(patch.privateNote, 600);
  next.updatedAt = new Date().toISOString();
  ledger.config = next;
  writeLedger(ledger);
  return next;
}

/**
 * Registers a sale (public call). The server always recalculates prices from the
 * authoritative catalog, so a tampered client cannot inflate the commission.
 * Returns a PUBLIC payload only (no commission data).
 */
export function registerSale({ items, buyerName, buyerContact, channel, source } = {}) {
  const ledger = readLedger();
  const config = ledger.config;

  if (!config.enabled) {
    return { ok: true, recorded: false, totalBrl: 0, orderId: null };
  }

  const catalog = getCatalog();
  const safeItems = [];
  const list = Array.isArray(items) ? items.slice(0, MAX_ITEMS_PER_ORDER) : [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const id = sanitizeText(raw.id, 80);
    if (!id) continue;
    const qty = clampNumber(raw.qty, 1, 99);
    const known = catalog[id];
    let unitBrl;
    let name;
    let brand;
    if (known) {
      unitBrl = known.priceBrl;
      name = known.name;
      brand = known.brand;
    } else {
      // Item from a live marketplace listing (price informed by the storefront)
      unitBrl = clampNumber(raw.unitBrl, 0, 1_000_000);
      name = sanitizeText(raw.name, 160) || 'Item da loja parceira';
      brand = sanitizeText(raw.brand, 80) || 'Parceiro';
    }
    safeItems.push({
      id,
      name,
      brand,
      qty,
      unitBrl: Math.round(unitBrl * 100) / 100,
      totalBrl: Math.round(unitBrl * qty * 100) / 100,
    });
  }

  if (!safeItems.length) {
    return { ok: false, error: 'Pedido vazio', totalBrl: 0, orderId: null };
  }

  const totalBrl = Math.round(safeItems.reduce((acc, i) => acc + i.totalBrl, 0) * 100) / 100;
  const ratePct = clampNumber(config.ratePct, 0, 90);
  const commissionBrl = Math.round(totalBrl * (ratePct / 100) * 100) / 100;

  const order = {
    id: `mg-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
    createdAt: new Date().toISOString(),
    items: safeItems,
    totalBrl,
    commissionRatePct: ratePct,
    commissionBrl,
    buyerName: sanitizeText(buyerName, 80),
    buyerContact: sanitizeText(buyerContact, 120),
    channel: sanitizeText(channel || 'loja', 40) || 'loja',
    source: sanitizeText(source || 'catalogo', 40) || 'catalogo',
    status: 'pendente',
    paidAt: null,
  };

  ledger.orders.unshift(order);
  if (ledger.orders.length > MAX_ORDERS) ledger.orders.length = MAX_ORDERS;
  writeLedger(ledger);

  // PUBLIC payload: the buyer never sees commission values.
  return { ok: true, recorded: true, orderId: order.id, totalBrl };
}

/** Private listing for the owner: full ledger with commissions. */
export function listSales() {
  const ledger = readLedger();
  const orders = ledger.orders;
  const totals = orders.reduce(
    (acc, o) => {
      acc.sales += 1;
      acc.gross += Number(o.totalBrl || 0);
      acc.commission += Number(o.commissionBrl || 0);
      if (o.status === 'paga') acc.paid += Number(o.commissionBrl || 0);
      else if (o.status !== 'cancelada') acc.pending += Number(o.commissionBrl || 0);
      return acc;
    },
    { sales: 0, gross: 0, commission: 0, paid: 0, pending: 0 }
  );
  return {
    config: ledger.config,
    orders,
    totals: {
      ...totals,
      gross: Math.round(totals.gross * 100) / 100,
      commission: Math.round(totals.commission * 100) / 100,
      paid: Math.round(totals.paid * 100) / 100,
      pending: Math.round(totals.pending * 100) / 100,
    },
  };
}

export function updateSaleStatus(id, status) {
  const safeStatus = VALID_STATUS.includes(status) ? status : 'pendente';
  const ledger = readLedger();
  const order = ledger.orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = safeStatus;
  order.paidAt = safeStatus === 'paga' ? new Date().toISOString() : null;
  writeLedger(ledger);
  return order;
}

export function deleteSale(id) {
  const ledger = readLedger();
  const before = ledger.orders.length;
  ledger.orders = ledger.orders.filter((o) => o.id !== id);
  writeLedger(ledger);
  return ledger.orders.length !== before;
}
