import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const HUB_PATH = path.join(DATA_DIR, 'cosmic-hub.json');

export const WHEEL_SLICES = [
  { id: 't25', label: '+25 Tokens', tokens: 25, extraSpin: 0, badge: '', color: '#06b6d4' },
  { id: 't50', label: '+50 Tokens', tokens: 50, extraSpin: 0, badge: '', color: '#ec4899' },
  { id: 'spin', label: 'Giro Extra +1', tokens: 15, extraSpin: 1, badge: '', color: '#8b5cf6' },
  { id: 't100', label: '+100 Tokens', tokens: 100, extraSpin: 0, badge: '', color: '#10b981' },
  { id: 't250', label: '+250 Tokens', tokens: 250, extraSpin: 0, badge: '', color: '#f59e0b' },
  { id: 'vip', label: 'Badge Cósmica', tokens: 75, extraSpin: 0, badge: '🌌 Explorador VIP', color: '#3b82f6' },
  { id: 't500', label: '+500 Tokens', tokens: 500, extraSpin: 0, badge: '👑 Mestre Phonk', color: '#f43f5e' },
  { id: 't40', label: '+40 Tokens', tokens: 40, extraSpin: 0, badge: '', color: '#14b8a6' },
];

export const COSMIC_MISSIONS = [
  {
    id: 'listen_music',
    title: 'Ouvir Música no Player 3D',
    description: 'Dê play em qualquer faixa no catálogo ou no Buraco Negro 3D',
    rewardTokens: 50,
    rewardSpins: 1,
    emoji: '🎧',
  },
  {
    id: 'share_app',
    title: 'Compartilhar o App com Amigos',
    description: 'Envie o link oficial do LENKYX no WhatsApp ou redes sociais',
    rewardTokens: 80,
    rewardSpins: 1,
    emoji: '🚀',
  },
  {
    id: 'join_giveaway',
    title: 'Participar do Sorteio Gratuito',
    description: 'Garanta seu número da sorte grátis em qualquer sorteio aberto',
    rewardTokens: 60,
    rewardSpins: 1,
    emoji: '🎁',
  },
];

function createSeedState() {
  const now = new Date().toISOString();
  return {
    giveaways: [
      {
        id: 'giveaway-cosmic-vip-1',
        title: '🎁 Sorteio 100% Gratuito — Kit Patrono Cosmic Phonk',
        description:
          'Participação totalmente gratuita para fãs cadastrados! Sem depósito e sem exposição de CPF. Ao atingir o mínimo ou máximo de participantes, o sistema sorteia aleatoriamente um número da sorte.',
        prizeSummary: 'Badge Patrono VIP + 500 Tokens Cósmicos + Faixa Inédita Antecipada',
        minParticipants: 5,
        maxParticipants: 100,
        status: 'open',
        entries: [],
        winner: null,
        createdAt: now,
      },
      {
        id: 'giveaway-destaque-comunidade',
        title: '🌌 Sorteio Grátis — Destaque Oficial na Galáxia LENKYX',
        description:
          'Concorra gratuitamente com 1 clique! O vencedor ganha destaque no Mural da Comunidade + +300 Tokens Cósmicos na conta.',
        prizeSummary: 'Destaque no Mural Oficial + 300 Tokens Cósmicos + Badge VIP',
        minParticipants: 3,
        maxParticipants: 50,
        status: 'open',
        entries: [],
        winner: null,
        createdAt: now,
      },
    ],
    goals: [
      {
        id: 'goal-clipe-3d',
        title: '🎬 Meta Videoclipe 3D Buraco Negro — Cosmic Phonk',
        description:
          'Financiamento coletivo 100% voluntário para produção visual 3D, masterização Dolby e distribuição global nas plataformas.',
        targetAmount: 1500,
        currentAmount: 320,
        perkGuaranteed: 'Nome nos créditos oficiais do clipe + Badge Apoiador Fundador + Acesso antecipado',
        supporters: [
          {
            id: 'sup-seed-1',
            name: 'Comunidade Cosmic Phonk',
            amount: 320,
            method: 'PIX / PicPay',
            message: 'Rumo às 1.000 faixas! 🚀',
            platformFee: 16,
            netAmount: 304,
            createdAt: now,
          },
        ],
        createdAt: now,
      },
      {
        id: 'goal-servidor-global',
        title: '🛰️ Servidor Global 24h + TV Online & App Android',
        description:
          'Apoio voluntário para manter o streaming de músicas, TV online verificada e atualizações contínuas do APK Android.',
        targetAmount: 800,
        currentAmount: 180,
        perkGuaranteed: 'Badge Guardião da Galáxia + +200 Tokens Cósmicos de agradecimento',
        supporters: [
          {
            id: 'sup-seed-2',
            name: 'Apoiadores Iniciais',
            amount: 180,
            method: 'Cartão / Global',
            message: 'App incrível!',
            platformFee: 9,
            netAmount: 171,
            createdAt: now,
          },
        ],
        createdAt: now,
      },
    ],
    wallets: {},
    recentWheelWins: [],
  };
}

