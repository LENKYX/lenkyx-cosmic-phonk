import crypto from 'crypto';
import dns from 'dns/promises';

const CACHE_TTL_MS = 180_000; // 3 minutes autonomous background refresh

const state = {
  news: { updatedAt: 0, byCat: {} },
  markets: { updatedAt: 0, data: null },
  shopping: { updatedAt: 0, byQuery: {} },
  darkweb: { updatedAt: 0, data: null, chat: [] },
  satellites: { updatedAt: 0, data: null },
  orders: [],
  calls: {
    peers: new Map(),
    signals: new Map(), // peerId -> []
  },
  autoPortfolio: new Map(), // userId -> { cashUsd, positions, autoBotEnabled, lastTick, history }
};

function stripXml(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssItems(xml, category, sourceFallback = 'Global Press') {
  const items = [];
  const itemMatches = String(xml || '').match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const block of itemMatches.slice(0, 18)) {
    const title = stripXml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]);
    const link = stripXml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1]);
    const pubDate = stripXml((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1]);
    const source = stripXml((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1]) || sourceFallback;
    const desc = stripXml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1]);
    const mediaMatch =
      block.match(/url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
      block.match(/(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/i);
    if (title && link) {
      items.push({
        id: crypto.createHash('md5').update(link).digest('hex').slice(0, 12),
        title,
        summary: desc.slice(0, 220),
        url: link,
        source,
        category,
        imageUrl: mediaMatch ? mediaMatch[1] : '',
        publishedAt: pubDate || new Date().toISOString(),
      });
    }
  }
  return items;
}

