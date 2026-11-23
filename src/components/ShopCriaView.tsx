import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Search,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Sparkles,
  Flame,
  X,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Loader2,
  BadgeCheck,
  Settings,
  Radio,
  Heart,
  User,
  MapPin,
  Lock,
  Globe,
  LifeBuoy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppMode, AppSettings } from '../types';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';
import { SHOP_PHOTOS } from '../data/shopPhotos';
import { cloudDeleteSelf, cloudGet, cloudGoogleUrl, cloudSessionFromHash, cloudSignIn, cloudSignOut, cloudSignUp, cloudUpsert, getCloudSession, type CloudSession } from '../utils/cloudSync';
import { deleteDeviceAccount, getPrimaryDeviceAccount } from '../utils/fanAuth';
import { registerSale } from '../utils/commissionApi';

export type ShopCat =
  | 'all'
  | 'mansao'
  | 'roupas'
  | 'tenis'
  | 'oculos'
  | 'relogios'
  | 'correntes'
  | 'perfumes'
  | 'narguile'
  | 'motos'
  | 'carros'
  | 'eletronicos'
  | 'casa';

interface CriaProduct {
  id: string;
  name: string;
  brand: string;
  category: Exclude<ShopCat, 'all'>;
  priceBrl: number;
  priceLabel: string;
  badge: string;
  emoji: string;
  specs: string;
  searchQuery: string;
  imageUrl?: string;
  priceOtherLabel?: string;
  originalPriceBrl?: number;
  discountPct?: number;
  seller?: string;
  verifiedPrice?: boolean;
  commissionEst: string;
  accent: string;
  photos?: string[];
  buyUrl?: string;
  hot?: boolean;
  featured?: boolean;
}

interface LivePublishedItem {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
  storeName: string;
}