function readHub() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(HUB_PATH)) {
      const seed = createSeedState();
      fs.writeFileSync(HUB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const parsed = JSON.parse(fs.readFileSync(HUB_PATH, 'utf-8'));
    if (!parsed || !Array.isArray(parsed.giveaways) || !Array.isArray(parsed.goals)) {
      const seed = createSeedState();
      fs.writeFileSync(HUB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    parsed.wallets = parsed.wallets || {};
    parsed.recentWheelWins = Array.isArray(parsed.recentWheelWins) ? parsed.recentWheelWins : [];
    return parsed;
  } catch {
    return createSeedState();
  }
}

function writeHub(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${HUB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, HUB_PATH);
}

function ensureWallet(hub, userId, userName = 'Explorador') {
  const safeId = String(userId || 'guest').slice(0, 64);
  if (!hub.wallets[safeId]) {
    hub.wallets[safeId] = {
      userId: safeId,
      userName: String(userName || 'Explorador').slice(0, 48),
      tokens: 100, // welcome bonus
      bonusSpins: 1,
      lastFreeSpinAt: 0,
      badges: [],
      claimedMissions: {},
    };
  }
  if (userName) hub.wallets[safeId].userName = String(userName).slice(0, 48);
  return hub.wallets[safeId];
}

function sanitizeGiveaway(g, currentUserId) {
  const myEntry = currentUserId
    ? g.entries.find((e) => e.userId === currentUserId) || null
    : null;
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    prizeSummary: g.prizeSummary,
    minParticipants: g.minParticipants,
    maxParticipants: g.maxParticipants,
    participantCount: g.entries.length,
    status: g.status,
    myTicket: myEntry ? myEntry.ticketNumber : null,
    recentParticipants: g.entries
      .slice(-12)
      .reverse()
      .map((e) => ({ userName: e.userName, ticketNumber: e.ticketNumber, joinedAt: e.joinedAt })),
    winner: g.winner,
    createdAt: g.createdAt,
  };
}

export function getHubOverview(userId = '', userName = '') {
  const hub = readHub();
  const wallet = userId ? ensureWallet(hub, userId, userName) : null;
  if (wallet) writeHub(hub);

  const now = Date.now();
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const freeSpinReady = wallet ? now - (wallet.lastFreeSpinAt || 0) >= COOLDOWN_MS : true;
  const nextFreeSpinAt = wallet && !freeSpinReady ? (wallet.lastFreeSpinAt || 0) + COOLDOWN_MS : 0;
  const todayKey = new Date().toISOString().slice(0, 10);

  return {
    giveaways: hub.giveaways.map((g) => sanitizeGiveaway(g, userId)),
    goals: hub.goals,
    missions: COSMIC_MISSIONS.map((m) => ({
      ...m,
      claimedToday: Boolean(wallet?.claimedMissions?.[m.id] === todayKey),
    })),
    wheelSlices: WHEEL_SLICES,
    recentWheelWins: hub.recentWheelWins.slice(0, 12),
    wallet: wallet
      ? {
          userId: wallet.userId,
          userName: wallet.userName,
          tokens: wallet.tokens,
          bonusSpins: wallet.bonusSpins,
          freeSpinReady,
          nextFreeSpinAt,
          availableSpins: (freeSpinReady ? 1 : 0) + (wallet.bonusSpins || 0),
          badges: wallet.badges || [],
        }
      : {
          userId: '',
          userName: 'Visitante',
          tokens: 0,
          bonusSpins: 0,
          freeSpinReady: true,
          nextFreeSpinAt: 0,
          availableSpins: 0,
          badges: [],
        },
  };
}

export function joinFreeGiveaway({ giveawayId, userId, userName }) {
  const cleanUserId = String(userId || '').trim();
  const cleanName = String(userName || '').trim() || 'Fã LENKYX';
  if (!cleanUserId) throw new Error('Faça login gratuito para garantir seu número da sorte.');

  const hub = readHub();
  const g = hub.giveaways.find((item) => item.id === giveawayId);
  if (!g) throw new Error('Sorteio não encontrado.');
  if (g.status !== 'open') throw new Error('Este sorteio já foi encerrado.');

  const existing = g.entries.find((e) => e.userId === cleanUserId);
  if (existing) {
    return {
      alreadyJoined: true,
      ticketNumber: existing.ticketNumber,
      giveaway: sanitizeGiveaway(g, cleanUserId),
    };
  }

  if (g.entries.length >= g.maxParticipants) {
    throw new Error('Quantidade máxima de participantes atingida!');
  }

  // Generate unique lucky ticket (no CPF, purely random alphanumeric code)
  const used = new Set(g.entries.map((e) => e.ticketNumber));
  let ticketNumber = '';
  for (let i = 0; i < 20; i++) {
    const code = crypto.randomInt(1000, 9999);
    const candidate = `LX-${code}`;
    if (!used.has(candidate)) {
      ticketNumber = candidate;
      break;
    }
  }
  if (!ticketNumber) ticketNumber = `LX-${Date.now().toString().slice(-4)}`;

  g.entries.push({
    id: `ent-${crypto.randomUUID().slice(0, 8)}`,
    userId: cleanUserId,
    userName: cleanName.slice(0, 48),
    ticketNumber,
    joinedAt: new Date().toISOString(),
  });

  // Auto-draw using CSPRNG when maximum limit is reached
  let autoDrawnWinner = null;
  if (g.entries.length >= g.maxParticipants && g.entries.length >= g.minParticipants) {
    const winIdx = crypto.randomInt(0, g.entries.length);
    const winEntry = g.entries[winIdx];
    g.status = 'drawn';
    g.winner = {
      ticketNumber: winEntry.ticketNumber,
      userName: winEntry.userName,
      userId: winEntry.userId,
      drawnAt: new Date().toISOString(),
    };
    autoDrawnWinner = g.winner;
    const winWallet = ensureWallet(hub, winEntry.userId, winEntry.userName);
    winWallet.tokens += 300;
    if (!winWallet.badges.includes('🏆 Vencedor Sorteio Grátis')) {
      winWallet.badges.push('🏆 Vencedor Sorteio Grátis');
    }
  }

  writeHub(hub);
  return {
    alreadyJoined: false,
    ticketNumber,
    autoDrawnWinner,
    giveaway: sanitizeGiveaway(g, cleanUserId),
  };
}

export function drawFreeGiveaway({ giveawayId }) {
  const hub = readHub();
  const g = hub.giveaways.find((item) => item.id === giveawayId);
  if (!g) throw new Error('Sorteio não encontrado.');
  if (g.status === 'drawn' && g.winner) {
    return { giveaway: sanitizeGiveaway(g, ''), winner: g.winner };
  }
  if (g.entries.length < g.minParticipants) {
    throw new Error(
      `Ainda faltam participantes: mínimo de ${g.minParticipants}, atualmente ${g.entries.length}.`
    );
  }
  const winIdx = crypto.randomInt(0, g.entries.length);
  const winEntry = g.entries[winIdx];
  g.status = 'drawn';
  g.winner = {
    ticketNumber: winEntry.ticketNumber,
    userName: winEntry.userName,
    userId: winEntry.userId,
    drawnAt: new Date().toISOString(),
  };
  const winWallet = ensureWallet(hub, winEntry.userId, winEntry.userName);
  winWallet.tokens += 300;
  if (!winWallet.badges.includes('🏆 Vencedor Sorteio Grátis')) {
    winWallet.badges.push('🏆 Vencedor Sorteio Grátis');
  }
  writeHub(hub);
  return { giveaway: sanitizeGiveaway(g, ''), winner: g.winner };
}

export function createFreeGiveaway({ title, description, prizeSummary, minParticipants, maxParticipants }) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) throw new Error('Informe o título do sorteio gratuito.');
  const minP = Math.max(2, Math.min(5000, Number(minParticipants) || 5));
  const maxP = Math.max(minP, Math.min(10000, Number(maxParticipants) || 100));

  const hub = readHub();
  const created = {
    id: `giveaway-${Date.now().toString(36)}`,
    title: cleanTitle.slice(0, 120),
    description:
      String(description || '').trim().slice(0, 400) ||
      'Sorteio 100% gratuito para fãs do aplicativo LENKYX. Sem depósito e sem CPF.',
    prizeSummary: String(prizeSummary || '').trim().slice(0, 160) || 'Prêmio Especial LENKYX + Tokens',
    minParticipants: minP,
    maxParticipants: maxP,
    status: 'open',
    entries: [],
    winner: null,
    createdAt: new Date().toISOString(),
  };
  hub.giveaways.unshift(created);
  writeHub(hub);
  return sanitizeGiveaway(created, '');
}