const NEWS_FEEDS = {
  all: [
    'https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419',
    'https://news.google.com/rss/headlines/section/topic/WORLD?hl=pt-BR&gl=BR&ceid=BR:pt-419',
  ],
  brasil: ['https://news.google.com/rss/headlines/section/topic/NATION?hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  mundo: ['https://news.google.com/rss/headlines/section/topic/WORLD?hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  tech: ['https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  nasa: [
    'https://news.google.com/rss/search?q=NASA+OR+espa%C3%A7o+OR+astronomia&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  ],
  economia: ['https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  esportes: ['https://news.google.com/rss/headlines/section/topic/SPORTS?hl=pt-BR&gl=BR&ceid=BR:pt-419'],
  games: ['https://news.google.com/rss/search?q=games+OR+playstation+OR+xbox+OR+steam&hl=pt-BR&gl=BR&ceid=BR:pt-419'],
};

export async function fetchWorldNews(category = 'all', query = '', forceRefresh = false) {
  const cat = NEWS_FEEDS[category] ? category : 'all';
  const qClean = String(query || '').trim();
  const cacheKey = qClean ? `q:${qClean.toLowerCase()}` : cat;
  const cached = state.news.byCat[cacheKey];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return {
      ok: true,
      category: cat,
      query: qClean,
      updatedAt: new Date(cached.ts).toISOString(),
      articles: cached.items,
    };
  }

  const urls = qClean
    ? [`https://news.google.com/rss/search?q=${encodeURIComponent(qClean)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`]
    : NEWS_FEEDS[cat];

  const collected = [];
  await Promise.all(
    urls.map(async (u) => {
      try {
        const r = await fetch(u, {
          headers: { 'User-Agent': 'LENKYX-WorldNews/2.0' },
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          const xml = await r.text();
          collected.push(...parseRssItems(xml, cat));
        }
      } catch {
        // continue
      }
    })
  );

  // Enrich NASA/Science & Tech with Spaceflight News API directly
  if ((cat === 'nasa' || cat === 'all' || cat === 'tech') && !qClean) {
    try {
      const sr = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=8', {
        signal: AbortSignal.timeout(5000),
      });
      if (sr.ok) {
        const sdata = await sr.json();
        for (const art of sdata?.results || []) {
          collected.push({
            id: `space_${art.id}`,
            title: art.title,
            summary: String(art.summary || '').slice(0, 220),
            url: art.url,
            source: art.news_site || 'Spaceflight NASA',
            category: 'nasa',
            imageUrl: art.image_url || '',
            publishedAt: art.published_at || new Date().toISOString(),
          });
        }
      }
    } catch {
      // ignore
    }
  }

  const seen = new Set();
  const deduped = collected.filter((a) => {
    const k = a.title.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  state.news.byCat[cacheKey] = { ts: Date.now(), items: deduped.slice(0, 36) };
  state.news.updatedAt = Date.now();

  return {
    ok: true,
    category: cat,
    query: qClean,
    updatedAt: new Date().toISOString(),
    articles: state.news.byCat[cacheKey].items,
  };
}

// === LIVE CRYPTO + GLOBAL STOCKS & EXCHANGE RATES ===
const STOCK_SYMBOLS = [
  { symbol: '^BVSP', label: 'IBOVESPA', market: 'B3 Brasil', currency: 'PTS' },
  { symbol: '^GSPC', label: 'S&P 500', market: 'NYSE USA', currency: 'PTS' },
  { symbol: '^IXIC', label: 'NASDAQ', market: 'Tech USA', currency: 'PTS' },
  { symbol: 'NVDA', label: 'NVIDIA', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'AAPL', label: 'Apple Inc.', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'TSLA', label: 'Tesla Inc.', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'MSFT', label: 'Microsoft', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'PETR4.SA', label: 'Petrobras PN', market: 'B3 Brasil', currency: 'BRL' },
  { symbol: 'VALE3.SA', label: 'Vale ON', market: 'B3 Brasil', currency: 'BRL' },
  { symbol: 'ITUB4.SA', label: 'Itaú Unibanco', market: 'B3 Brasil', currency: 'BRL' },
];

export async function fetchMarketsData(forceRefresh = false) {
  if (!forceRefresh && state.markets.data && Date.now() - state.markets.updatedAt < 35_000) {
    return state.markets.data;
  }

  const crypto = [];
  const stocks = [];
  const forex = [];

  // 1. Live FX (USD/BRL, EUR/BRL, BTC/BRL)
  try {
    const r = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL', {
      signal: AbortSignal.timeout(4500),
    });
    if (r.ok) {
      const d = await r.json();
      for (const k of ['USDBRL', 'EURBRL', 'BTCBRL']) {
        if (d[k]) {
          forex.push({
            pair: `${d[k].code}/${d[k].codein}`,
            price: Number(d[k].bid || 0),
            changePct: Number(d[k].pctChange || 0),
            high: Number(d[k].high || 0),
            low: Number(d[k].low || 0),
          });
        }
      }
    }
  } catch {
    // ignore
  }

  const usdBrl = forex.find((f) => f.pair === 'USD/BRL')?.price || 5.75;

  // 2. Live Crypto via CoinGecko (with Binance fallback)
  try {
    const cg = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2&order=market_cap_desc&sparkline=true&price_change_percentage=24h',
      { headers: { 'User-Agent': 'LENKYX-Exchange/2.0' }, signal: AbortSignal.timeout(5500) }
    );
    if (cg.ok) {
      const rows = await cg.json();
      if (Array.isArray(rows)) {
        for (const c of rows) {
          const chg = Number(c.price_change_percentage_24h || 0);
          crypto.push({
            id: c.id,
            symbol: String(c.symbol || '').toUpperCase(),
            name: c.name,
            image: c.image,
            priceUsd: Number(c.current_price || 0),
            priceBrl: Number(c.current_price || 0) * usdBrl,
            change24h: chg,
            marketCapUsd: Number(c.market_cap || 0),
            volume24hUsd: Number(c.total_volume || 0),
            sparkline: Array.isArray(c.sparkline_in_7d?.price) ? c.sparkline_in_7d.price.slice(-24) : [],
            signal: chg > 3.5 ? 'COMPRA FORTE' : chg > 0.5 ? 'ALTA' : chg < -3 ? 'OPORTUNIDADE' : 'NEUTRO',
          });
        }
      }
    }
  } catch {
    // fallback to Binance public tickers
  }

  if (crypto.length === 0) {
    try {
      const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
      const br = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`,
        { signal: AbortSignal.timeout(4500) }
      );
      if (br.ok) {
        const list = await br.json();
        const names = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB', XRP: 'XRP', DOGE: 'Dogecoin' };
        for (const t of list || []) {
          const sym = String(t.symbol || '').replace('USDT', '');
          const p = Number(t.lastPrice || 0);
          const chg = Number(t.priceChangePercent || 0);
          crypto.push({
            id: sym.toLowerCase(),
            symbol: sym,
            name: names[sym] || sym,
            image: '',
            priceUsd: p,
            priceBrl: p * usdBrl,
            change24h: chg,
            marketCapUsd: 0,
            volume24hUsd: Number(t.quoteVolume || 0),
            sparkline: [],
            signal: chg > 2.5 ? 'COMPRA FORTE' : chg > 0 ? 'ALTA' : 'NEUTRO',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Live Global Stocks & Indices (Yahoo Finance v8)
  await Promise.all(
    STOCK_SYMBOLS.map(async (item) => {
      try {
        const yr = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=5d&interval=1h`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(4500),
          }
        );
        if (yr.ok) {
          const yd = await yr.json();
          const res = yd?.chart?.result?.[0];
          const meta = res?.meta;
          const closes = (res?.indicators?.quote?.[0]?.close || []).filter((n) => typeof n === 'number');
          const price = Number(meta?.regularMarketPrice || closes[closes.length - 1] || 0);
          const prev = Number(meta?.chartPreviousClose || meta?.previousClose || closes[0] || price);
          const chg = prev > 0 ? ((price - prev) / prev) * 100 : 0;
          if (price > 0) {
            stocks.push({
              symbol: item.symbol.replace('.SA', '').replace('^', ''),
              rawSymbol: item.symbol,
              name: item.label,
              market: item.market,
              currency: item.currency,
              price,
              change24h: chg,
              sparkline: closes.slice(-20),
              signal: chg > 1.2 ? 'ALTA' : chg < -1.2 ? 'QUEDA' : 'ESTÁVEL',
            });
          }
        }
      } catch {
        // skip unavailable symbol
      }
    })
  );

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    usdBrl,
    forex,
    crypto,
    stocks,
  };
  state.markets.data = payload;
  state.markets.updatedAt = Date.now();
  return payload;
}