const CRIA_CATALOG: CriaProduct[] = [
  // 1. ROUPAS, BONÉS & GRIFES (LACOSTE, OAKLEY, NIKE, CYCLONE, ARMANI)
  {
    id: 'shop-lacoste-polo',
    name: 'Camisa Polo & Conjunto Lacoste Jacaré Sport',
    brand: 'Lacoste',
    category: 'roupas',
    priceBrl: 389,
    priceLabel: 'R$ 389',
    badge: '🐊 CLÁSSICO DOS CRIA',
    emoji: '🐊',
    specs: 'Tecido piquet respirável · Jacaré bordado · Kit Peita + Bermuda',
    searchQuery: 'Camisa Polo Lacoste original',
    commissionEst: '8% a 14% comissão',
    accent: 'from-emerald-500/30 to-cyan-500/20',
  },
  {
    id: 'shop-lacoste-corta',
    name: 'Jaqueta Corta-Vento Lacoste Sport Dupla Face',
    brand: 'Lacoste',
    category: 'roupas',
    priceBrl: 890,
    priceLabel: 'R$ 890',
    badge: '🐊 BRABA NO BAILE',
    emoji: '🧥',
    specs: 'Impermeável leve · Capuz ajustável · Brilho de respeito',
    searchQuery: 'Jaqueta Corta Vento Lacoste original',
    commissionEst: '10% a 14% comissão',
    accent: 'from-emerald-400/30 to-teal-600/20',
  },
  {
    id: 'shop-oakley-corta',
    name: 'Corta-Vento & Camiseta Dry-Fit Oakley Reflective',
    brand: 'Oakley',
    category: 'roupas',
    priceBrl: 449,
    priceLabel: 'R$ 449',
    badge: '⚡ REFLETIVO',
    emoji: '🦾',
    specs: 'Zíper selado · Logo O-Icon refletivo no flash do baile',
    searchQuery: 'Jaqueta corta vento Oakley original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-cyan-500/30 to-blue-600/20',
  },
  {
    id: 'shop-oakley-mochila',
    name: 'Mochila Oakley Kitchen Sink / Hardshell + Shoulder Bag',
    brand: 'Oakley · Lacoste',
    category: 'roupas',
    priceBrl: 699,
    priceLabel: 'R$ 699',
    badge: '🎒 MOCHILA DOS CRIA',
    emoji: '🎒',
    specs: 'Casco rígido de aço/nylon · Porta-óculos e notebook',
    searchQuery: 'Mochila Oakley Kitchen Sink original',
    commissionEst: '10% comissão',
    accent: 'from-slate-500/30 to-cyan-500/20',
  },
  {
    id: 'shop-nike-tech',
    name: 'Conjunto Nike Tech Fleece & Corta-Vento Windrunner',
    brand: 'Nike',
    category: 'roupas',
    priceBrl: 799,
    priceLabel: 'R$ 799',
    badge: '✔️ TECH FLEECE',
    emoji: '🔥',
    specs: 'Moletom térmico leve · Bolso selado no braço · Caimento perfeito',
    searchQuery: 'Conjunto Nike Tech Fleece original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-sky-500/25 to-indigo-600/20',
  },
  {
    id: 'shop-minas-biquini-vip',
    name: 'Kit Biquíni Luxo Corrente 24K + Saída Tule + Óculos Grife',
    brand: 'Moda Praia VIP',
    category: 'roupas',
    priceBrl: 269,
    priceLabel: 'R$ 269',
    badge: '👙 LOOK DAS MINAS',
    emoji: '👙',
    specs: 'Biquíni preto detalhes dourados · Saída de tela · Brilho na piscina & baile',
    searchQuery: 'Biquini preto corrente dourada saida praia luxo',
    commissionEst: '12% a 16% comissão',
    accent: 'from-pink-500/30 to-amber-500/20',
  },
  {
    id: 'shop-minas-baile-cargo',
    name: 'Look Baile Feminino Cropped Grife + Calça Cargo Streetwear',
    brand: 'Streetwear Feminino',
    category: 'roupas',
    priceBrl: 329,
    priceLabel: 'R$ 329',
    badge: '💃 ESTILO DA QUEBRADA',
    emoji: '✨',
    specs: 'Cropped estruturado + calça cargo bolsos laterais · Caimento de modelo',
    searchQuery: 'Calca cargo feminina streetwear cropped preto',
    commissionEst: '10% a 15% comissão',
    accent: 'from-purple-500/30 to-pink-500/20',
  },
  {
    id: 'shop-cyclone-veludo',
    name: 'Bermuda Cyclone Veludo / Tactel + Boné Lacoste Aba Curva',
    brand: 'Cyclone · Lacoste',
    category: 'roupas',
    priceBrl: 299,
    priceLabel: 'R$ 299',
    badge: '🧢 KIT QUEBRADA',
    emoji: '🧢',
    specs: 'Estampa clássica de baile funk · Conforto total pro rolê',
    searchQuery: 'Bermuda Cyclone veludo original Bone Lacoste',
    commissionEst: '10% a 15% comissão',
    accent: 'from-amber-500/25 to-emerald-500/20',
  },
  {
    id: 'shop-boss-armani',
    name: 'Camiseta & Conjunto Hugo Boss / Armani Exchange',
    brand: 'Hugo Boss · Armani',
    category: 'roupas',
    priceBrl: 459,
    priceLabel: 'R$ 459',
    badge: '👔 PATRÃO',
    emoji: '👔',
    specs: 'Algodão pima peruano · Logo alto-relevo · Visual de patrão',
    searchQuery: 'Camiseta Hugo Boss Armani Exchange original',
    commissionEst: '8% a 14% comissão',
    accent: 'from-zinc-500/30 to-amber-500/20',
  },

  // 2. TÊNIS & CHINELOS PESADOS
  {
    id: 'shop-nike-tn',
    name: 'Tênis Nike Air Max Plus TN (Tubarão)',
    brand: 'Nike',
    category: 'tenis',
    priceBrl: 1199,
    priceLabel: 'R$ 1.199',
    badge: '🦈 O REI DO BAILE',
    emoji: '👟',
    specs: 'Amortecimento Tuned Air · Degradê agressivo · Mais pedido pelos cria',
    searchQuery: 'Tenis Nike Air Max Plus TN original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-pink-500/25 to-purple-600/20',
  },
  {
    id: 'shop-mizuno-prophecy',
    name: 'Tênis Mizuno Wave Prophecy 12 / 13 (12 Molas)',
    brand: 'Mizuno',
    category: 'tenis',
    priceBrl: 1399,
    priceLabel: 'R$ 1.399',
    badge: '⚡ 12 MOLAS',
    emoji: '⚡',
    specs: 'Placa Infinity Wave vazada · Visual futurista pesado',
    searchQuery: 'Tenis Mizuno Wave Prophecy original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-cyan-500/30 to-emerald-500/20',
  },
  {
    id: 'shop-nike-shox',
    name: 'Tênis Nike Shox NZ / R4 (4 Molas Clássico)',
    brand: 'Nike',
    category: 'tenis',
    priceBrl: 899,
    priceLabel: 'R$ 899',
    badge: '💥 CLÁSSICO 4 MOLAS',
    emoji: '💥',
    specs: 'Colunas Shox no calcanhar · Relíquia de quebrada que nunca sai de moda',
    searchQuery: 'Tenis Nike Shox NZ R4 original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-red-500/25 to-orange-500/20',
  },
  {
    id: 'shop-kenner-rakka',
    name: 'Chinelo Kenner Rakka / Kivah Gold Edition',
    brand: 'Kenner',
    category: 'tenis',
    priceBrl: 199,
    priceLabel: 'R$ 199',
    badge: '🩴 PÉ NO CHÃO',
    emoji: '🩴',
    specs: 'Palmilha macia + solado tratorado · Pingente K dourado/preto',
    searchQuery: 'Chinelo Kenner Rakka Gold original',
    commissionEst: '10% a 14% comissão',
    accent: 'from-amber-400/30 to-slate-700/30',
  },

  // 3. ÓCULOS DE MARCA (JULIET, ROMEO 2, PENNY, PRADA, RAY-BAN)
  {
    id: 'shop-juliet',
    name: 'Óculos Oakley Juliet X-Metal Plasma / Ruby',
    brand: 'Oakley',
    category: 'oculos',
    priceBrl: 1490,
    priceLabel: 'R$ 1.490',
    badge: '🕶️ LENDÁRIO',
    emoji: '🕶️',
    specs: 'Armação em liga X-Metal · Lentes polarizadas iridium camaleão',
    searchQuery: 'Oculos Oakley Juliet X Metal',
    commissionEst: '10% a 15% comissão',
    accent: 'from-red-500/30 to-amber-500/20',
  },
  {
    id: 'shop-romeo2',
    name: 'Óculos Oakley Romeo 2, Penny & Double X Titanium',
    brand: 'Oakley',
    category: 'oculos',
    priceBrl: 1690,
    priceLabel: 'R$ 1.690',
    badge: '💎 RELÍQUIA X-METAL',
    emoji: '🦾',
    specs: 'Proteção UV400 · Lente azul/verde/fogo · Design robô futurista',
    searchQuery: 'Oculos Oakley Romeo 2 Penny Double X',
    commissionEst: '10% a 15% comissão',
    accent: 'from-cyan-400/30 to-indigo-500/20',
  },
  {
    id: 'shop-radar-ev',
    name: 'Óculos Oakley Radar EV / Jawbreaker Ciclismo & Grau',
    brand: 'Oakley',
    category: 'oculos',
    priceBrl: 980,
    priceLabel: 'R$ 980',
    badge: '🏍️ PRO GRAU',
    emoji: '⚡',
    specs: 'Lente única Prizm · Trava firme no capacete e no rolê de moto',
    searchQuery: 'Oculos Oakley Radar EV Prizm original',
    commissionEst: '10% comissão',
    accent: 'from-lime-400/25 to-cyan-500/20',
  },
  {
    id: 'shop-prada-lv',
    name: 'Óculos Prada Linea Rossa & Ray-Ban Hexagonal Ouro',
    brand: 'Prada · Ray-Ban',
    category: 'oculos',
    priceBrl: 1150,
    priceLabel: 'R$ 1.150',
    badge: '✨ LUXO',
    emoji: '✨',
    specs: 'Lente degradê / espelhada · Armação italiana premium',
    searchQuery: 'Oculos Prada Linea Rossa Ray Ban Hexagonal',
    commissionEst: '8% a 12% comissão',
    accent: 'from-purple-500/30 to-pink-500/20',
  },

  // 4. RELÓGIOS DE LUXO & PESADOS
  {
    id: 'shop-invicta-bolt',
    name: 'Relógio Invicta Bolt Zeus & Reserve Magnum Dourado',
    brand: 'Invicta',
    category: 'relogios',
    priceBrl: 1490,
    priceLabel: 'R$ 1.490',
    badge: '⌚ PESADO NO PULSO',
    emoji: '⌚',
    specs: 'Caixa 52mm banhada a ouro 18k · Cabo de aço · Prova d’água 200m',
    searchQuery: 'Relogio Invicta Bolt Zeus Dourado original',
    commissionEst: '10% a 14% comissão',
    accent: 'from-amber-400/30 to-yellow-500/20',
  },
  {
    id: 'shop-invicta-pro',
    name: 'Relógio Invicta Pro Diver & Yakuza Dragon Ouro',
    brand: 'Invicta',
    category: 'relogios',
    priceBrl: 890,
    priceLabel: 'R$ 890',
    badge: '🐉 YAKUZA GOLD',
    emoji: '🐉',
    specs: 'Movimento automático japonês · Mostrador dourado detalhado',
    searchQuery: 'Relogio Invicta Yakuza Pro Diver dourado',
    commissionEst: '10% a 14% comissão',
    accent: 'from-yellow-500/30 to-red-500/20',
  },
  {
    id: 'shop-gshock',
    name: 'Relógio Casio G-Shock CasiOak & Mudmaster Full Metal',
    brand: 'G-Shock',
    category: 'relogios',
    priceBrl: 950,
    priceLabel: 'R$ 950',
    badge: '🛡️ INDESTRUTÍVEL',
    emoji: '⏱️',
    specs: 'Resistente a choques, lama e mergulho · Estilo tático futurista',
    searchQuery: 'Relogio Casio G-Shock CasiOak original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-cyan-500/30 to-slate-600/30',
  },
  {
    id: 'shop-rolex-diesel',
    name: 'Relógio Diesel Mr. Daddy 2.0 & Estilo Rolex Submariner',
    brand: 'Diesel · Alta Relojoaria',
    category: 'relogios',
    priceBrl: 1890,
    priceLabel: 'A partir de R$ 1.890',
    badge: '👑 ELITE',
    emoji: '👑',
    specs: 'Caixa gigante 57mm ou safira automática · Presença absurda',
    searchQuery: 'Relogio Diesel Mr Daddy 2.0 dourado original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-emerald-400/30 to-amber-500/20',
  },

  // 5. CORRENTES DE OURO 18K, PULSEIRAS & ICE
  {
    id: 'shop-corrente-grumet',
    name: 'Corrente Grumet 10mm a 15mm Ouro 18k + Fecho Gaveta',
    brand: 'Joalheria Ouro 18k',
    category: 'correntes',
    priceBrl: 3890,
    priceLabel: 'R$ 3.890',
    badge: '🥇 OURO 18K',
    emoji: '⛓️',
    specs: 'Elos pesados diamantados · Garantia eterna / Moeda Antiga top',
    searchQuery: 'Corrente Grumet 10mm ouro 18k fecho gaveta',
    commissionEst: '10% a 16% comissão',
    accent: 'from-yellow-400/35 to-amber-600/20',
  },
  {
    id: 'shop-cordao-cartier',
    name: 'Cordão Cadeado / Cartier Ouro 18k + Pulseira Italiana',
    brand: 'Ouro 18k · Prata 925',
    category: 'correntes',
    priceBrl: 2490,
    priceLabel: 'R$ 2.490',
    badge: '✨ KIT PESCOÇO & PULSO',
    emoji: '🥇',
    specs: 'Conjunto corrente + pulseira 60cm/70cm com brilho espelhado',
    searchQuery: 'Corrente Cadeado Cartier Ouro 18k Pulseira',
    commissionEst: '10% a 16% comissão',
    accent: 'from-amber-400/30 to-orange-500/20',
  },
  {
    id: 'shop-cordao-cravejado',
    name: 'Cordão Cuban Link + Pingente Cravejado Ice Zircônia / Cruz',
    brand: 'Ice Drip BR',
    category: 'correntes',
    priceBrl: 690,
    priceLabel: 'R$ 690',
    badge: '❄️ ICE DRIP',
    emoji: '💎',
    specs: 'Cravejamento manual em zircônia VVS · Brilha no escuro e no flash',
    searchQuery: 'Corrente Cuban Link cravejada pingente ice',
    commissionEst: '12% a 16% comissão',
    accent: 'from-cyan-300/30 to-blue-500/20',
  },
  {
    id: 'shop-anel-dedinho',
    name: 'Anel de Dedinho Cravejado Ouro 18k + Bracelete Prego',
    brand: 'Joias dos Cria',
    category: 'correntes',
    priceBrl: 590,
    priceLabel: 'R$ 590',
    badge: '💍 DEDINHO ICE',
    emoji: '💍',
    specs: 'Acabamento banhado a ouro 18k 10 camadas · Pedras cravejadas',
    searchQuery: 'Anel dedinho cravejado ouro 18k masculino',
    commissionEst: '12% comissão',
    accent: 'from-yellow-300/30 to-pink-500/20',
  },

  // 6. MOTOS ESPORTIVAS & GRAU
  {
    id: 'shop-hornet',
    name: 'Honda CB 600F Hornet · Ronco 4 Cilindros',
    brand: 'Honda',
    category: 'motos',
    priceBrl: 42900,
    priceLabel: 'R$ 42.900',
    badge: '🏍️ SONHO DA QUEBRADA',
    emoji: '🏍️',
    specs: '102 cv · 4 cilindros em linha · Escapamento só o cano / esportivo',
    searchQuery: 'Honda CB 600F Hornet a venda',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-red-600/30 to-amber-500/20',
  },
  {
    id: 'shop-s1000rr',
    name: 'BMW S1000RR · Superbike 1000cc (210 cv)',
    brand: 'BMW Motorrad',
    category: 'motos',
    priceBrl: 118900,
    priceLabel: 'R$ 118.900',
    badge: '🚀 FOGUETE',
    emoji: '🔥',
    specs: 'Quickshifter · Controle de largada · Painel TFT futurista',
    searchQuery: 'BMW S1000RR a venda Brasil',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-blue-500/35 to-cyan-400/25',
  },
  {
    id: 'shop-bmw-gs1250',
    name: 'BMW R1250 GS Adventure / F850 GS · Rainha do Asfalto',
    brand: 'BMW Motorrad',
    category: 'motos',
    priceBrl: 98500,
    priceLabel: 'R$ 98.500',
    badge: '👑 MEIOTA / 1250',
    emoji: '💨',
    specs: 'Motor Boxer 136 cv · Suspensão eletrônica · Baú e protetor',
    searchQuery: 'BMW R1250 GS a venda Brasil',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-cyan-500/30 to-amber-400/20',
  },
  {
    id: 'shop-xj6-mt09-ninja',
    name: 'Yamaha XJ6 / MT-09 & Kawasaki Ninja ZX-10R / Z900',
    brand: 'Yamaha · Kawasaki',
    category: 'motos',
    priceBrl: 48500,
    priceLabel: 'A partir de R$ 48.500',
    badge: '💨 SÓ NO GRAU',
    emoji: '⚡',
    specs: 'Torque brutal · Ronco sinistro · Ciclística perfeita pra pista',
    searchQuery: 'Yamaha XJ6 MT-09 Kawasaki Z900 a venda',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-emerald-500/30 to-lime-400/20',
  },
  {
    id: 'shop-titan-xre',
    name: 'Honda CG 160 Titan & XRE 300 Sahara + Capacete Norisk/AGV',
    brand: 'Honda · AGV',
    category: 'motos',
    priceBrl: 18900,
    priceLabel: 'A partir de R$ 18.900',
    badge: '🛵 CORRERIA & ROLÊ',
    emoji: '🪖',
    specs: 'Montadinha top + capacete esportivo com viseira camaleão',
    searchQuery: 'Capacete AGV Norisk viseira camaleao Honda Titan 160',
    commissionEst: '8% a 12% em Capacetes/Peças',
    accent: 'from-red-500/25 to-cyan-500/20',
  },

  // 7. CARROS ESPORTIVOS & NAVES
  {
    id: 'shop-bmw-320i',
    name: 'BMW 320i M Sport Turbo & BMW X6 Coupé',
    brand: 'BMW',
    category: 'carros',
    priceBrl: 249000,
    priceLabel: 'R$ 249.000',
    badge: '🚘 NAVE DOS CRIA',
    emoji: '🚘',
    specs: 'Tração traseira · Pacote M Sport · Teto solar & som Harman Kardon',
    searchQuery: 'BMW 320i M Sport a venda Brasil',
    commissionEst: 'Lead / Acessórios Auto',
    accent: 'from-cyan-500/30 to-blue-700/25',
  },
  {
    id: 'shop-golf-gti',
    name: 'VW Golf GTI / Jetta GLI Stage 2 · Pipoco no Escape',
    brand: 'Volkswagen',
    category: 'carros',
    priceBrl: 165000,
    priceLabel: 'A partir de R$ 165.000',
    badge: '🏁 TURBO BRABO',
    emoji: '🏁',
    specs: 'Motor 2.0 TSI · Câmbio DSG · Bancos xadrez esportivos & downpipe',
    searchQuery: 'Volkswagen Golf GTI Jetta GLI a venda',
    commissionEst: 'Lead / Acessórios Auto',
    accent: 'from-rose-500/30 to-purple-600/20',
  },
  {
    id: 'shop-porsche',
    name: 'Porsche 911 Carrera / Macan GTS / Cayenne',
    brand: 'Porsche',
    category: 'carros',
    priceBrl: 590000,
    priceLabel: 'A partir de R$ 590.000',
    badge: '🏆 PATAMAR MÁXIMO',
    emoji: '🏎️',
    specs: '0 a 100 km/h em 3.5s · Interior em couro & escapamento esportivo',
    searchQuery: 'Porsche 911 Macan Cayenne a venda Brasil',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-amber-400/30 to-pink-500/20',
  },
  {
    id: 'shop-mercedes-audi',
    name: 'Mercedes-Benz CLA 45 AMG & Audi RS3 / Civic Si',
    brand: 'Mercedes · Audi · Honda',
    category: 'carros',
    priceBrl: 289000,
    priceLabel: 'A partir de R$ 289.000',
    badge: '⚡ ESPORTIVO TURBO',
    emoji: '⚡',
    specs: 'Rodas aro 19 · Volante Alcântara · Som pesado de fábrica',
    searchQuery: 'Mercedes CLA 45 AMG Audi RS3 a venda',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-indigo-500/30 to-cyan-500/20',
  },
  {
    id: 'shop-evoque-hilux',
    name: 'Range Rover Evoque / Velar & Toyota Hilux SW4 Diamond',
    brand: 'Land Rover · Toyota',
    category: 'carros',
    priceBrl: 295000,
    priceLabel: 'A partir de R$ 295.000',
    badge: '🛡️ SUV DE PATRÃO',
    emoji: '🚙',
    specs: 'Teto panorâmico · Presença gigante na avenida e no baile',
    searchQuery: 'Range Rover Evoque Toyota Hilux SW4 a venda',
    commissionEst: 'Lead / Parceria Auto',
    accent: 'from-emerald-500/30 to-slate-600/30',
  },

  // 8. PATROCINADOR OFICIAL: MANSÃO MAROMBA (TOGURO) & BEBIDAS DO ROLÊ
  {
    id: 'shop-mansao-maromba-combo',
    name: 'Drink Mansão Maromba Vodka Combo 6 Unidades',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 169.9,
    priceLabel: 'R$ 169,90 no Pix',
    priceOtherLabel: 'ou R$ 179,90 em outros meios',
    originalPriceBrl: 179.9,
    discountPct: 5,
    seller: 'TONELLI SUPERMERCADOS · Loja Oficial',
    verifiedPrice: true,
    imageUrl: '/api/shop/img-proxy?url=https%3A%2F%2Fhttp2.mlstatic.com%2FD_Q_NP_2X_894325-MLB107510520635_022026-E--vodka-combo-sabor-energetico-mansao-maromba-unidade-1l.webp',
    badge: '🏆 PATROCINADOR OFICIAL',
    emoji: '🥃',
    specs: 'Combo com 6 unidades · bebida oficial do Toguro & Mansão Maromba · preço real verificado no Mercado Livre',
    searchQuery: 'Bebida Mansao Maromba Toguro combo',
    commissionEst: '🏆 Destaque Oficial',
    accent: 'from-amber-400/40 to-yellow-600/25',
  },
  {
    id: 'shop-mansao-maromba-pack',
    name: 'Mansão Maromba Whisky + Maçã Verde 1L (Drink Pronto)',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 12.79,
    priceLabel: 'R$ 12,79 no Pix',
    priceOtherLabel: 'ou R$ 15,99 em outros meios',
    originalPriceBrl: 25,
    discountPct: 48,
    seller: 'FULL · SUPER',
    verifiedPrice: true,
    imageUrl: '/api/shop/img-proxy?url=https%3A%2F%2Fdistribuidoraourofino.com.br%2Fwp-content%2Fuploads%2F2025%2F09%2FWhisky-Combo-Maca-Verde-Mansao-Maromba-1L.jpg',
    badge: '🔥 OFERTA REAL DO DIA',
    emoji: '🧊',
    specs: 'Drink pronto Whisky + Maçã Verde 1 litro · preço real do Mercado Livre com frete grátis FULL',
    searchQuery: 'Mansao Maromba Whisky Maca Verde 1L',
    commissionEst: '🏆 Patrocinador VIP',
    accent: 'from-yellow-400/35 to-amber-500/25',
  },
  {
    id: 'shop-mansao-maromba-kit-treino',
    name: 'Drink Do Job Mansão Maromba Sabor Beijo Na Noite 1L',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 12.79,
    priceLabel: 'R$ 12,79 no Pix',
    priceOtherLabel: 'ou R$ 15,99 em outros meios',
    originalPriceBrl: 25,
    discountPct: 48,
    seller: 'FULL · SUPER',
    verifiedPrice: true,
    imageUrl: '/api/shop/img-proxy?url=https%3A%2F%2Fwww.pontocertoconveniencia.com.br%2Fmedia%2Fcatalog%2Fproduct%2Fcache%2F1%2Fimage%2F9df78eab33525d08d6e5fb8d27136e95%2Fm%2Fo%2Fmorango19__1.jpg',
    badge: '💖 OFERTA IMPERDÍVEL REAL',
    emoji: '🍹',
    specs: 'Drink Do Job sabor Beijo Na Noite 1 litro · preço real verificado no Mercado Livre',
    searchQuery: 'Drink Do Job Mansao Maromba Beijo Na Noite',
    commissionEst: '🏆 Comissão de afiliado',
    accent: 'from-pink-500/30 to-amber-500/20',
  },
  {
    id: 'shop-mansao-maromba-kit6',
    name: 'Kit 6 Unid Mansão Maromba Drink (Combo Fardo)',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 183.17,
    priceLabel: 'R$ 183,17 no Pix',
    priceOtherLabel: 'ou 6x R$ 32,20 sem juros',
    originalPriceBrl: 193.17,
    discountPct: 5,
    seller: 'Mercado Livre · Frete grátis',
    verifiedPrice: true,
    imageUrl: '/api/shop/img-proxy?url=https%3A%2F%2Fhttp2.mlstatic.com%2FD_NQ_NP_647101-MLB79911847509_102024-O.webp',
    badge: '📦 KIT 6 OFICIAL',
    emoji: '📦',
    specs: 'Kit com 6 unidades Mansão Maromba · preço real verificado · parcelável sem juros',
    searchQuery: 'Kit 6 Unid Maromba Mansao Drink',
    commissionEst: '🏆 Comissão de afiliado',
    accent: 'from-amber-500/30 to-emerald-500/20',
  },
  {
    id: 'shop-bebidas-combo-buchanans',
    name: 'Combo Camarote: Whisky Buchanan’s 12 Anos / Jack Daniel’s + Red Bull',
    brand: 'Buchanan’s · Jack Daniel’s',
    category: 'mansao',
    priceBrl: 259,
    priceLabel: 'R$ 259',
    badge: '🥂 CAMAROTE VIP',
    emoji: '🍾',
    specs: 'Garrafa 1L lacrada original + Energéticos + Gelo de coco pro rolê de patrão',
    searchQuery: 'Whisky Buchanans 12 anos Jack Daniels original',
    commissionEst: '8% a 12% comissão',
    accent: 'from-amber-500/30 to-stone-600/25',
  },

  // 9. NARGUILES & ESSÊNCIAS DO ROLÊ
  {
    id: 'shop-narguile-triton',
    name: 'Narguile Completo Triton Zip / Hookah King Gold + Vaso + Mangueira',
    brand: 'Triton · Hookah King',
    category: 'narguile',
    priceBrl: 429,
    priceLabel: 'R$ 429',
    badge: '💨 NARGUILE DOS CRIA',
    emoji: '💨',
    specs: 'Stem alumínio anodizado ouro/preto · Carbura muito · Kit completo pronto pra sessão',
    searchQuery: 'Narguile completo Triton Zip Hookah King',
    commissionEst: '10% a 14% comissão',
    accent: 'from-amber-400/30 to-cyan-500/20',
  },
  {
    id: 'shop-essencias-narguile',
    name: 'Pack Essências Narguile Zomo, Ziggy & Nay (Mix Sabores Mais Bravos)',
    brand: 'Zomo · Ziggy · Nay',
    category: 'narguile',
    priceBrl: 129,
    priceLabel: 'R$ 129 (Box 10un)',
    badge: '🍓 SABOR DE BAILE',
    emoji: '🍇',
    specs: 'Strong Mint, Melancia, Banana Tropical, Cherry & Frutas Vermelhas · Fumaça densa',
    searchQuery: 'Essencia narguile Ziggy Zomo Nay kit',
    commissionEst: '10% a 15% comissão',
    accent: 'from-pink-500/30 to-purple-500/20',
  },
  {
    id: 'shop-carvao-rosh-narguile',
    name: 'Kit Sessão VIP: Carvão de Coco 1kg + Rosh Phunnel + Pegador + Alumínio',
    brand: 'Coco Bass · Olla',
    category: 'narguile',
    priceBrl: 89,
    priceLabel: 'R$ 89',
    badge: '🔥 SESSÃO PRONTA',
    emoji: '🪔',
    specs: 'Carvão hexagonal alta duração sem cheiro + Rosh cerâmica + Abafador',
    searchQuery: 'Carvao coco narguile rosh phunnel kit',
    commissionEst: '10% a 15% comissão',
    accent: 'from-orange-500/30 to-amber-500/20',
  },

  // 10. PERFUMES IMPORTADOS QUE OS CRIAS & MINAS USAM
  {
    id: 'shop-perfume-1million',
    name: 'Perfume 1 Million Parfum & Invictus Victory — Paco Rabanne 100ml',
    brand: 'Paco Rabanne',
    category: 'perfumes',
    priceBrl: 579,
    priceLabel: 'R$ 579',
    badge: '🥇 OURO DOS CRIA',
    emoji: '🍾',
    specs: 'Eau de Parfum lacrado original · Cheiro de patrão que deixa rastro no baile',
    searchQuery: 'Perfume 1 Million Paco Rabanne 100ml original',
    commissionEst: '10% a 15% comissão',
    accent: 'from-amber-400/35 to-yellow-500/25',
  },
  {
    id: 'shop-perfume-sauvage-bleu',
    name: 'Perfume Dior Sauvage Elixir & Bleu de Chanel Eau de Parfum 100ml',
    brand: 'Dior · Chanel',
    category: 'perfumes',
    priceBrl: 799,
    priceLabel: 'R$ 799',
    badge: '💎 IMPORTADO DE PATRÃO',
    emoji: '💎',
    specs: 'Fragrância amadeirada magnética · Fixação extrema de 12h+ · Selo Adipec',
    searchQuery: 'Perfume Dior Sauvage Eau de Parfum 100ml original',
    commissionEst: '10% a 14% comissão',
    accent: 'from-sky-500/30 to-indigo-600/25',
  },
  {
    id: 'shop-perfume-212-jpg',
    name: 'Perfume 212 VIP Black / Rosé (Carolina Herrera) & Jean Paul Gaultier',
    brand: 'Carolina Herrera · JPG',
    category: 'perfumes',
    priceBrl: 549,
    priceLabel: 'R$ 549',
    badge: '🌟 CHAMA ATENÇÃO',
    emoji: '✨',
    specs: 'Para os crias (212 Black / Le Male) e pras minas (212 VIP Rosé / Scandal)',
    searchQuery: 'Perfume 212 VIP Black Carolina Herrera 100ml original',
    commissionEst: '10% a 15% comissão',
    accent: 'from-rose-500/30 to-amber-400/20',
  },

  // 11. SOM PESADO & TECH
  {
    id: 'shop-jbl-boombox',
    name: 'Caixa JBL Boombox 3 & PartyBox 310 / 710 Grave Extremo',
    brand: 'JBL',
    category: 'eletronicos',
    priceBrl: 2490,
    priceLabel: 'R$ 2.490',
    badge: '🔊 TREME TUDO',
    emoji: '🔊',
    specs: 'Bateria 24h · À prova d’água IP67 · Grave pesado pro churrasco e baile',
    searchQuery: 'Caixa de som JBL Boombox 3 original',
    commissionEst: '8% a 11% comissão',
    accent: 'from-orange-500/30 to-red-600/20',
  },
  {
    id: 'shop-iphone-ps5',
    name: 'iPhone 16 Pro Max Titânio & PlayStation 5 Slim',
    brand: 'Apple · Sony',
    category: 'eletronicos',
    priceBrl: 3790,
    priceLabel: 'PS5 R$ 3.790 / iPhone R$ 8.490',
    badge: '📱 TECH DOS CRIA',
    emoji: '📱',
    specs: 'Câmera cinema pro Vibe + PS5 4K pra jogar ouvindo o som do app',
    searchQuery: 'iPhone 16 Pro Max PlayStation 5 Slim Brasil',
    commissionEst: '5% a 10% comissão',
    accent: 'from-cyan-400/30 to-purple-500/20',
  },
];