export function createSupportGoal({ title, description, targetAmount, perkGuaranteed }) {
  const cleanTitle = String(title || '').trim();
  const target = Math.max(50, Math.min(1000000, Number(targetAmount) || 500));
  if (!cleanTitle) throw new Error('Informe o título da meta.');

  const hub = readHub();
  const goal = {
    id: `goal-${Date.now().toString(36)}`,
    title: cleanTitle.slice(0, 120),
    description: String(description || '').trim().slice(0, 400) || 'Meta voluntária da comunidade LENKYX.',
    targetAmount: target,
    currentAmount: 0,
    perkGuaranteed:
      String(perkGuaranteed || '').trim().slice(0, 200) ||
      'Badge exclusiva de Apoiador + Nome nos Créditos',
    supporters: [],
    createdAt: new Date().toISOString(),
  };
  hub.goals.unshift(goal);
  writeHub(hub);
  return goal;
}

export function recordGoalSupport({ goalId, supporterName, amount, method, message, userId }) {
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount < 1 || numAmount > 100000) {
    throw new Error('Informe um valor válido de apoio voluntário (R$ 1 a R$ 100.000).');
  }
  const hub = readHub();
  const goal = hub.goals.find((item) => item.id === goalId);
  if (!goal) throw new Error('Meta não encontrada.');

  const platformFee = Math.round(numAmount * 0.05 * 100) / 100;
  const netAmount = Math.round((numAmount - platformFee) * 100) / 100;
  const entry = {
    id: `sup-${Date.now().toString(36)}`,
    name: String(supporterName || 'Fã Cósmico').trim().slice(0, 48) || 'Fã Cósmico',
    amount: numAmount,
    method: String(method || 'PIX / PicPay').slice(0, 40),
    message: String(message || '').trim().slice(0, 160),
    platformFee,
    netAmount,
    createdAt: new Date().toISOString(),
  };

  goal.supporters.unshift(entry);
  goal.supporters = goal.supporters.slice(0, 80);
  goal.currentAmount = Math.round((Number(goal.currentAmount || 0) + numAmount) * 100) / 100;

  if (userId) {
    const wallet = ensureWallet(hub, userId, entry.name);
    wallet.tokens += Math.min(500, Math.max(20, Math.round(numAmount * 5)));
    if (!wallet.badges.includes('💜 Apoiador Oficial')) {
      wallet.badges.push('💜 Apoiador Oficial');
    }
  }

  writeHub(hub);
  return { goal, entry };
}