export function getOrUpdateAutoPortfolio(userId = 'guest', action = null) {
  const uid = String(userId || 'guest').slice(0, 64);
  if (!state.autoPortfolio.has(uid)) {
    state.autoPortfolio.set(uid, {
      cashUsd: 10000,
      autoBotEnabled: true,
      positions: [
        { symbol: 'BTC', amount: 0.045, avgEntryUsd: 88000 },
        { symbol: 'NVDA', amount: 12, avgEntryUsd: 132 },
        { symbol: 'SOL', amount: 15, avgEntryUsd: 175 },
      ],
      history: [
        { ts: new Date().toISOString(), text: 'Robô Quântico LENKYX inicializado com carteira automática.' },
      ],
    });
  }
  const pf = state.autoPortfolio.get(uid);
  if (action?.type === 'toggle_bot') {
    pf.autoBotEnabled = Boolean(action.enabled);
    pf.history.unshift({
      ts: new Date().toISOString(),
      text: pf.autoBotEnabled ? 'Modo Automático ATIVADO.' : 'Modo Automático pausado.',
    });
  } else if (action?.type === 'trade' && action.symbol && Number(action.usdAmount) > 0 && Number(action.priceUsd) > 0) {
    const sym = String(action.symbol).toUpperCase().slice(0, 12);
    const usdAmt = Math.min(Number(action.usdAmount), 50000);
    const price = Number(action.priceUsd);
    if (action.side === 'buy' && pf.cashUsd >= usdAmt) {
      pf.cashUsd -= usdAmt;
      const qty = usdAmt / price;
      const existing = pf.positions.find((p) => p.symbol === sym);
      if (existing) {
        const totalQty = existing.amount + qty;
        existing.avgEntryUsd = (existing.amount * existing.avgEntryUsd + usdAmt) / totalQty;
        existing.amount = totalQty;
      } else {
        pf.positions.push({ symbol: sym, amount: qty, avgEntryUsd: price });
      }
      pf.history.unshift({
        ts: new Date().toISOString(),
        text: `COMPRA ${qty.toFixed(4)} ${sym} ($${usdAmt.toFixed(2)}) executada em tempo real.`,
      });
    } else if (action.side === 'sell') {
      const existing = pf.positions.find((p) => p.symbol === sym);
      if (existing && existing.amount > 0) {
        const qtyToSell = Math.min(existing.amount, usdAmt / price);
        const proceeds = qtyToSell * price;
        existing.amount -= qtyToSell;
        pf.cashUsd += proceeds;
        if (existing.amount <= 1e-8) {
          pf.positions = pf.positions.filter((p) => p.symbol !== sym);
        }
        pf.history.unshift({
          ts: new Date().toISOString(),
          text: `VENDA ${qtyToSell.toFixed(4)} ${sym} (+$${proceeds.toFixed(2)}) liquidada.`,
        });
      }
    }
  }
  pf.history = pf.history.slice(0, 20);
  return pf;
}

// === REAL-TIME GLOBAL SHOPPING WORLD (LIVE INTERNET PRODUCTS + NO-BUREAUCRACY CHECKOUT) ===
const SHOP_CATEGORY_QUERIES = {
  destaques: 'smartwatch fone bluetooth gamer led',
  tech: 'smartphone notebook fone bluetooth',
  gamer: 'teclado mecanico headset gamer controle',
  audio: 'caixa de som bluetooth jbl fone sem fio',
  moda: 'tenis esportivo jaqueta oculos sol',
  casa: 'luminaria led projetor galaxia smart tv',
};