const CATEGORIES: { id: ShopCat; label: string; liveQuery: string }[] = [
  { id: 'all', label: '🔥 Tudo dos Cria', liveQuery: 'Mansao Maromba Lacoste Juliet 1 Million Narguile' },
  { id: 'mansao', label: '🏆 Mansão Maromba & Rolê', liveQuery: 'Bebida Mansao Maromba Toguro Whisky Combo' },
  { id: 'perfumes', label: '🍾 Perfumes Importados', liveQuery: 'Perfume 1 Million Dior Sauvage 212 VIP Black original' },
  { id: 'narguile', label: '💨 Narguiles & Essências', liveQuery: 'Narguile Triton Zip Essencia Ziggy Zomo' },
  { id: 'roupas', label: '🐊 Roupas & Grife', liveQuery: 'Camisa Polo Corta Vento Lacoste Oakley original' },
  { id: 'tenis', label: '👟 Tênis & Kenner', liveQuery: 'Tenis Nike Air Max Plus TN Mizuno Prophecy Kenner' },
  { id: 'oculos', label: '🕶️ Óculos Juliet', liveQuery: 'Oculos Oakley Juliet Romeo 2 Prada original' },
  { id: 'relogios', label: '⌚ Relógios Luxo', liveQuery: 'Relogio Invicta Bolt Zeus Dourado G-Shock original' },
  { id: 'correntes', label: '🥇 Correntes Ouro', liveQuery: 'Corrente Grumet Ouro 18k Cordao Cravejado Ice' },
  { id: 'motos', label: '🏍️ Motos Grau', liveQuery: 'Honda Hornet BMW S1000RR Yamaha XJ6 a venda' },
  { id: 'carros', label: '🚘 Carros & Naves', liveQuery: 'BMW 320i Golf GTI Porsche 911 a venda' },
  { id: 'eletronicos', label: '🔊 Som JBL & Tech', liveQuery: 'JBL Boombox 3 iPhone 16 Pro Max PS5' },
];