export function spinCosmicWheel({ userId, userName }) {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId) throw new Error('Entre com sua conta gratuita para girar a Roleta Cósmica!');

  const hub = readHub();
  const wallet = ensureWallet(hub, cleanUserId, userName);
  const now = Date.now();
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const freeReady = now - (wallet.lastFreeSpinAt || 0) >= COOLDOWN_MS;

  if (!freeReady && (wallet.bonusSpins || 0) <= 0) {
    const minsLeft = Math.max(1, Math.ceil(((wallet.lastFreeSpinAt || 0) + COOLDOWN_MS - now) / 60000));
    throw new Error(`Sem giros disponíveis agora. Próximo giro grátis em ${minsLeft} min ou complete uma missão!`);
  }

  if (freeReady) {
    wallet.lastFreeSpinAt = now;
  } else {
    wallet.bonusSpins = Math.max(0, (wallet.bonusSpins || 0) - 1);
  }

  const sliceIndex = crypto.randomInt(0, WHEEL_SLICES.length);
  const prize = WHEEL_SLICES[sliceIndex];
  wallet.tokens += prize.tokens;
  wallet.bonusSpins += prize.extraSpin;
  if (prize.badge && !wallet.badges.includes(prize.badge)) {
    wallet.badges.push(prize.badge);
  }

  hub.recentWheelWins.unshift({
    id: `win-${Date.now().toString(36)}`,
    userName: wallet.userName,
    prizeLabel: prize.label,
    createdAt: new Date().toISOString(),
  });
  hub.recentWheelWins = hub.recentWheelWins.slice(0, 20);

  writeHub(hub);
  return {
    sliceIndex,
    prize,
    wallet: {
      userId: wallet.userId,
      userName: wallet.userName,
      tokens: wallet.tokens,
      bonusSpins: wallet.bonusSpins,
      freeSpinReady: false,
      nextFreeSpinAt: wallet.lastFreeSpinAt + COOLDOWN_MS,
      availableSpins: wallet.bonusSpins,
      badges: wallet.badges,
    },
  };
}

export function claimCosmicMission({ userId, userName, missionId }) {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId) throw new Error('Entre com sua conta gratuita para resgatar missões!');
  const mission = COSMIC_MISSIONS.find((m) => m.id === missionId);
  if (!mission) throw new Error('Missão não encontrada.');

  const hub = readHub();
  const wallet = ensureWallet(hub, cleanUserId, userName);
  const todayKey = new Date().toISOString().slice(0, 10);
  if (wallet.claimedMissions[mission.id] === todayKey) {
    throw new Error('Missão já resgatada hoje! Volte amanhã para ganhar novamente.');
  }

  wallet.claimedMissions[mission.id] = todayKey;
  wallet.tokens += mission.rewardTokens;
  wallet.bonusSpins += mission.rewardSpins;
  writeHub(hub);

  return {
    mission,
    tokensAdded: mission.rewardTokens,
    spinsAdded: mission.rewardSpins,
    tokens: wallet.tokens,
    bonusSpins: wallet.bonusSpins,
  };
}