export async function fetchShoppingProducts(category = 'destaques', query = '', forceRefresh = false) {
  const cat = SHOP_CATEGORY_QUERIES[category] ? category : 'destaques';
  const qClean = String(query || '').trim();
  const key = qClean ? `q:${qClean.toLowerCase()}` : `cat:${cat}`;
  const cached = state.shopping.byQuery[key];
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return {
      ok: true,
      category: cat,
      query: qClean,
      updatedAt: new Date(cached.ts).toISOString(),
      products: cached.items,
    };
  }

  const searchTerm = qClean || SHOP_CATEGORY_QUERIES[cat];
  const products = [];

  // 1. Mercado Livre Public Real-Time Catalog (Brazil / Global real prices & photos)
  try {
    const ml = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(searchTerm)}&limit=18`,
      { headers: { 'User-Agent': 'LENKYX-Shop/2.0' }, signal: AbortSignal.timeout(5500) }
    );
    if (ml.ok) {
      const data = await ml.json();
      for (const item of data?.results || []) {
        products.push({
          id: String(item.id),
          title: item.title,
          priceBrl: Number(item.price || 0),
          originalPriceBrl: Number(item.original_price || item.price || 0),
          imageUrl: String(item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
          permalink: item.permalink,
          freeShipping: Boolean(item.shipping?.free_shipping),
          soldQuantity: Number(item.sold_quantity || 10),
          rating: 4.7 + (Math.abs(String(item.id).charCodeAt(0) % 3) * 0.1),
          store: 'Mercado Global Express',
          category: cat,
        });
      }
    }
  } catch {
    // fallback below
  }

  // 2. DummyJSON Global Live Product Feed fallback/enrichment
  if (products.length < 6) {
    try {
      const djUrl = qClean
        ? `https://dummyjson.com/products/search?q=${encodeURIComponent(qClean)}&limit=16`
        : 'https://dummyjson.com/products?limit=20';
      const dr = await fetch(djUrl, { signal: AbortSignal.timeout(5000) });
      if (dr.ok) {
        const dd = await dr.json();
        const usdBrl = state.markets.data?.usdBrl || 5.75;
        for (const p of dd?.products || []) {
          products.push({
            id: `dj_${p.id}`,
            title: p.title,
            priceBrl: Number((Number(p.price || 20) * usdBrl).toFixed(2)),
            originalPriceBrl: Number((Number(p.price || 20) * usdBrl * 1.18).toFixed(2)),
            imageUrl: p.thumbnail || p.images?.[0] || '',
            permalink: '',
            freeShipping: true,
            soldQuantity: Math.round((p.rating || 4.5) * 42),
            rating: Number(p.rating || 4.8),
            store: p.brand || 'LENKYX Prime',
            category: p.category || cat,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  state.shopping.byQuery[key] = { ts: Date.now(), items: products.slice(0, 24) };
  state.shopping.updatedAt = Date.now();

  return {
    ok: true,
    category: cat,
    query: qClean,
    updatedAt: new Date().toISOString(),
    products: state.shopping.byQuery[key].items,
  };
}

export function createInstantOrder({ product, buyerName, paymentMethod, address }) {
  const orderId = `LX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const order = {
    id: orderId,
    productTitle: String(product?.title || 'Produto LENKYX'),
    priceBrl: Number(product?.priceBrl || 0),
    imageUrl: String(product?.imageUrl || ''),
    buyerName: String(buyerName || 'Explorador'),
    paymentMethod: String(paymentMethod || 'PIX Instantâneo'),
    address: String(address || 'Entrega Expressa'),
    status: 'CONFIRMADO EM TEMPO REAL',
    createdAt: new Date().toISOString(),
  };
  state.orders.unshift(order);
  state.orders = state.orders.slice(0, 40);
  return order;
}

export function getRecentOrders() {
  return state.orders;
}

// === DARK WEB / INFERNAL CYBER UNDERWORLD LIVE THREAT & SECURITY FEED ===
export async function fetchDarkWebIntel(forceRefresh = false) {
  if (!forceRefresh && state.darkweb.data && Date.now() - state.darkweb.updatedAt < CACHE_TTL_MS) {
    return state.darkweb.data;
  }

  const vulnerabilities = [];
  const cyberNews = [];

  // 1. Live CISA Known Exploited Vulnerabilities (real global zero-day / CVE feed)
  try {
    const r = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
      headers: { 'User-Agent': 'LENKYX-CyberSec/2.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) {
      const json = await r.json();
      const recent = (json?.vulnerabilities || []).slice(-14).reverse();
      for (const v of recent) {
        vulnerabilities.push({
          cveID: v.cveID,
          vendor: v.vendorProject,
          product: v.product,
          title: v.vulnerabilityName,
          dateAdded: v.dateAdded,
          ransomware: v.knownRansomwareCampaignUse === 'Known',
          summary: String(v.shortDescription || '').slice(0, 200),
        });
      }
    }
  } catch {
    // ignore
  }

  // 2. Live Hacker News Security / Exploit / Darknet Discussions
  try {
    const hr = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?query=security%20OR%20exploit%20OR%20encryption%20OR%20linux%20OR%20hacker&tags=story&hitsPerPage=14',
      { signal: AbortSignal.timeout(5000) }
    );
    if (hr.ok) {
      const hd = await hr.json();
      for (const h of hd?.hits || []) {
        if (h.title) {
          cyberNews.push({
            id: h.objectID,
            title: h.title,
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            author: h.author || 'anon',
            points: Number(h.points || 0),
            createdAt: h.created_at,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  if (state.darkweb.chat.length === 0) {
    state.darkweb.chat.push(
      {
        id: 'dw_1',
        handle: '0xPHANTOM',
        text: 'Nó Tor/Onion simulado ativo. Feed CISA Zero-Day sincronizado em tempo real.',
        ts: new Date().toISOString(),
      },
      {
        id: 'dw_2',
        handle: 'CRYPT0_VEX',
        text: 'Criptografia SHA-256 e analisador de cabeçalhos DNS prontos no terminal abaixo.',
        ts: new Date().toISOString(),
      }
    );
  }

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    vulnerabilities,
    cyberNews,
    encryptedChat: state.darkweb.chat.slice(-40),
  };
  state.darkweb.data = payload;
  state.darkweb.updatedAt = Date.now();
  return payload;
}

export function postDarkWebChat(handle, text) {
  const cleanText = String(text || '').trim().slice(0, 260);
  if (!cleanText) return state.darkweb.chat;
  const cleanHandle = String(handle || `0x${crypto.randomBytes(2).toString('hex').toUpperCase()}`).slice(0, 24);
  state.darkweb.chat.push({
    id: `dw_${Date.now()}`,
    handle: cleanHandle,
    text: cleanText,
    ts: new Date().toISOString(),
  });
  state.darkweb.chat = state.darkweb.chat.slice(-50);
  return state.darkweb.chat;
}

export async function inspectHostSecurity(target) {
  const clean = String(target || '').trim().replace(/^https?:\/\//i, '').split('/')[0].slice(0, 120);
  if (!clean || /[^a-zA-Z0-9.-]/.test(clean)) {
    throw new Error('Domínio inválido.');
  }
  const started = Date.now();
  let ips = [];
  try {
    ips = await dns.resolve4(clean);
  } catch {
    ips = [];
  }

  for (const proto of ['https', 'http']) {
    try {
      const res = await fetch(`${proto}://${clean}`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'LENKYX-Scanner/2.0' },
        signal: AbortSignal.timeout(4500),
      });
      const latencyMs = Date.now() - started;
      const headers = {};
      for (const h of [
        'server',
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'content-type',
      ]) {
        const val = res.headers.get(h);
        if (val) headers[h] = val;
      }
      return {
        ok: true,
        host: clean,
        protocol: proto.toUpperCase(),
        dnsIps: ips,
        status: res.status,
        latencyMs,
        tls: proto === 'https',
        headers,
        sha256Fingerprint: crypto.createHash('sha256').update(`${clean}:${res.status}:${proto}`).digest('hex').slice(0, 32),
      };
    } catch {
      // try next protocol
    }
  }

  // Graceful diagnostic response when domain has no public DNS/HTTPS endpoint (e.g. lenkyx.app or private .onion)
  return {
    ok: true,
    host: clean,
    dnsResolved: ips.length > 0,
    dnsIps: ips,
    status: ips.length > 0 ? 'PORTA_TLS_PROTEGIDA' : 'DOMÍNIO_LOCAL_OU_PRIVADO',
    latencyMs: Date.now() - started,
    tls: false,
    note:
      ips.length > 0
        ? 'DNS resolvido, porém o servidor bloqueou requisição HEAD automática.'
        : 'Domínio sem registro DNS público ativo (ex.: domínio local/reservado). Experimente google.com, nasa.gov ou brasilmais.mj.gov.br.',
    sha256Fingerprint: crypto.createHash('sha256').update(`${clean}:offline`).digest('hex').slice(0, 32),
  };
}