export type ShopSection = 'all' | 'destaques' | 'hot' | 'promo' | 'casa' | 'moda' | 'tech' | 'bebidas';

const SHOP_SECTIONS: { id: ShopSection; label: string }[] = [
  { id: 'all', label: '🛍️ Tudo' },
  { id: 'destaques', label: '⭐ Destaques' },
  { id: 'hot', label: '🔥 Mais Vendidos' },
  { id: 'promo', label: '🏷️ Promoções' },
  { id: 'casa', label: '🏠 Eletrodomésticos' },
  { id: 'moda', label: '👕 Moda & Grife' },
  { id: 'tech', label: '📱 Eletrônicos' },
  { id: 'bebidas', label: '🥃 Bebidas' },
];

const SECTION_CATS: Record<ShopSection, ShopCat[] | null> = {
  all: null,
  destaques: null,
  hot: null,
  promo: null,
  casa: ['casa'],
  moda: ['roupas', 'tenis', 'oculos', 'relogios', 'correntes', 'perfumes'],
  tech: ['eletronicos'],
  bebidas: ['mansao', 'narguile'],
};

const CATEGORY_LABEL: Record<string, string> = {
  roupas: 'Roupas & Grife',
  tenis: 'Tênis',
  oculos: 'Óculos',
  relogios: 'Relógios',
  correntes: 'Correntes & Ouro',
  perfumes: 'Perfumes',
  narguile: 'Narguile',
  motos: 'Motos',
  carros: 'Carros',
  eletronicos: 'Eletrônicos',
  casa: 'Eletrodomésticos',
  mansao: 'Bebidas',
};

const HOT_IDS = new Set([
  'shop-mansao-maromba-combo',
  'shop-mansao-maromba-pack',
  'shop-mansao-maromba-kit-treino',
  'shop-mansao-maromba-kit6',
  'shop-lacoste-polo',
  'shop-juliet',
  'shop-invicta-bolt',
  'shop-corrente-grumet',
  'shop-nike-tn',
  'shop-jbl-boombox',
]);

const FEATURED_IDS = new Set([
  'shop-lacoste-polo',
  'shop-juliet',
  'shop-invicta-bolt',
  'shop-corrente-grumet',
  'shop-hornet',
  'shop-porsche',
  'shop-nike-tn',
  'shop-iphone-ps5',
]);