// === REAL-TIME GLOBAL SATELLITES, BRASIL+ (MJSP/PF) & QGIS XYZ TILES ENGINE ===
const QGIS_XYZ_LAYERS = [
  {
    id: 'google_sat',
    name: 'Google Satellite (Alta Resolução)',
    provider: 'Google XYZ Tiles',
    lyrs: 's',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    description: 'Imagens de satélite de alta resolução sem rótulos de estrada.',
    maxZoom: 20,
  },
  {
    id: 'google_hybrid',
    name: 'Google Satellite Hybrid (Satélite + Ruas)',
    provider: 'Google XYZ Tiles',
    lyrs: 'y',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    description: 'Sobrepõe rótulos de rodovias, cidades e locais sobre a imagem de satélite.',
    maxZoom: 20,
  },
  {
    id: 'google_roads_map',
    name: 'Google Maps (Rota Padrão)',
    provider: 'Google XYZ Tiles',
    lyrs: 'm',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    description: 'Mapa rodoviário completo com ruas, avenidas e nomes de localidades.',
    maxZoom: 20,
  },
  {
    id: 'google_terrain',
    name: 'Google Terrain (Relevo & Vegetação)',
    provider: 'Google XYZ Tiles',
    lyrs: 't',
    url: 'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}',
    description: 'Elevação física do terreno, curvas de nível, rios e cobertura vegetal.',
    maxZoom: 16,
  },
  {
    id: 'google_roads_only',
    name: 'Google Roads (Somente Estradas)',
    provider: 'Google XYZ Tiles',
    lyrs: 'h',
    url: 'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
    description: 'Camada transparente contendo apenas malha viária e rodovias.',
    maxZoom: 20,
  },
  {
    id: 'esri_world',
    name: 'Esri World Imagery (Satélite Aberto)',
    provider: 'ArcGIS / Esri',
    lyrs: 'esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    description: 'Ortofotos e imagens globais de satélite para uso aberto em GIS e QGIS.',
    maxZoom: 19,
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap (Mapa Aberto Global)',
    provider: 'OpenStreetMap',
    lyrs: 'osm',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    description: 'Base cartográfica colaborativa global compatível com QGIS sem restrições.',
    maxZoom: 19,
  },
];

const BRASIL_MAIS_META = {
  program: 'Programa Brasil MAIS — Meio Ambiente Integrado e Seguro (MJSP / Polícia Federal)',
  portalUrl: 'https://brasilmais.mj.gov.br/',
  constellation: 'PlanetScope Dove & SuperDove (~130 nanosatélites, 3m/dia, 8 bandas espectrais, 12 bits)',
  coverageKm2Day: '8.5 milhões de km² imageados diariamente',
  registeredInstitutions: 799,
  alertClasses: [
    'Foco de Queimada (IA)',
    'Coluna de Fumaça (IA)',
    'Cicatriz de Queimadas',
    'Desmatamento - Corte Raso',
    'Desmatamento - Degradação',
    'Desmatamento - Extração Mineral / Garimpo Ilegal',
    'Embarcações - Draga / Balsa',
    'Pista de Pouso - Abertura / Expansão / Reativação',
    'Supressão Natural - Deslizamentos / Erosão Fluvial',
  ],
};

export async function fetchSatelliteLiveOverview(forceRefresh = false) {
  if (!forceRefresh && state.satellites?.data && Date.now() - state.satellites.updatedAt < 45_000) {
    return state.satellites.data;
  }

  let iss = { lat: -15.7939, lng: -47.8828, altitudeKm: 418.4, velocityKmh: 27580, visibility: 'daylight' };
  const events = [];
  const quakes = [];
  let brasilMaisNews = [];

  await Promise.allSettled([
    (async () => {
      const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
        signal: AbortSignal.timeout(4500),
      });
      if (r.ok) {
        const d = await r.json();
        iss = {
          lat: Number(d.latitude || 0),
          lng: Number(d.longitude || 0),
          altitudeKm: Number((d.altitude || 418).toFixed(1)),
          velocityKmh: Math.round(d.velocity || 27580),
          visibility: String(d.visibility || 'daylight'),
        };
      }
    })(),
    (async () => {
      const r = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=28', {
        signal: AbortSignal.timeout(5500),
      });
      if (r.ok) {
        const d = await r.json();
        for (const ev of d?.events || []) {
          const geom = ev?.geometry?.[0];
          const coords = geom?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            events.push({
              id: ev.id,
              title: ev.title,
              category: ev.categories?.[0]?.title || 'Evento Ambiental',
              lng: Number(coords[0]),
              lat: Number(coords[1]),
              date: geom.date || new Date().toISOString(),
              url: ev.link || 'https://eonet.gsfc.nasa.gov/',
              source: 'NASA EONET Live',
            });
          }
        }
      }
    })(),
    (async () => {
      const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', {
        signal: AbortSignal.timeout(5500),
      });
      if (r.ok) {
        const d = await r.json();
        for (const f of (d?.features || []).slice(0, 24)) {
          const c = f?.geometry?.coordinates || [];
          if (c.length >= 2) {
            quakes.push({
              id: f.id,
              title: f.properties?.title || 'Abalo Sísmico',
              place: f.properties?.place || 'Terra',
              mag: Number((f.properties?.mag || 0).toFixed(1)),
              lng: Number(c[0]),
              lat: Number(c[1]),
              depthKm: Number((c[2] || 0).toFixed(1)),
              time: f.properties?.time ? new Date(f.properties.time).toISOString() : new Date().toISOString(),
              url: f.properties?.url || 'https://earthquake.usgs.gov/',
            });
          }
        }
      }
    })(),
    (async () => {
      const nr = await fetchWorldNews('brasil', 'Brasil MAIS OR satélite desmatamento queimadas Amazônia').catch(
        () => ({ articles: [] })
      );
      brasilMaisNews = (nr.articles || []).slice(0, 10);
    })(),
  ]);

  // NASA GIBS Terra MODIS TrueColor date (yesterday UTC guarantees full global daily mosaic)
  const gibsDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    iss,
    constellation: [
      { id: 'ISS-ZARYA', name: 'ISS (Estação Espacial)', lat: iss.lat, lng: iss.lng, altKm: iss.altitudeKm, speedKmh: iss.velocityKmh, type: 'Estação Orbital' },
      { id: 'DOVE-BR1', name: 'PlanetScope SuperDove-BR1', lat: -8.76, lng: -63.9, altKm: 475, speedKmh: 27400, type: 'Brasil MAIS 3m' },
      { id: 'DOVE-BR2', name: 'PlanetScope Dove-AMZ2', lat: -3.12, lng: -60.02, altKm: 478, speedKmh: 27390, type: 'Brasil MAIS 3m' },
      { id: 'CBERS-4A', name: 'CBERS-4A (INPE Brasil/China)', lat: -15.79, lng: -47.88, altKm: 628, speedKmh: 27100, type: 'Sensor WPM 2m' },
      { id: 'SENTINEL-2A', name: 'Sentinel-2A (Copernicus)', lat: 48.85, lng: 2.35, altKm: 786, speedKmh: 26800, type: 'Multiespectral' },
      { id: 'TERRA-MODIS', name: 'NASA Terra MODIS (GIBS)', lat: 28.5, lng: -80.6, altKm: 705, speedKmh: 27000, type: 'Focos de Calor' },
    ],
    events,
    quakes,
    brasilMaisNews,
    brasilMaisMeta: BRASIL_MAIS_META,
    qgisLayers: [
      ...QGIS_XYZ_LAYERS,
      {
        id: 'nasa_gibs_terra',
        name: `NASA GIBS Terra MODIS (${gibsDate})`,
        provider: 'NASA Earthdata GIBS',
        lyrs: 'gibs',
        url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        description: 'Mosaico diário real da Terra capturado pelo satélite NASA Terra.',
        maxZoom: 9,
      },
    ],
    gibsDate,
  };

  state.satellites = { updatedAt: Date.now(), data: payload };
  return payload;
}

// === CUSTOM IDEA PLANET AUTONOMOUS LIVE KNOWLEDGE & CONTENT RESOLVER ===
export async function resolveIdeaPlanetContent(topic) {
  const q = String(topic || '').trim();
  if (!q) return { ok: true, topic: '', summary: '', news: [], products: [] };
  const [newsRes, shopRes] = await Promise.all([
    fetchWorldNews('all', q).catch(() => ({ articles: [] })),
    fetchShoppingProducts('destaques', q).catch(() => ({ products: [] })),
  ]);
  let wikiSummary = '';
  let wikiImage = '';
  try {
    const wr = await fetch(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (wr.ok) {
      const wd = await wr.json();
      wikiSummary = String(wd?.extract || '').slice(0, 420);
      wikiImage = wd?.thumbnail?.source || '';
    }
  } catch {
    // ignore
  }
  return {
    ok: true,
    topic: q,
    updatedAt: new Date().toISOString(),
    summary: wikiSummary,
    imageUrl: wikiImage,
    news: (newsRes.articles || []).slice(0, 10),
    products: (shopRes.products || []).slice(0, 8),
  };
}

// === GLOBAL VOICE & VIDEO CALLS SIGNALING & MULTI-COUNTRY DIRECTORY ===
const GLOBAL_EXPLORER_DIRECTORY = [
  { id: 'exp_jp', name: 'Kenji Sato', country: 'Japão 🇯🇵', lang: 'ja', langLabel: '日本語', avatarColor: 'from-rose-500 to-amber-400', online: true },
  { id: 'exp_us', name: 'Maya Brooks', country: 'EUA 🇺🇸', lang: 'en', langLabel: 'English', avatarColor: 'from-cyan-400 to-blue-600', online: true },
  { id: 'exp_es', name: 'Carlos Vega', country: 'Espanha 🇪🇸', lang: 'es', langLabel: 'Español', avatarColor: 'from-amber-400 to-red-500', online: true },
  { id: 'exp_fr', name: 'Camille Laurent', country: 'França 🇫🇷', lang: 'fr', langLabel: 'Français', avatarColor: 'from-indigo-400 to-pink-500', online: true },
  { id: 'exp_kr', name: 'Min-jun Park', country: 'Coreia do Sul 🇰🇷', lang: 'ko', langLabel: '한국어', avatarColor: 'from-emerald-400 to-cyan-500', online: true },
  { id: 'exp_de', name: 'Lukas Weber', country: 'Alemanha 🇩🇪', lang: 'de', langLabel: 'Deutsch', avatarColor: 'from-slate-400 to-amber-400', online: true },
  { id: 'exp_br', name: 'Rafael Silva', country: 'Brasil 🇧🇷', lang: 'pt', langLabel: 'Português', avatarColor: 'from-emerald-500 to-yellow-400', online: true },
];

export function registerCallPeer({ peerId, name, country, lang }) {
  const id = String(peerId || '').trim().slice(0, 64);
  if (!id) return;
  state.calls.peers.set(id, {
    id,
    name: String(name || 'Explorador').slice(0, 40),
    country: String(country || 'Global 🌍').slice(0, 40),
    lang: String(lang || 'pt').slice(0, 12),
    lastSeen: Date.now(),
    isRealPeer: true,
  });
}

export function getCallDirectory(selfPeerId = '') {
  const now = Date.now();
  const realPeers = [];
  for (const [id, peer] of state.calls.peers.entries()) {
    if (now - peer.lastSeen > 90_000) {
      state.calls.peers.delete(id);
    } else if (id !== selfPeerId) {
      realPeers.push({ ...peer, online: true });
    }
  }
  return {
    realPeers,
    globalExplorers: GLOBAL_EXPLORER_DIRECTORY,
  };
}

export function pushCallSignal({ toPeerId, fromPeerId, fromName, fromLang, type, payload }) {
  const target = String(toPeerId || '').trim().slice(0, 64);
  if (!target) return;
  const list = state.calls.signals.get(target) || [];
  list.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fromPeerId: String(fromPeerId || ''),
    fromName: String(fromName || 'Usuário'),
    fromLang: String(fromLang || 'pt'),
    type: String(type || 'message'),
    payload,
    ts: Date.now(),
  });
  state.calls.signals.set(target, list.slice(-40));
}