// Produtos revendedores (Shopee) — compra vai direto pra Shopee com o link do vendedor.
const SHOPEE_CRIA: CriaProduct[] = [
  {
    id: 'shop-shopee-tenis',
    name: 'Tênis Esportivo Premium Branco & Dourado',
    brand: 'Shopee Grife',
    category: 'tenis',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '👟 MODA · REVENDEDOR',
    emoji: '👟',
    specs: 'Modelo esportivo premium, leve e confortável · compra com desconto no link do vendedor parceiro · frete grátis conforme a loja.',
    searchQuery: 'tenis esportivo branco dourado',
    photos: SHOP_PHOTOS['shop-shopee-tenis'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=tenis%20esportivo%20branco%20dourado',
    hot: true,
    featured: true,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-amber-200 to-yellow-400',
  },
  {
    id: 'shop-shopee-oculos',
    name: 'Óculos de Sol Aviador Dourado Luxo',
    brand: 'Shopee Grife',
    category: 'oculos',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '🕶️ GRIFE · REVENDEDOR',
    emoji: '🕶️',
    specs: 'Armação aviador dourada com lentes degradê · inclui estojo rígido · compra com desconto no link do vendedor parceiro.',
    searchQuery: 'oculos de sol aviador dourado',
    photos: SHOP_PHOTOS['shop-shopee-oculos'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=oculos%20aviador%20dourado',
    hot: true,
    featured: true,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-yellow-300 to-amber-500',
  },
  {
    id: 'shop-shopee-fone',
    name: 'Fone Bluetooth com Case Carregador',
    brand: 'Shopee Tech',
    category: 'eletronicos',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '🎵 TECH · REVENDEDOR',
    emoji: '🎧',
    specs: 'Fone sem fio com estojo carregador · som potente e bateria de longa duração · compra com desconto no link do vendedor parceiro.',
    searchQuery: 'fone bluetooth case carregador',
    photos: SHOP_PHOTOS['shop-shopee-fone'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=fone%20bluetooth%20case%20carregador',
    hot: true,
    featured: true,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-slate-500 to-slate-700',
  },
  {
    id: 'shop-shopee-smartwatch',
    name: 'Smartwatch Esportivo AMOLED Preto',
    brand: 'Shopee Tech',
    category: 'eletronicos',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '⌚ TECH · REVENDEDOR',
    emoji: '⌚',
    specs: 'Tela AMOLED · monitor cardíaco, esportes e notificações · pulseira confortável · compra com desconto no link do vendedor parceiro.',
    searchQuery: 'smartwatch esportivo amoled preto',
    photos: SHOP_PHOTOS['shop-shopee-smartwatch'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=smartwatch%20amoled%20preto',
    hot: true,
    featured: false,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-zinc-600 to-zinc-800',
  },
  {
    id: 'shop-shopee-airfryer',
    name: 'Air Fryer Digital 5L Painel Touch',
    brand: 'Shopee Casa',
    category: 'casa',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '🏠 CASA · REVENDEDOR',
    emoji: '🍟',
    specs: 'Fritadeira elétrica sem óleo · painel digital touch · 5 litros pra família · compra com desconto no link do vendedor parceiro.',
    searchQuery: 'air fryer digital 5l touch',
    photos: SHOP_PHOTOS['shop-shopee-airfryer'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=air%20fryer%20digital%205l',
    hot: true,
    featured: false,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-neutral-700 to-black',
  },
  {
    id: 'shop-shopee-panelas',
    name: 'Jogo de Panelas Antiaderente Premium',
    brand: 'Shopee Casa',
    category: 'casa',
    priceBrl: 0,
    priceLabel: 'Preço na Shopee',
    badge: '🍳 CASA · REVENDEDOR',
    emoji: '🍳',
    specs: 'Conjunto antiaderente com tampas de vidro · revestimento de alta durabilidade · compra com desconto no link do vendedor parceiro.',
    searchQuery: 'jogo de panelas antiaderente',
    photos: SHOP_PHOTOS['shop-shopee-panelas'] || [],
    buyUrl: 'https://shopee.com.br/search?keyword=jogo%20de%20panelas%20antiaderente',
    hot: false,
    featured: false,
    verifiedPrice: false,
    seller: 'Shopee · vendedor parceiro',
    commissionEst: '💰 Comissão ativa',
    accent: 'from-stone-600 to-stone-800',
  },
];

const HELP_FAQ = [
  {
    q: '🛍️ Como funciona a compra?',
    a: 'Você escolhe o produto, clica em Comprar e finaliza direto na loja parceira (Shopee, Mercado Livre ou Amazon). Quem envia é a loja, com o produto em estoque — tudo na lei.',
  },
  {
    q: '💰 Como recebo desconto?',
    a: 'Comprando pelo link do vendedor parceiro dentro do app, o desconto do cupom aparece no checkout da loja. Cada compra ainda gera comissão pro app.',
  },
  {
    q: '📦 Qual o prazo de entrega?',
    a: 'O prazo é o da loja parceira, calculado no checkout pelo seu CEP. Frete grátis quando a loja oferece.',
  },
  {
    q: '🔄 Posso trocar ou devolver?',
    a: 'Sim — troca e devolução são feitas pela loja parceira dentro do prazo legal (7 dias de arrependimento, Código de Defesa do Consumidor).',
  },
  {
    q: '🤝 Como virar revendedor?',
    a: 'Ative suas Comissões no botão no topo: cadastre-se grátis nos programas de afiliados e cada link passa a gerar comissão pra você.',
  },
];

const INPUT_CLS =
  'w-full px-3.5 py-2 rounded-2xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-300';

interface Props {
  settings: AppSettings;
  mode: AppMode;
  initialCategory?: ShopCat;
  categoryNonce?: number;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onCommentTarget?: (id: string, title: string) => void;
  onOpenLiveChat?: (roomId: string, roomTitle: string) => void;
  onToast: (msg: string) => void;
}

export const ShopCriaView: React.FC<Props> = ({
  settings,
  mode,
  initialCategory,
  categoryNonce,
  onSaveSettings,
  onCommentTarget,
  onOpenLiveChat,
  onToast,
}) => {
  const [cat, setCat] = useState<ShopCat>(initialCategory || 'all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (initialCategory) {
      setCat(initialCategory);
      setQuery('');
    }
  }, [initialCategory, categoryNonce]);
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [cart, setCart] = useState<{ item: CriaProduct; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  // Identificação opcional da compra — usada só no registro privado da venda
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);

  // Live published products fetched from Brazilian marketplaces
  const [liveItems, setLiveItems] = useState<LivePublishedItem[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [affiliateClicks, setAffiliateClicks] = useState(0);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Record<string, boolean>>({});

  // Commission / Affiliate configuration modal
  const [affModalOpen, setAffModalOpen] = useState(false);
  const [mlTool, setMlTool] = useState(settings.affiliateMlTool || '');
  const [mlWord, setMlWord] = useState(settings.affiliateMlWord || '');
  const [shopeeId, setShopeeId] = useState(settings.affiliateShopeeId || '');
  const [amazonTag, setAmazonTag] = useState(settings.affiliateAmazonTag || '');
  const [waNumber, setWaNumber] = useState(settings.whatsappStoreNumber || '');
  const [pasteLink, setPasteLink] = useState('');
  const [extractingLink, setExtractingLink] = useState(false);
  const [savingAff, setSavingAff] = useState(false);

  useEffect(() => {
    setMlTool(settings.affiliateMlTool || '');
    setMlWord(settings.affiliateMlWord || '');
    setShopeeId(settings.affiliateShopeeId || '');
    setAmazonTag(settings.affiliateAmazonTag || '');
    setWaNumber(settings.whatsappStoreNumber || '');
  }, [
    settings.affiliateMlTool,
    settings.affiliateMlWord,
    settings.affiliateShopeeId,
    settings.affiliateAmazonTag,
    settings.whatsappStoreNumber,
  ]);

  const hasAnyAffiliate = Boolean(
    settings.affiliateMlTool || settings.affiliateShopeeId || settings.affiliateAmazonTag
  );

  const fetchLiveOffers = async (searchText: string) => {
    setLiveLoading(true);
    try {
      const r = await fetch(`/api/shop/live?q=${encodeURIComponent(searchText)}`);
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d?.items)) setLiveItems(d.items);
        if (typeof d?.clicks === 'number') setAffiliateClicks(d.clicks);
      }
    } catch {
      // ignore offline
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    const activeCatObj = CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];
    const q = query.trim() || activeCatObj.liveQuery;
    const t = window.setTimeout(() => {
      void fetchLiveOffers(q);
    }, 280);
    return () => window.clearTimeout(t);
  }, [cat, query]);

  const [liveById, setLiveById] = useState<Record<string, Partial<CriaProduct>>>({});
  const [syncInfo, setSyncInfo] = useState<{ updatedAt: string; syncStatus: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<'loja' | 'conta'>('loja');
  const [section, setSection] = useState<ShopSection>('all');
  const [detailItem, setDetailItem] = useState<CriaProduct | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [favIds, setFavIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mg_shop_favs') || '[]');
    } catch {
      return [];
    }
  });
  const [profileName, setProfileName] = useState(() => localStorage.getItem('mg_shop_profile_name') || '');
  const [profilePhone, setProfilePhone] = useState(() => localStorage.getItem('mg_shop_profile_phone') || '');
  const [addr, setAddr] = useState<{ rua: string; num: string; bairro: string; cidade: string; cep: string }>(() => {
    try {
      return { rua: '', num: '', bairro: '', cidade: '', cep: '', ...JSON.parse(localStorage.getItem('mg_shop_addr') || '{}') };
    } catch {
      return { rua: '', num: '', bairro: '', cidade: '', cep: '' };
    }
  });
  const [privacy, setPrivacy] = useState<Record<string, boolean>>(() => {
    try {
      return { showName: true, promos: true, history: true, ...JSON.parse(localStorage.getItem('mg_shop_privacy') || '{}') };
    } catch {
      return { showName: true, promos: true, history: true };
    }
  });
  const [langPref, setLangPref] = useState(() => localStorage.getItem('mg_shop_lang') || 'pt-BR');
  const [cartReady, setCartReady] = useState(false);
  const deviceId = useMemo(() => {
    try {
      let d = localStorage.getItem('mg_device_id');
      if (!d) {
        d = 'dev-' + Math.random().toString(36).slice(2, 12);
        localStorage.setItem('mg_device_id', d);
      }
      return d;
    } catch {
      return 'guest';
    }
  }, []);

  const getPromoInfo = (item: CriaProduct): { discountPct: number; originalBrl: number } | null => {
    // SOMENTE desconto real verificado no site parceiro — nada de porcentagem inventada.
    if (item.discountPct && item.originalPriceBrl && item.originalPriceBrl > item.priceBrl) {
      return { discountPct: item.discountPct, originalBrl: item.originalPriceBrl };
    }
    return null;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mergedCatalog = [...CRIA_CATALOG, ...SHOPEE_CRIA].map((p) => (liveById[p.id] ? { ...p, ...liveById[p.id] } : p));
    return mergedCatalog.filter((p) => {
      if (section === 'hot' && !(p.hot || HOT_IDS.has(p.id))) return false;
      if (section === 'destaques' && !(p.featured || FEATURED_IDS.has(p.id))) return false;
      if (section === 'promo' && !getPromoInfo(p)) return false;
      const cats = SECTION_CATS[section];
      if (cats && !cats.includes(p.category)) return false;
      if (!q) return true;
      return `${p.name} ${p.brand} ${p.specs} ${p.badge}`.toLowerCase().includes(q);
    });
  }, [section, query, liveById]);

  const favItems = useMemo(
    () => [...CRIA_CATALOG, ...SHOPEE_CRIA].filter((p) => favIds.includes(p.id)),
    [favIds],
  );

  const trendItems = useMemo(
    () => [...CRIA_CATALOG, ...SHOPEE_CRIA].filter((p) => p.hot || p.featured || HOT_IDS.has(p.id)).slice(0, 3),
    [],
  );

  const totalItems = cart.reduce((acc, c) => acc + c.qty, 0);
  const totalPrice = cart.reduce((acc, c) => acc + c.item.priceBrl * c.qty, 0);

  // ===== LOJA REAL · preços verificados + sincronização automática com a internet =====

  const loadShopCatalog = async () => {
    try {
      const r = await fetch('/api/shop/catalog');
      const d = await r.json();
      if (Array.isArray(d?.products)) {
        const map: Record<string, Partial<CriaProduct>> = {};
        for (const prod of d.products) if (prod?.id) map[prod.id] = prod;
        setLiveById(map);
      }
      if (d?.updatedAt) setSyncInfo({ updatedAt: d.updatedAt, syncStatus: String(d.syncStatus || '') });
    } catch {
      // offline: mantém os preços reais embutidos
    }
  };

  useEffect(() => {
    void loadShopCatalog();
    const t = window.setInterval(() => void loadShopCatalog(), 15 * 60 * 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runShopSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/shop/sync', { method: 'POST' });
    } catch {
      // ignore
    }
    await loadShopCatalog();
    setSyncing(false);
    onToast?.('🌐 Preços sincronizados com a internet!');
  };

  const buildStoreUrl = (searchQuery: string, store: 'ml' | 'shopee' | 'amazon') => {
    if (store === 'amazon') {
      return settings.affiliateAmazonTag
        ? `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}&tag=${encodeURIComponent(
            settings.affiliateAmazonTag
          )}`
        : `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}`;
    }
    if (store === 'shopee') {
      const cleanShopee = (settings.affiliateShopeeId || '').trim().replace(/^an_/i, '');
      return cleanShopee
        ? `https://shopee.com.br/search?keyword=${encodeURIComponent(
            searchQuery
          )}&utm_source=an_${encodeURIComponent(cleanShopee)}&utm_medium=affiliates`
        : `https://shopee.com.br/search?keyword=${encodeURIComponent(searchQuery)}`;
    }
    const base = `https://lista.mercadolivre.com.br/${encodeURIComponent(searchQuery).replace(/%20/g, '-')}`;
    if (settings.affiliateMlTool) {
      return `${base}?matt_tool=${encodeURIComponent(settings.affiliateMlTool)}${
        settings.affiliateMlWord ? `&matt_word=${encodeURIComponent(settings.affiliateMlWord)}` : ''
      }`;
    }
    return base;
  };

  const buildCommissionUrl = (searchQuery: string, category: CriaProduct['category']) => {
    if (category === 'motos' || category === 'carros') {
      return `https://www.webmotors.com.br/carros/estoque?tipoveiculo=${
        category === 'motos' ? 'motos' : 'carros'
      }&q=${encodeURIComponent(searchQuery)}`;
    }
    if (category === 'eletronicos' && settings.affiliateAmazonTag) {
      return buildStoreUrl(searchQuery, 'amazon');
    }
    if (
      (category === 'roupas' || category === 'oculos' || category === 'correntes' || category === 'tenis') &&
      settings.affiliateShopeeId
    ) {
      return buildStoreUrl(searchQuery, 'shopee');
    }
    if (settings.affiliateMlTool) return buildStoreUrl(searchQuery, 'ml');
    if (settings.affiliateShopeeId) return buildStoreUrl(searchQuery, 'shopee');
    if (settings.affiliateAmazonTag) return buildStoreUrl(searchQuery, 'amazon');
    return buildStoreUrl(searchQuery, 'ml');
  };

  const trackAndOpenOffer = () => {
    void fetch('/api/shop/track-click', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.clicks === 'number') setAffiliateClicks(d.clicks);
      })
      .catch(() => {});
  };

  const addToCart = (item: CriaProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
    onToast(`🛍️ "${item.name}" na sacola dos cria!`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  /**
   * Finaliza a compra: registra a venda no servidor (a comissão é calculada
   * no servidor e NUNCA é devolvida para o cliente) e abre o WhatsApp da loja.
   */
  const finalizePurchase = async () => {
    if (!cart.length) return;
    const waUrl = buildOrderWhatsappUrl();
    setSubmittingSale(true);
    try {
      const res = await registerSale({
        items: cart.map((c) => ({
          id: c.item.id,
          name: c.item.name,
          brand: c.item.brand,
          qty: c.qty,
          unitBrl: c.item.priceBrl,
        })),
        buyerName: buyerName.trim(),
        buyerContact: buyerContact.trim(),
        channel: 'loja-dos-cria',
        source: 'catalogo',
      });
      if (res.ok) {
        onToast('✅ Compra registrada! Já mandamos sua lista no Zap dos Cria.');
        setCart([]);
        setBuyerName('');
        setBuyerContact('');
        setCartOpen(false);
        window.open(waUrl, '_blank', 'noopener');
      } else {
        onToast('⚠️ Não consegui registrar a venda. Tenta mandar a lista no Zap mesmo.');
        window.open(waUrl, '_blank', 'noopener');
      }
    } finally {
      setSubmittingSale(false);
    }
  };

  const buildOrderWhatsappUrl = () => {    const lines = cart.map((c) => `• ${c.qty}x ${c.item.name} (${c.item.priceLabel})`);
    const msg =
      `Salve! Montei minha lista de compras na Loja dos Cria do MORRO GOLD 🔥:\n\n` +
      `${lines.join('\n')}\n\nTotal estimado: R$ ${totalPrice.toLocaleString('pt-BR')}`;
    const cleanPhone = (settings.whatsappStoreNumber || '').replace(/\D/g, '');
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleAutoExtractLink = async () => {
    const clean = pasteLink.trim();
    if (!clean) {
      onToast('Cole primeiro um link gerado no Mercado Livre, Shopee ou Amazon!');
      return;
    }
    setExtractingLink(true);
    try {
      const r = await fetch('/api/shop/parse-affiliate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });
      const d = await r.json().catch(() => ({}));
      const ex = d?.extracted || {};
      const nextMlTool = ex.affiliateMlTool || mlTool;
      const nextMlWord = ex.affiliateMlWord || mlWord;
      const nextShopee = ex.affiliateShopeeId || shopeeId;
      const nextAmazon = ex.affiliateAmazonTag || amazonTag;

      if (ex.affiliateMlTool) setMlTool(ex.affiliateMlTool);
      if (ex.affiliateMlWord) setMlWord(ex.affiliateMlWord);
      if (ex.affiliateShopeeId) setShopeeId(ex.affiliateShopeeId);
      if (ex.affiliateAmazonTag) setAmazonTag(ex.affiliateAmazonTag);

      if (d?.ok) {
        if (mode === 'creator') {
          await onSaveSettings({
            affiliateMlTool: nextMlTool.trim(),
            affiliateMlWord: nextMlWord.trim(),
            affiliateShopeeId: nextShopee.trim(),
            affiliateAmazonTag: nextAmazon.trim(),
            whatsappStoreNumber: waNumber.trim(),
          });
          onToast('⚡ Código extraído do link e salvo automaticamente!');
        } else {
          onToast('⚡ Código extraído do link! Ative o Modo Criador (5 toques no logo MORRO GOLD) para salvar.');
        }
        setPasteLink('');
      } else {
        onToast('Não achei código nesse link. Gere um link de afiliado dentro do painel da loja e cole aqui.');
      }
    } catch {
      onToast('Erro ao ler o link. Tente copiar o link completo.');
    } finally {
      setExtractingLink(false);
    }
  };

  const handleSaveAffiliateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAff(true);
    try {
      await onSaveSettings({
        affiliateMlTool: mlTool.trim(),
        affiliateMlWord: mlWord.trim(),
        affiliateShopeeId: shopeeId.trim(),
        affiliateAmazonTag: amazonTag.trim(),
        whatsappStoreNumber: waNumber.trim(),
      });
      onToast('💰 Códigos de Comissão salvos! Todo link agora gera comissão pra você.');
      setAffModalOpen(false);
    } finally {
      setSavingAff(false);
    }
  };

  // ===== helpers da loja reformulada =====
  const itemPhotos = (item: CriaProduct): string[] => {
    if (item.photos && item.photos.length) return item.photos;
    if (item.imageUrl) return [item.imageUrl];
    return [`/api/shop/photo?q=${encodeURIComponent(item.searchQuery)}`];
  };

  const toggleFav = (id: string) => {
    setFavIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('mg_shop_favs', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const openDetail = (item: CriaProduct) => {
    setDetailItem(item);
    setPhotoIdx(0);
  };

  const buildBuyUrl = (item: CriaProduct): string => {
    const raw = item.buyUrl || buildCommissionUrl(item.searchQuery, item.category);
    try {
      const u = new URL(raw);
      if (u.hostname.includes('shopee') && settings.affiliateShopeeId) {
        const cleanShopee = String(settings.affiliateShopeeId).trim().replace(/^an_/i, '');
        u.searchParams.set('utm_source', `an_${cleanShopee}`);
        u.searchParams.set('utm_medium', 'affiliates');
      }
      return u.toString();
    } catch {
      return raw;
    }
  };

  const openBuy = (item: CriaProduct) => {
    const url = buildBuyUrl(item);
    void fetch('/api/shop/orders', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.id,
        title: item.name,
        store: item.buyUrl ? 'Shopee' : 'Loja parceira',
        url,
      }),
    }).catch(() => {});
    void fetch('/api/shop/track-click', { method: 'POST' }).catch(() => {});
    window.open(url, '_blank', 'noopener');
    onToast('🚀 Abrindo a loja parceira com seu link de desconto!');
    setDetailItem(null);
  };

  const loginProfile = () => {
    const n = profileName.trim();
    if (n.length < 2) {
      onToast('✏️ Escreve seu nome pra entrar, parça!');
      return;
    }
    try {
      localStorage.setItem('mg_shop_profile_name', n);
      localStorage.setItem('mg_shop_profile_phone', profilePhone.trim());
    } catch {
      /* ignore */
    }
    setProfileName(n);
    onToast(`👤 Bem-vindo, ${n}! Sacola e tendências ativas.`);
  };

  const logoutProfile = () => {
    try {
      localStorage.removeItem('mg_shop_profile_name');
      localStorage.removeItem('mg_shop_profile_phone');
    } catch {
      /* ignore */
    }
    setProfileName('');
    setProfilePhone('');
    onToast('👋 Você saiu da conta da loja.');
  };

  const saveAddr = () => {
    try {
      localStorage.setItem('mg_shop_addr', JSON.stringify(addr));
    } catch {
      /* ignore */
    }
    onToast('📍 Endereço salvo!');
  };

  const togglePrivacy = (key: string) => {
    setPrivacy((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mg_shop_privacy', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const applyLangPref = (code: string) => {
    setLangPref(code);
    try {
      localStorage.setItem('mg_shop_lang', code);
    } catch {
      /* ignore */
    }
    onToast('🌐 Idioma da loja atualizado!');
  };

  // ===== CONTA NA NUVEM (Supabase) — login leve e dados em qualquer aparelho =====
  const [cloudUser, setCloudUser] = useState<CloudSession['user'] | null>(() => getCloudSession()?.user || null);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');

  const cloudPush = () => {
    const sess = getCloudSession();
    const url = (settings.supabaseUrl || '').trim();
    const anon = (settings.supabaseAnonKey || '').trim();
    if (!sess || !url || !anon) return;
    void cloudUpsert(url, anon, sess.access_token, 'mg_bags', {
      user_id: sess.user.id,
      items: cart.map((c) => ({ id: c.item.id, qty: c.qty })),
    });
    void cloudUpsert(url, anon, sess.access_token, 'mg_favs', { user_id: sess.user.id, ids: favIds });
  };

  const cloudPull = async (sess: CloudSession) => {
    const url = (settings.supabaseUrl || '').trim();
    const anon = (settings.supabaseAnonKey || '').trim();
    if (!url || !anon) return;
    try {
      const favRow = await cloudGet(url, anon, sess.access_token, 'mg_favs', sess.user.id);
      const ids = Array.isArray(favRow?.[0]?.ids) ? favRow[0].ids.filter((x: unknown) => typeof x === 'string') : [];
      if (ids.length) setFavIds((prev) => Array.from(new Set([...prev, ...ids])));
      const bagRow = await cloudGet(url, anon, sess.access_token, 'mg_bags', sess.user.id);
      const wanted = new Map<string, number>();
      for (const it of bagRow?.[0]?.items || []) if (it?.id) wanted.set(String(it.id), Number(it.qty || 1));
      if (wanted.size) {
        setCart((prev) => {
          const merged = new Map<string, { item: CriaProduct; qty: number }>();
          for (const c of prev) merged.set(c.item.id, c);
          for (const p of [...CRIA_CATALOG, ...SHOPEE_CRIA]) {
            if (wanted.has(p.id) && !merged.has(p.id)) merged.set(p.id, { item: p, qty: Math.max(1, wanted.get(p.id) || 1) });
          }
          return Array.from(merged.values());
        });
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const s = cloudSessionFromHash();
    if (s?.user) {
      setCloudUser(s.user);
      onToast('☁️ Conta na nuvem conectada!');
      void cloudPull(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cloudLogin = async (signUp: boolean) => {
    const url = (settings.supabaseUrl || '').trim();
    const anon = (settings.supabaseAnonKey || '').trim();
    const email = cloudEmail.trim();
    const password = cloudPassword;
    if (!url || !anon) return;
    if (!email || password.length < 6) {
      onToast('✏️ Preencha e-mail e senha (mínimo 6 caracteres).');
      return;
    }
    const res = signUp ? await cloudSignUp(url, anon, email, password) : await cloudSignIn(url, anon, email, password);
    if (res.error || !res.session) {
      onToast(`⚠️ ${res.error || 'Falha na conta na nuvem.'}`);
      return;
    }
    setCloudUser(res.session.user);
    onToast(signUp ? '☁️ Conta na nuvem criada!' : '☁️ Login na nuvem feito!');
    void cloudPull(res.session);
    cloudPush();
  };

  const cloudGoogle = () => {
    const url = (settings.supabaseUrl || '').trim();
    const anon = (settings.supabaseAnonKey || '').trim();
    if (!url || !anon) return;
    window.location.href = cloudGoogleUrl(url, anon, window.location.origin + '/');
  };

  const cloudLogout = () => {
    cloudSignOut();
    setCloudUser(null);
    onToast('☁️ Desconectado da nuvem.');
  };

  // LGPD: exclusão permanente da conta (nuvem + aparelho + dados)
  const deleteMyAccount = async () => {
    const sess = getCloudSession();
    const email = (cloudUser?.email || sess?.user?.email || getPrimaryDeviceAccount()?.email || '').trim();
    const uid = (cloudUser?.id || sess?.user?.id || '').trim();
    if (!email && !uid) {
      onToast('Nenhuma conta conectada.');
      return;
    }
    const typed = window.prompt(
      '⚠️ EXCLUSÃO PERMANENTE\n\nSua conta e todos os seus dados (sacola, favoritos, playlists) serão apagados para sempre.\n\nPara confirmar, digite: EXCLUIR',
    );
    if ((typed || '').trim().toUpperCase() !== 'EXCLUIR') {
      onToast('Exclusão cancelada.');
      return;
    }
    try {
      await fetch('/api/fan/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid }),
      });
      const url = (settings.supabaseUrl || '').trim();
      const anon = (settings.supabaseAnonKey || '').trim();
      if (sess && url && anon) await cloudDeleteSelf(url, anon, sess);
      if (email) deleteDeviceAccount(email);
      cloudSignOut();
      setCloudUser(null);
      onToast('🗑️ Conta excluída em definitivo. Até logo! 💛');
    } catch {
      onToast('⚠️ Não foi possível concluir agora. Tente novamente.');
    }
  };

  // sacola salva no servidor (sobrevive a troca de aparelho com o mesmo login)
  useEffect(() => {
    let alive = true;
    fetch(`/api/shop/bag?device=${encodeURIComponent(deviceId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !Array.isArray(d?.items) || d.items.length === 0) return;
        const wanted = new Map<string, number>();
        for (const it of d.items) if (it?.id) wanted.set(String(it.id), Number(it.qty || 1));
        const restored = [...CRIA_CATALOG, ...SHOPEE_CRIA]
          .filter((p) => wanted.has(p.id))
          .map((p) => ({ item: p, qty: Math.max(1, wanted.get(p.id) || 1) }));
        if (restored.length) setCart(restored);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setCartReady(true);
      });
    return () => {
      alive = false;
    };
  }, [deviceId]);

  useEffect(() => {
    if (!cartReady) return;
    const t = window.setTimeout(() => {
      void fetch('/api/shop/bag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: deviceId,
          items: cart.map((c) => ({
            id: c.item.id,
            name: c.item.name,
            priceBrl: c.item.priceBrl,
            qty: c.qty,
            imageUrl: c.item.imageUrl || (c.item.photos && c.item.photos[0]) || '',
          })),
        }),
      }).catch(() => {});
      cloudPush();
    }, 400);
    return () => window.clearTimeout(t);
  }, [cart, cartReady, deviceId]);

  // aba do menu (ex.: "Tênis") abre a classificacao certa da loja
  useEffect(() => {
    if (!initialCategory) return;
    const map: Record<string, ShopSection> = {
      mansao: 'bebidas',
      narguile: 'bebidas',
      roupas: 'moda',
      tenis: 'moda',
      oculos: 'moda',
      relogios: 'moda',
      correntes: 'moda',
      perfumes: 'moda',
      eletronicos: 'tech',
      casa: 'casa',
      motos: 'destaques',
      carros: 'destaques',
    };
    setSection(map[initialCategory] || 'all');
  }, [initialCategory, categoryNonce]);

  return (
    <div className="space-y-4 pb-36 md:pb-28 cosmic-scene">
      {/* BARRA PRINCIPAL — abas Loja | Minha Conta + atalhos únicos */}
      <section className="rounded-2xl cosmic-card-3d p-2.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/40 rounded-full p-1 border border-amber-400/25">
          <button
            type="button"
            onClick={() => setTab('loja')}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition ${tab === 'loja' ? 'lux-btn-gold' : 'text-slate-200 hover:text-white'}`}
          >
            🛍️ Loja
          </button>
          <button
            type="button"
            onClick={() => setTab('conta')}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition ${tab === 'conta' ? 'lux-btn-gold' : 'text-slate-200 hover:text-white'}`}
          >
            👤 Minha Conta
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {settings.vipActive && (
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 text-black text-[10px] font-black">
              👑 VIP {settings.vipPlan === 'anual' ? 'ANUAL' : 'ATIVO'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAffModalOpen(true)}
            className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition ${hasAnyAffiliate ? 'lux-btn-obsidian border-emerald-400/50 text-emerald-200' : 'lux-btn-obsidian border-amber-400/50 text-amber-200'}`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>{hasAnyAffiliate ? `Comissão Ativa (${affiliateClicks})` : 'Ativar Comissões'}</span>
          </button>
          <div className="hidden">
            <span>Sacola ({totalItems})</span>
          </div>
        </div>
      </section>

      {tab === 'loja' ? (
        <>
          {/* BUSCA */}
          <div className="relative">
            <Search className="w-4 h-4 text-amber-300 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto, marca ou modelo..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-black/60 border border-amber-400/25 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-300 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* CLASSIFICAÇÕES — poucas opções, direto ao ponto */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SHOP_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 ${section === s.id ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* ANÚNCIO · PATROCINADOR OFICIAL (compacto) — VIP nao ve anuncios */}
          {!settings.vipActive && (
          <section className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-[#171103] via-[#0b0a10] to-[#1a0d05] p-2.5 flex items-center gap-2.5">
            <span className="px-2 py-1 rounded-full bg-amber-400 text-black text-[9px] font-black shrink-0">📢 ANÚNCIO</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-amber-200 truncate">
                🥃 Mansão Maromba · Toguro — Combos & Bebidas do Rolê
              </div>
              <div className="text-[10px] text-slate-300 truncate">
                Patrocinador oficial · Combo Whisky, Vodka, Gin & Energético pro rolê
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSection('bebidas');
                onToast('🥃 Bebidas do patrocinador oficial na vitrine!');
              }}
              className="px-3 py-1.5 rounded-full lux-btn-gold text-[10px] font-black shrink-0"
            >
              Ver ofertas
            </button>
          </section>
          )}

          {/* Sincronização de preços (linha fina) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="text-[10px] text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {syncInfo?.updatedAt ? (
                <span>Preços sincronizados com a internet · {new Date(syncInfo.updatedAt).toLocaleString('pt-BR')}</span>
              ) : (
                <span>Catálogo com preços reais · compra direto na loja parceira</span>
              )}
            </div>
            <button
              type="button"
              onClick={runShopSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/35 text-cyan-200 text-[10px] font-black flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className={syncing ? 'inline-block animate-spin' : ''}>🔄</span>
              {syncing ? 'Sincronizando...' : 'Atualizar preços agora'}
            </button>
          </div>

          {/* GRADE DE PRODUTOS */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const promo = getPromoInfo(item);
              const photos = itemPhotos(item);
              const fav = favIds.includes(item.id);
              return (
                <div key={item.id} className="relative rounded-2xl cosmic-card-3d overflow-hidden flex flex-col">
                  <button type="button" onClick={() => openDetail(item)} className="text-left">
                    <div className="relative aspect-square bg-white overflow-hidden">
                      {photos[0] ? (
                        <img
                          src={photos[0]}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${item.accent} flex flex-col items-center justify-center gap-1.5`}>
                          <span className="text-5xl select-none">{item.emoji}</span>
                          <span className="text-[10px] font-black tracking-[0.18em] lux-gold-text uppercase">{item.brand}</span>
                        </div>
                      )}
                      {promo && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-black text-[9px] font-black shadow-md">
                          🔥 -{promo.discountPct}% OFF
                        </span>
                      )}
                      {photos.length > 1 && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-black">
                          📷 {photos.length}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFav(item.id)}
                    aria-label="Favoritar"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center"
                  >
                    <Heart className={`w-4 h-4 ${fav ? 'text-rose-500 fill-rose-500' : 'text-white/80'}`} />
                  </button>
                  <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">{item.name}</h3>
                    <div>
                      {promo && (
                        <div className="text-[9px] text-slate-400 line-through font-mono leading-none">
                          De R$ {promo.originalBrl.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="text-[13px] font-black lux-gold-text font-mono leading-tight">{item.priceLabel}</div>
                      <div className={`text-[8px] font-black leading-none mt-0.5 ${item.verifiedPrice ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {item.verifiedPrice ? '✓ PREÇO REAL VERIFICADO' : 'preço na loja parceira'}
                      </div>
                    </div>
                    <div className="mt-auto grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openBuy(item)}
                        className="py-2 rounded-full lux-btn-gold text-[11px] font-black flex items-center justify-center gap-1"
                      >
                        🛍️ Comprar na Loja <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-xs text-slate-300">
                Nada encontrado por aqui, parça! Tenta outra busca ou classificação. 🔍
              </div>
            )}
          </div>
        </>
      ) : (
        /* ================= MINHA CONTA ================= */
        <div className="space-y-4">
          {/* LOGIN DO CLIENTE */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <User className="w-4 h-4 text-amber-300" /> Login do Cliente
            </h2>
            {profileName.trim().length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-black">
                  ✓ {profileName}
                </span>
                {profilePhone.trim() && (
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs">
                    📱 {profilePhone}
                  </span>
                )}
                <button type="button" onClick={logoutProfile} className="px-3 py-1.5 rounded-full bg-white/10 text-slate-200 text-xs font-bold">
                  Sair
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Seu nome"
                  className={INPUT_CLS}
                />
                <input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="WhatsApp (com DDD)"
                  className={INPUT_CLS}
                />
                <button type="button" onClick={loginProfile} className="py-2 rounded-full lux-btn-gold text-xs font-black">
                  Entrar
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Seu login guarda a sacola no servidor e ativa as tendências da loja pra você.
            </p>
            {Boolean(settings.supabaseUrl && settings.supabaseAnonKey) && (
              <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-3 space-y-2">
                <div className="text-[11px] font-black text-cyan-200">☁️ Conta na nuvem — leve seu login pra qualquer aparelho</div>
                {cloudUser ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-black">
                      ☁️ {cloudUser.email || cloudUser.id.slice(0, 8)}
                    </span>
                    <button type="button" onClick={cloudLogout} className="px-3 py-1.5 rounded-full bg-white/10 text-slate-200 text-xs font-bold">
                      Desconectar
                    </button>
                    <button type="button" onClick={() => void deleteMyAccount()} className="px-3 py-1.5 rounded-full bg-red-500/15 text-red-300 text-xs font-bold border border-red-500/30">
                      🗑️ Excluir conta
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={cloudEmail} onChange={(e) => setCloudEmail(e.target.value)} placeholder="E-mail" className={INPUT_CLS} />
                      <input type="password" value={cloudPassword} onChange={(e) => setCloudPassword(e.target.value)} placeholder="Senha (mín. 6)" className={INPUT_CLS} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void cloudLogin(false)} className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black">
                        Entrar
                      </button>
                      <button type="button" onClick={() => void cloudLogin(true)} className="px-4 py-2 rounded-full lux-btn-obsidian text-xs font-bold">
                        Criar conta
                      </button>
                      <button type="button" onClick={cloudGoogle} className="px-4 py-2 rounded-full bg-white text-black text-xs font-black">
                        🔵 Entrar com Google
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* CHAT & TENDÊNCIAS */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-300" /> Chat & Tendências
              </h2>
              {onOpenLiveChat && (
                <button
                  type="button"
                  onClick={() => onOpenLiveChat('loja', '🛍️ Loja dos Cria · Chat Ao Vivo')}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-500 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Abrir Chat da Loja
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">🔥 Tendências mandadas pra você</div>
              {trendItems.map((it) => {
                const tPhoto = itemPhotos(it)[0] || it.imageUrl || '';
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      setTab('loja');
                      openDetail(it);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-300/50 text-left"
                  >
                    {tPhoto ? (
                      <img src={tPhoto} alt="" className="w-11 h-11 rounded-xl object-contain bg-white/90" />
                    ) : (
                      <span className="w-11 h-11 rounded-xl bg-white/90 flex items-center justify-center text-xl">{it.emoji}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{it.name}</div>
                      <div className="text-[10px] text-amber-200 font-black">{it.priceLabel}</div>
                    </div>
                    <span className="text-[10px] font-black text-amber-300 shrink-0">Ver →</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* FAVORITOS */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" /> Favoritos ({favItems.length})
            </h2>
            {favItems.length === 0 ? (
              <p className="text-xs text-slate-300">Toque no ❤️ dos produtos pra salvar aqui — fica guardado pra depois.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {favItems.map((it) => {
                  const fPhoto = itemPhotos(it)[0] || it.imageUrl || '';
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setTab('loja');
                        openDetail(it);
                      }}
                      className="rounded-2xl bg-black/40 border border-white/10 p-2 text-left hover:border-rose-400/50"
                    >
                      {fPhoto ? (
                        <img src={fPhoto} alt="" className="w-full aspect-square rounded-xl object-contain bg-white/90 mb-1.5" />
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-white/90 mb-1.5 flex items-center justify-center text-3xl">{it.emoji}</div>
                      )}
                      <div className="text-[10px] font-bold text-white line-clamp-2">{it.name}</div>
                      <div className="text-[10px] text-amber-200 font-black">{it.priceLabel}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ENDEREÇO */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300" /> Endereço de Entrega
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input value={addr.rua} onChange={(e) => setAddr({ ...addr, rua: e.target.value })} placeholder="Rua" className={`${INPUT_CLS} col-span-2`} />
              <input value={addr.num} onChange={(e) => setAddr({ ...addr, num: e.target.value })} placeholder="Número" className={INPUT_CLS} />
              <input value={addr.bairro} onChange={(e) => setAddr({ ...addr, bairro: e.target.value })} placeholder="Bairro" className={INPUT_CLS} />
              <input value={addr.cidade} onChange={(e) => setAddr({ ...addr, cidade: e.target.value })} placeholder="Cidade" className={INPUT_CLS} />
              <input value={addr.cep} onChange={(e) => setAddr({ ...addr, cep: e.target.value })} placeholder="CEP" className={INPUT_CLS} />
            </div>
            <button type="button" onClick={saveAddr} className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black">
              Salvar endereço
            </button>
          </section>

          {/* DADOS PESSOAIS & PRIVACIDADE */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-2.5">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-300" /> Privacidade & Dados Pessoais
            </h2>
            {([
              ['showName', 'Exibir meu nome no chat da loja'],
              ['promos', 'Receber promoções e tendências'],
              ['history', 'Salvar meu histórico de compras'],
            ] as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePrivacy(key)}
                className="w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/10"
              >
                <span className="text-xs text-slate-200 text-left">{label}</span>
                <span className={`w-10 h-6 rounded-full p-0.5 transition shrink-0 ${privacy[key] ? 'bg-emerald-500' : 'bg-white/15'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${privacy[key] ? 'translate-x-4' : ''}`} />
                </span>
              </button>
            ))}
          </section>

          {/* IDIOMA */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-2.5">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-300" /> Idioma da Loja
            </h2>
            <div className="flex flex-wrap gap-2">
              {([
                ['pt-BR', '🇧🇷 Português'],
                ['en', '🇺🇸 English'],
                ['es', '🇪🇸 Español'],
              ] as [string, string][]).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => applyLangPref(code)}
                  className={`px-4 py-2 rounded-full text-xs font-black ${langPref === code ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* CENTRAL DE AJUDA */}
          <section className="rounded-2xl cosmic-card-3d p-4 space-y-2">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-300" /> Central de Ajuda
            </h2>
            {HELP_FAQ.map((f) => (
              <details key={f.q} className="rounded-2xl bg-black/40 border border-white/10 p-3">
                <summary className="text-xs font-bold text-white cursor-pointer list-none flex items-center justify-between gap-2">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-amber-300 shrink-0" />
                </summary>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </section>
        </div>
      )}

      {/* DETALHES DO PRODUTO — fotos em galeria + detalhes em grade */}
      {detailItem &&
        (() => {
          const photos = itemPhotos(detailItem);
          const promo = getPromoInfo(detailItem);
          const idx = Math.min(photoIdx, Math.max(0, photos.length - 1));
          return (
            <div
              className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md flex items-center justify-center p-3"
              onClick={() => setDetailItem(null)}
            >
              <div
                className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0c0718] border border-amber-400/45 shadow-[0_0_70px_rgba(251,191,36,0.25)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 sticky top-0 bg-[#0c0718] z-10">
                  <h3 className="text-sm font-black text-white truncate">Detalhes do produto</h3>
                  <button type="button" onClick={() => setDetailItem(null)} className="p-1.5 rounded-full bg-white/10 text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3.5">
                  <div className="relative rounded-2xl overflow-hidden bg-white">
                    {photos.length > 0 ? (
                      <img src={photos[idx]} alt={detailItem.name} className="w-full aspect-[4/3] object-contain" />
                    ) : (
                      <div className={`w-full aspect-[4/3] bg-gradient-to-br ${detailItem.accent} flex items-center justify-center`}>
                        <span className="text-7xl">{detailItem.emoji}</span>
                      </div>
                    )}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-black">
                          {idx + 1}/{photos.length}
                        </span>
                      </>
                    )}
                  </div>
                  {photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {photos.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhotoIdx(i)}
                          className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 ${i === idx ? 'border-amber-400' : 'border-white/15'}`}
                        >
                          <img src={p} alt="" className="w-full h-full object-contain bg-white" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-black text-white leading-snug">{detailItem.name}</h4>
                    <div className="text-xs text-slate-300">
                      {detailItem.brand} · {detailItem.seller || 'Loja parceira'}
                    </div>
                    <div className="mt-1.5 flex items-end gap-2">
                      {promo && (
                        <div className="text-xs text-slate-400 line-through font-mono">
                          De R$ {promo.originalBrl.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="text-lg font-black lux-gold-text font-mono">{detailItem.priceLabel}</div>
                      {promo && (
                        <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-black text-[9px] font-black">
                          -{promo.discountPct}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                  {/* grade de detalhes */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {([
                      ['Marca', detailItem.brand],
                      ['Categoria', CATEGORY_LABEL[detailItem.category] || detailItem.category],
                      ['Preço', detailItem.priceLabel],
                      ['Verificado', detailItem.verifiedPrice ? '✓ preço real verificado' : 'conferir na loja'],
                      ['Envio', 'Loja parceira envia o produto'],
                      ['Retirada', 'Frete ou retirada no checkout'],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="rounded-2xl bg-black/40 border border-white/10 p-2.5">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{k}</div>
                        <div className="text-slate-100 font-bold mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{detailItem.specs}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => openBuy(detailItem)}
                      className="py-2.5 rounded-full lux-btn-gold text-xs font-black flex items-center justify-center gap-1.5"
                    >
                      🛍️ Comprar na Loja Parceira <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Compra segura direto na loja parceira (Shopee, Mercado Livre ou Amazon) com o link do vendedor. O estoque e o envio
                    são da loja — tudo na lei.
                  </p>
                  {onCommentTarget && (
                    <button
                      type="button"
                      onClick={() => onCommentTarget(`shop:${detailItem.id}`, `🛍️ ${detailItem.name} (${detailItem.brand})`)}
                      className="w-full py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Comentários & Avaliações
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Affiliate Commission Setup Modal */}
      {affModalOpen && (
        <div
          onClick={() => setAffModalOpen(false)}
          className="fixed inset-0 z-[95] bg-black/82 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-400/45 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-300" />
                <h3 className="font-display text-base font-black text-white">
                  Receber Comissão por Cada Venda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAffModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/35 p-3.5 space-y-2.5 text-xs text-slate-200 leading-relaxed">
              <div className="font-black text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 1) Cadastre Grátis nas Lojas (1 Minuto Cada):
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.mercadolivre.com.br/l/afiliados-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-yellow-400 text-black font-black flex items-center gap-1 text-[11px]"
                >
                  Mercado Livre Afiliados <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://affiliate.shopee.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-black flex items-center gap-1 text-[11px]"
                >
                  Shopee Afiliados <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://associados.amazon.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-400 text-black font-black flex items-center gap-1 text-[11px]"
                >
                  Amazon Associados <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-cyan-200">
                Os botões de compra do seu site já estão 100% ligados! Só falta você pegar seu código grátis nesses 3 sites acima (com seu CPF/conta) para o dinheiro cair direto pra você.
              </p>
            </div>

            {/* Auto Link Extractor */}
            <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-3.5 space-y-2 text-xs">
              <div className="font-black text-cyan-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" /> 2) Jeito Fácil: Cole Qualquer Link Seu Que Eu Extraio Tudo!
              </div>
              <p className="text-[11px] text-slate-300">
                Gerou um link de afiliado no Mercado Livre, Shopee ou Amazon (até link curto)? Cole abaixo e clique em Extrair:
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={pasteLink}
                  onChange={(e) => setPasteLink(e.target.value)}
                  placeholder="https://mercadolivre.com/sec/... ou https://shope.ee/..."
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black/55 border border-white/15 text-white text-xs"
                />
                <button
                  type="button"
                  disabled={extractingLink}
                  onClick={() => void handleAutoExtractLink()}
                  className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shrink-0"
                >
                  {extractingLink ? 'Lendo...' : 'Extrair'}
                </button>
              </div>
            </div>

            {mode === 'creator' ? (
              <form onSubmit={(e) => void handleSaveAffiliateConfig(e)} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">
                    Mercado Livre · Código matt_tool
                  </label>
                  <input
                    type="text"
                    value={mlTool}
                    onChange={(e) => setMlTool(e.target.value)}
                    placeholder="Ex: 12345678"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">
                    Mercado Livre · Nome da Campanha (matt_word)
                  </label>
                  <input
                    type="text"
                    value={mlWord}
                    onChange={(e) => setMlWord(e.target.value)}
                    placeholder="Ex: morrogold_loja"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">
                    Shopee Afiliados · Seu ID de Afiliado
                  </label>
                  <input
                    type="text"
                    value={shopeeId}
                    onChange={(e) => setShopeeId(e.target.value)}
                    placeholder="Ex: 183920102"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">
                    Amazon Associados · Tag de Rastreamento
                  </label>
                  <input
                    type="text"
                    value={amazonTag}
                    onChange={(e) => setAmazonTag(e.target.value)}
                    placeholder="Ex: morrogold-20"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-cyan-300 block mb-1">
                    Seu WhatsApp para Pedidos Diretos (com DDD)
                  </label>
                  <input
                    type="text"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    placeholder="Ex: 5567999999999"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingAff}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {savingAff ? 'Salvando...' : 'Salvar Códigos de Comissão'}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 text-[11px] text-slate-300 space-y-2">
                <p>
                  🔐 Para salvar seus códigos de comissão direto no servidor, ative o <strong>Modo Criador</strong> (5 toques rápidos no logo <strong>MORRO GOLD</strong>) e volte aqui!
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://www.mercadolivre.com.br/l/afiliados-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-yellow-400 text-black font-black flex items-center gap-1"
                  >
                    Cadastro Mercado Livre <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://affiliate.shopee.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-black flex items-center gap-1"
                  >
                    Cadastro Shopee <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://associados.amazon.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-cyan-400 text-black font-black flex items-center gap-1"
                  >
                    Cadastro Amazon <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl glass-panel border border-cyan-400/45 p-5 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-300" />
                <h3 className="font-display text-base font-black text-white">
                  Sacola dos Cria ({totalItems})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-300 space-y-2">
                <Sparkles className="w-8 h-8 text-cyan-300/60 mx-auto" />
                <p>Sua sacola tá vazia, parça! Escolhe umas peças ou naves aí pra salvar.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cart.map(({ item, qty }) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {item.emoji} {item.name}
                        </div>
                        <div className="text-[11px] text-emerald-300 font-mono">
                          R$ {(item.priceBrl * qty).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -qty)}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-sm font-black">
                    <span className="text-slate-200">Total Estimado:</span>
                    <span className="text-emerald-300 font-mono">
                      R$ {totalPrice.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Identificação opcional da compra (fica privada com o dono da loja) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Seu nome (opcional)"
                      className="rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/60"
                    />
                    <input
                      type="text"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder="Zap/Instagram (opcional)"
                      className="rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/60"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void finalizePurchase()}
                    disabled={submittingSale}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    {submittingSale ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                    Comprar Tudo (R$ {totalPrice.toLocaleString('pt-BR')})
                  </button>

                  <a
                    href={buildOrderWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" /> Mandar Lista no Zap dos Cria
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setCartOpen(false);
                      onToast('Lista limpa, parça!');
                    }}
                    className="w-full py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-200"
                  >
                    Limpar Sacola
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