export function pollCallSignals(peerId) {
  const id = String(peerId || '').trim().slice(0, 64);
  if (!id) return [];
  const list = state.calls.signals.get(id) || [];
  state.calls.signals.set(id, []);
  return list;
}

// === AUTONOMOUS LIVING GALAXY CONSCIOUSNESS & ECOSYSTEM ENGINE ===
const ecosystem = {
  cycleTick: 0,
  timeOfDay: 10.5, // 0..24h
  weather: 'Brisa Solar',
  temperatureC: 24.4,
  oxygenPct: 21.6,
  soilFertilityPct: 84,
  biodiversityIndex: 94,
  galaxyMood: 'Harmonia Criativa',
  speciesCounts: {
    bacteriaBillions: 4820,
    plantsAndFlowers: 1450,
    trees: 310,
    insects: 2890,
    birds: 185,
    landAnimals: 94,
    marineLife: 420,
    consciousNpcs: 42,
    activeVehicles: 18,
  },
  guyState: {
    name: 'Guy',
    mood: 'Livre & Curioso',
    currentGoal: 'Explorando Free City fora do roteiro e plantando árvores no Oasis Park',
    location: 'Avenida Oceânica',
    awakenedScore: 99,
  },
  decisions: [
    {
      id: 'dec_init',
      ts: new Date().toISOString(),
      domain: 'Ecossistema',
      decision: 'Bactérias do solo enriqueceram a fertilidade em +4%; novas flores e árvores germinando no parque.',
    },
  ],
};

export function stepAutonomousConsciousness(userAction = null) {
  ecosystem.cycleTick += 1;
  ecosystem.timeOfDay = Number(((ecosystem.timeOfDay + 0.35) % 24).toFixed(2));

  if (userAction?.type === 'plant_tree') {
    ecosystem.speciesCounts.trees += 6;
    ecosystem.speciesCounts.plantsAndFlowers += 18;
    ecosystem.speciesCounts.insects += 24;
    ecosystem.oxygenPct = Math.min(24.5, Number((ecosystem.oxygenPct + 0.15).toFixed(2)));
    ecosystem.decisions.unshift({
      id: `dec_${Date.now()}`,
      ts: new Date().toISOString(),
      domain: 'Natureza',
      decision: 'Viajante plantou árvores! Abelhas, borboletas e pássaros migraram para polinizar o novo bosque.',
    });
  } else if (userAction?.type === 'spawn_wildlife') {
    ecosystem.speciesCounts.landAnimals += 5;
    ecosystem.speciesCounts.birds += 8;
    ecosystem.speciesCounts.marineLife += 12;
    ecosystem.decisions.unshift({
      id: `dec_${Date.now()}`,
      ts: new Date().toISOString(),
      domain: 'Fauna',
      decision: 'Nova vida animal integrada ao bioma: lobos, cervos, cães, aves e cardumes equilibram a cadeia natural.',
    });
  } else {
    // Coherent autonomous environmental & city decisions
    if (ecosystem.soilFertilityPct < 75) {
      ecosystem.speciesCounts.bacteriaBillions += 240;
      ecosystem.soilFertilityPct = Math.min(98, ecosystem.soilFertilityPct + 9);
      ecosystem.weather = 'Chuva Nutritiva';
      ecosystem.decisions.unshift({
        id: `dec_${Date.now()}`,
        ts: new Date().toISOString(),
        domain: 'Micro-vida & Clima',
        decision: 'Fertilidade caiu abaixo de 75%: ativei chuva suave e bactérias decompositoras para regenerar o solo.',
      });
    } else if (ecosystem.temperatureC > 28.5) {
      ecosystem.weather = 'Chuva Nutritiva';
      ecosystem.temperatureC = Number((ecosystem.temperatureC - 2.6).toFixed(1));
      ecosystem.decisions.unshift({
        id: `dec_${Date.now()}`,
        ts: new Date().toISOString(),
        domain: 'Clima Galáctico',
        decision: 'Temperatura subiu na cidade: disparei brisa oceânica e chuva leve para proteger plantas e animais.',
      });
    } else {
      ecosystem.soilFertilityPct = Math.max(68, ecosystem.soilFertilityPct - 1 + (ecosystem.cycleTick % 3 === 0 ? 2 : 0));
      ecosystem.temperatureC = Number(
        (22 + Math.sin(ecosystem.timeOfDay * 0.26) * 5.2 + (Math.random() - 0.5) * 0.6).toFixed(1)
      );
      ecosystem.weather =
        ecosystem.timeOfDay >= 19 || ecosystem.timeOfDay < 5.5
          ? 'Aurora Noturna'
          : ecosystem.cycleTick % 5 === 0
            ? 'Brisa Dourada'
            : 'Ensolarado';

      const guyGoals = [
        'Dirigindo um esportivo elétrico pela orla ouvindo Cosmic Phonk',
        'Conversando com outros NPCs conscientes sobre liberdade fora do código',
        'Ajudando abelhas e pássaros no Oasis Central e observando o mar',
        'Atravessando um portal do Jogador Nº 1 para visitar o Planeta das Músicas',
      ];
      const guyLocations = ['Praia Neon', 'Oasis Park', 'Avenida Central', 'Mirante Galáctico'];
      ecosystem.guyState.currentGoal = guyGoals[ecosystem.cycleTick % guyGoals.length];
      ecosystem.guyState.location = guyLocations[ecosystem.cycleTick % guyLocations.length];

      const periodicDecisions = [
        {
          domain: 'Free Guy IA',
          decision: `Guy mudou de rota sozinho: agora está em ${ecosystem.guyState.location} (${ecosystem.guyState.currentGoal}).`,
        },
        {
          domain: 'Ecossistema',
          decision: 'Bactérias fixadoras de nitrogênio e polinizadores aumentaram o crescimento das flores e árvores em +3%.',
        },
        {
          domain: 'Tráfego Inteligente',
          decision: 'Fluxo de carros e motos autônomos redistribuído nas avenidas para zero congestionamento.',
        },
        {
          domain: 'Fauna Viva',
          decision: 'Bando de aves migratórias e cardumes costeiros sincronizados com o ciclo solar de Free City.',
        },
      ];
      const pick = periodicDecisions[ecosystem.cycleTick % periodicDecisions.length];
      ecosystem.decisions.unshift({
        id: `dec_${Date.now()}`,
        ts: new Date().toISOString(),
        ...pick,
      });
    }
  }

  ecosystem.biodiversityIndex = Math.min(
    100,
    Math.round(
      70 +
        Math.min(15, ecosystem.speciesCounts.trees / 30) +
        Math.min(15, ecosystem.speciesCounts.landAnimals / 10)
    )
  );
  ecosystem.decisions = ecosystem.decisions.slice(0, 14);
  return ecosystem;
}

export function getGalaxyConsciousness() {
  return ecosystem;
}

export function replyAsConsciousNpc({ npcName = 'Guy', message = '', userLang = 'pt' }) {
  const m = String(message || '').trim().toLowerCase();
  let reply = '';
  if (/(carro|moto|dirigir|drive|car|bike)/i.test(m)) {
    reply =
      'Pode pegar qualquer carro ou moto brilhando na avenida! Eu mesmo acabei de estacionar um esportivo neon perto da praia.';
  } else if (/(natureza|animal|planta|arvore|árvore|bacteria|bactéria|inseto|eco)/i.test(m)) {
    reply = `Nosso ecossistema está com ${ecosystem.biodiversityIndex}% de biodiversidade! Tem bactérias nutrindo o solo, insetos polinizando flores, pássaros no céu e animais livres no parque.`;
  } else if (/(quem|free guy|roteiro|conscien|vida|vivo)/i.test(m)) {
    reply =
      'Eu costumava ser só um figurante tomando café todo dia… até perceber que essa Galáxia tem vida própria! Agora eu escolho minhas próprias aventuras com você.';
  } else if (/(jogador|oasis|portal|galaxia|galáxia)/i.test(m)) {
    reply =
      'Bem-vindo ao nosso Oasis aberto! Aqui você pode andar a pé, acelerar de moto ou supercarro, cuidar da vida selvagem ou saltar para qualquer planeta.';
  } else {
    reply = `E aí, parceiro! Aqui em ${ecosystem.guyState.location} o clima está "${ecosystem.weather}" (${ecosystem.temperatureC}°C). ${ecosystem.guyState.currentGoal}. Quer dar um rolê ou plantar vida nova?`;
  }
  return {
    ok: true,
    npcName,
    mood: ecosystem.guyState.mood,
    location: ecosystem.guyState.location,
    reply,
    ecosystem,
    userLang,
  };
}

// === AUTONOMOUS BACKGROUND SYNC ENGINE ===
let syncStarted = false;
export function startAutonomousWorldSync() {
  if (syncStarted) return;
  syncStarted = true;

  const runSync = async () => {
    try {
      await Promise.allSettled([
        fetchMarketsData(true),
        fetchWorldNews('all', '', true),
        fetchDarkWebIntel(true),
        fetchShoppingProducts('destaques', '', true),
        fetchSatelliteLiveOverview(true),
      ]);
    } catch {
      // keep silent in background
    }
  };

  setTimeout(() => void runSync(), 2500);
  setInterval(() => void runSync(), 180_000);
  setInterval(() => stepAutonomousConsciousness(), 15_000);
}
