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
} from 'lucide-react';
import { AppMode, AppSettings } from '../types';
import { LenkyxEdgeLogo } from './LenkyxEdgeLogo';

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
  | 'eletronicos';

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
  commissionEst: string;
  accent: string;
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
    name: 'Combo Oficial Mansão Maromba (Whisky, Vodka & Energético) — Toguro',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 149,
    priceLabel: 'R$ 149 (Combo)',
    badge: '🏆 PATROCINADOR OFICIAL',
    emoji: '🥃',
    specs: 'Bebida oficial do Toguro & Mansão Maromba · Sabores Tiger, Maçã Verde, Melancia e Whisky',
    searchQuery: 'Bebida Mansao Maromba Toguro combo',
    commissionEst: '🏆 Destaque Oficial',
    accent: 'from-amber-400/40 to-yellow-600/25',
  },
  {
    id: 'shop-mansao-maromba-pack',
    name: 'Pack Mansão Maromba Ice, Gin & Energético Gelado (Fardo Rolê)',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 119,
    priceLabel: 'R$ 119 (Fardo)',
    badge: '🔥 TOP DO ROLÊ',
    emoji: '🧊',
    specs: 'Fardo oficial pronto pra gelar e mandar no baile · Sabor marcante e zero erro',
    searchQuery: 'Mansao Maromba bebida energetico fardo',
    commissionEst: '🏆 Patrocinador VIP',
    accent: 'from-yellow-400/35 to-amber-500/25',
  },
  {
    id: 'shop-mansao-maromba-kit-treino',
    name: 'Kit Oficial Mansão Maromba: Regata/Camisa + Coqueteleira & Whey',
    brand: 'Mansão Maromba · Toguro',
    category: 'mansao',
    priceBrl: 189,
    priceLabel: 'R$ 189',
    badge: '💪 SHAPE DOS CRIA',
    emoji: '🏋️',
    specs: 'Estilo Mansão Maromba de verdade · Peita + Suplemento + Shakeira oficial',
    searchQuery: 'Camiseta Suplemento Mansao Maromba Toguro',
    commissionEst: '10% a 15% comissão',
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
    specs: 'Câmera cinema pros Reels + PS5 4K pra jogar ouvindo o som do app',
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

interface Props {
  settings: AppSettings;
  mode: AppMode;
  initialCategory?: ShopCat;
  categoryNonce?: number;
  onSaveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  onToast: (msg: string) => void;
}

export const ShopCriaView: React.FC<Props> = ({
  settings,
  mode,
  initialCategory,
  categoryNonce,
  onSaveSettings,
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

  const getPromoInfo = (item: CriaProduct): { discountPct: number; originalBrl: number } | null => {
    if (item.category === 'motos' || item.category === 'carros') return null;
    const pctMap: Record<string, number> = {
      'shop-mansao-maromba-combo': 28,
      'shop-mansao-maromba-pack': 25,
      'shop-mansao-maromba-kit-treino': 30,
      'shop-bebidas-combo-buchanans': 20,
      'shop-perfume-1million': 24,
      'shop-perfume-sauvage-bleu': 18,
      'shop-perfume-212-jpg': 27,
      'shop-narguile-triton': 22,
      'shop-essencias-narguile': 32,
      'shop-carvao-rosh-narguile': 35,
      'shop-lacoste-polo': 25,
      'shop-lacoste-corta': 20,
      'shop-oakley-corta': 28,
      'shop-nike-tech': 22,
      'shop-minas-biquini-vip': 34,
      'shop-minas-baile-cargo': 30,
      'shop-jbl-boombox': 20,
    };
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) hash = (hash * 31 + item.id.charCodeAt(i)) % 100;
    const discountPct = pctMap[item.id] ?? (hash % 3 === 0 ? 18 : hash % 3 === 1 ? 25 : 30);
    const originalBrl = Math.round(item.priceBrl / (1 - discountPct / 100));
    return { discountPct, originalBrl };
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CRIA_CATALOG.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (onlyDiscounts && !getPromoInfo(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.brand} ${p.specs} ${p.badge}`.toLowerCase().includes(q);
    });
  }, [cat, query, onlyDiscounts]);

  const totalItems = cart.reduce((acc, c) => acc + c.qty, 0);
  const totalPrice = cart.reduce((acc, c) => acc + c.item.priceBrl * c.qty, 0);

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

  const buildOrderWhatsappUrl = () => {
    const lines = cart.map((c) => `• ${c.qty}x ${c.item.name} (${c.item.priceLabel})`);
    const msg =
      `Salve! Montei minha lista de compras na Loja dos Cria do LENKYX Brasil 🔥:\n\n` +
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
          onToast('⚡ Código extraído do link! Ative o Modo Criador (5 toques no logo LENKYX) para salvar.');
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

  return (
    <div className="space-y-5 pb-36 md:pb-28 cosmic-scene">
      {/* LUXURY VIP BOUTIQUE HEADER */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LenkyxEdgeLogo size="md" className="shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> BOUTIQUE VIP BLACK · IMAGENS REAIS DAS MARCAS 🇧🇷
            </div>
            <h1 className="font-display text-base sm:text-xl font-black lux-gold-text truncate">
              👑 Loja dos Cria VIP · Grife, Ouro, Motos & Naves ({CRIA_CATALOG.length} Kits)
            </h1>
            <p className="text-[11px] text-slate-300">
              Lacoste, Oakley Juliet, Invicta, Ouro 18k, Hornet, S1000RR, BMW, Porsche & JBL com fotos reais e comissão ativa!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAffModalOpen(true)}
            className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition ${
              hasAnyAffiliate
                ? 'lux-btn-obsidian border-emerald-400/50 text-emerald-200'
                : 'lux-btn-obsidian border-amber-400/50 text-amber-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>{hasAnyAffiliate ? `Comissão Ativa (${affiliateClicks})` : 'Ativar Comissões'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sacola ({totalItems})</span>
            {totalPrice > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-black/15 font-mono text-[10px]">
                R$ {totalPrice.toLocaleString('pt-BR')}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Search + Luxury Category Capsules */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-amber-300 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca ou nave: Lacoste, Juliet, Romeo 2, Invicta, Ouro 18k, Hornet, BMW, Porsche, JBL..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-black/60 border border-amber-400/25 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-300 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setOnlyDiscounts((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 border transition ${
              onlyDiscounts
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-black border-amber-300 shadow-[0_0_16px_rgba(244,63,94,0.45)]'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-400/45 text-rose-200'
            }`}
          >
            🏷️ Descontos OFF (-35%)
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 ${
                cat === c.id ? 'lux-btn-gold' : 'lux-btn-obsidian text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* BANNER PATROCINADOR OFICIAL: MANSÃO MAROMBA · TOGURO */}
      <section className="rounded-3xl overflow-hidden relative border border-amber-400/50 bg-gradient-to-r from-[#171103] via-[#090a10] to-[#1a0d05] p-4 sm:p-5 shadow-[0_0_32px_rgba(245,200,76,0.22)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-[0.18em]">
              <span>🏆 PATROCINADOR OFICIAL DO APP</span>
            </div>
            <h2 className="font-display text-lg sm:text-2xl font-black lux-gold-text">
              🥃 MANSÃO MAROMBA · TOGURO — COMBOS & BEBIDAS DO ROLÊ
            </h2>
            <p className="text-xs text-slate-200/90 max-w-2xl">
              Destaque oficial pros parças e pras minas: Combo Whisky, Vodka, Gin, Ice & Energético Mansão Maromba com até <span className="text-emerald-300 font-black">30% OFF</span> no rolê!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCat('mansao');
                setQuery('');
                onToast('🏆 Mostrando produtos oficiais da Mansão Maromba (Toguro)!');
              }}
              className="px-4 py-2.5 rounded-full lux-btn-gold text-xs font-black shadow-lg"
            >
              🥃 Ver Mansão Maromba
            </button>
            <button
              type="button"
              onClick={() => {
                setCat('narguile');
                setQuery('');
                onToast('💨 Mostrando Narguiles & Essências do rolê!');
              }}
              className="px-4 py-2.5 rounded-full lux-btn-obsidian border-amber-400/40 text-xs font-black text-amber-200"
            >
              💨 Narguiles & Essências
            </button>
          </div>
        </div>
      </section>

      {/* LOOKBOOK OFICIAL — CRIAS & MINAS PORTANDO OS KITS COMO MODELOS + DESTAQUE ITENS DE LUXO */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 space-y-3.5 border border-amber-400/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> LOOKBOOK FAVELA VIP · MODELOS PORTANDO OS KITS
            </div>
            <h2 className="font-display text-base sm:text-lg font-black text-white">
              🔥 Os Crias & As Minas Portando os Kits — Destaque nos Itens de Luxo
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-[10px] font-black text-amber-200">
            💎 Peças de Luxo com Desconto OFF
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              img: '/shop/cria-modelo-kit.jpg',
              badge: '👑 MODELO CRIA · LAJE',
              title: 'Kit Patrão Preto & Ouro 24K',
              luxuryHighlight: '✨ Usando: Corta-Vento Luxo + Juliet Ouro + Correntão 18K + Invicta (-25% OFF)',
              tags: [
                { label: '🧥 Roupas Grife', cat: 'roupas' as ShopCat, q: 'Lacoste' },
                { label: '🕶️ Juliet', cat: 'oculos' as ShopCat, q: 'Juliet' },
                { label: '🥇 Corrente 18k', cat: 'correntes' as ShopCat, q: 'Ouro' },
              ],
            },
            {
              img: '/shop/mina-modelo-verao.jpg',
              badge: '💎 MODELO MINA · VERÃO VIP',
              title: 'Kit Piscina, Biquíni & Perfume',
              luxuryHighlight: '✨ Usando: Biquíni Corrente 24K + Óculos Prada + 212 VIP Rosé (-34% OFF)',
              tags: [
                { label: '👙 Kit Mina', cat: 'roupas' as ShopCat, q: 'Biquíni' },
                { label: '🕶️ Óculos', cat: 'oculos' as ShopCat, q: 'Prada' },
                { label: '🍾 Perfumes', cat: 'perfumes' as ShopCat, q: '212' },
              ],
            },
            {
              img: '/shop/casal-ostentacao-baile.jpg',
              badge: '🏍️ CASAL NO BAILE · NAVE',
              title: 'Kit Casal Ostentação Noturno',
              luxuryHighlight: '✨ Usando: Bomber + Cargo + Cordão Ice + Hornet / BMW M4 (-22% OFF)',
              tags: [
                { label: '💃 Look Baile', cat: 'roupas' as ShopCat, q: 'Cargo' },
                { label: '🏍️ Motos Grau', cat: 'motos' as ShopCat, q: '' },
                { label: '🚘 Naves', cat: 'carros' as ShopCat, q: '' },
              ],
            },
            {
              img: '/shop/role-narguile-bebidas.jpg',
              badge: '🥃 ROLÊ VIP · MANSÃO MAROMBA',
              title: 'Camarote Narguile & Bebidas',
              luxuryHighlight: '✨ Na Mesa: Combo Mansão Maromba + Triton Zip Ouro + 1 Million (-28% OFF)',
              tags: [
                { label: '🏆 Mansão Maromba', cat: 'mansao' as ShopCat, q: '' },
                { label: '💨 Narguiles', cat: 'narguile' as ShopCat, q: '' },
                { label: '🍾 1 Million', cat: 'perfumes' as ShopCat, q: 'Million' },
              ],
            },
          ].map((look) => (
            <div
              key={look.title}
              className="group rounded-2xl overflow-hidden bg-[#080a12] border border-amber-400/25 hover:border-amber-300/70 transition flex flex-col justify-between shadow-xl"
            >
              <div className="relative aspect-[4/4.2] overflow-hidden bg-black">
                <img
                  src={look.img}
                  alt={look.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06070c] via-black/20 to-transparent pointer-events-none" />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/50 text-[9px] font-black text-amber-200">
                  {look.badge}
                </span>
                <div className="absolute bottom-2 left-2.5 right-2.5 space-y-1">
                  <div className="font-display text-sm font-black text-white drop-shadow">
                    {look.title}
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-amber-400/20 border border-amber-300/45 text-[10px] font-bold text-amber-100 leading-snug backdrop-blur-sm">
                    {look.luxuryHighlight}
                  </div>
                </div>
              </div>
              <div className="p-2.5 flex flex-wrap gap-1.5 bg-[#090b14] border-t border-white/10">
                {look.tags.map((tg) => (
                  <button
                    key={tg.label}
                    type="button"
                    onClick={() => {
                      setCat(tg.cat);
                      setQuery(tg.q);
                      onToast(`💎 Mostrando: ${tg.label}`);
                    }}
                    className="px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/40 text-[10px] font-black text-amber-100 transition active:scale-95"
                  >
                    {tg.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ESTÚDIOS DE TATUAGEM VIP DOS CRIAS & PARCEIRAS + MELHORES TATUADORES DO BRASIL */}
      <section className="rounded-3xl cosmic-card-3d p-4 sm:p-5 space-y-4 border border-amber-400/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden border border-amber-400/35 shadow-xl">
            <img
              src="/shop/estudio-tatuagem-crias.jpg"
              alt="Estúdio de Tatuagem VIP dos Crias e Parceiras"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/85 border border-amber-400/50 text-[9px] font-black text-amber-200">
              🖋️ ESTÚDIOS VIP · OS MANOS & AS MINAS
            </span>
            <div className="absolute bottom-2.5 left-3 right-3 text-xs font-bold text-white">
              Fechamento de Braço, Realismo, Chicano & Fine Line das Parceiras
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                🖋️ GUIA OFICIAL DE TATUAGEM DOS CRIA · BRASIL
              </div>
              <h2 className="font-display text-base sm:text-xl font-black text-white">
                Melhores Estúdios & Tatuadores Mais Bravos (Os Manos & As Minas)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Indicação dos artistas referência no Brasil em Realismo Preto & Cinza, Chicano, Blackwork e Fine Line feminino. Clique para achar o estúdio ou chamar no mapa!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'Beicinho · Masters Of Tattoo', city: 'Rio de Janeiro (RJ)', style: 'Realismo Preto & Cinza · +150 prêmios', query: 'Masters Of Tattoo Beicinho Rio de Janeiro' },
                { name: 'Marcus Gullo Tattoo', city: 'Rio de Janeiro (RJ)', style: 'Realismo Pesado & Fechamento dos Cria', query: 'Marcus Gullo tattoo Rio de Janeiro' },
                { name: 'Wallace Farias & Murilo Oliveira', city: 'São Paulo (SP)', style: 'Black & Grey · Chicano / Lettering', query: 'Wallace Farias tatuador Sao Paulo' },
                { name: 'Clari Benatti & Rodrigo Soares', city: 'RJ / SP', style: 'Fine Line, Mandala & Ornamental pras Minas', query: 'Clari Benatti Rodrigo Soares tattoo' },
              ].map((artist) => (
                <a
                  key={artist.name}
                  href={`https://www.google.com/maps/search/${encodeURIComponent(artist.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-black/60 hover:bg-amber-500/10 border border-amber-400/25 hover:border-amber-300/60 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-amber-200 truncate">{artist.name}</div>
                    <div className="text-[10px] text-slate-300 truncate">{artist.style} · {artist.city}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.google.com/maps/search/melhor+estudio+de+tatuagem+perto+de+mim"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full lux-btn-gold text-xs font-black flex items-center gap-1.5"
              >
                📍 Achar Estúdio Perto de Mim
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.instagram.com/explore/tags/tatuagemrealismo/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full lux-btn-obsidian text-xs font-bold text-slate-100 flex items-center gap-1.5"
              >
                📸 Ver Artes & Referências
                <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PUBLISHED ITEMS STRIP (Proxied Real Photos + Real Store Links + Affiliate Commission) */}
      <section className="rounded-3xl cosmic-card-3d p-4 space-y-3 border border-amber-400/25">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" /> VITRINE AO VIVO DO BRASIL · FOTOS REAIS E COMISSÃO
            </div>
            <h2 className="font-display text-sm sm:text-base font-black text-white">
              Ofertas Publicadas Agora ({liveItems.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const activeCatObj = CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];
              void fetchLiveOffers(query.trim() || activeCatObj.liveQuery);
            }}
            disabled={liveLoading}
            className="px-3.5 py-1.5 rounded-full lux-btn-obsidian text-xs font-bold text-amber-200 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${liveLoading ? 'animate-spin' : ''}`} />
            Atualizar Vitrine
          </button>
        </div>

        {liveLoading && liveItems.length === 0 ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-amber-200">
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            <span>Carregando anúncios oficiais do Brasil...</span>
          </div>
        ) : liveItems.length === 0 ? (
          <p className="text-xs text-slate-300">
            Use os cards abaixo para abrir ofertas oficiais com seu link de comissão!
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {liveItems.map((it) => (
              <a
                key={it.id}
                href={it.affiliateUrl || it.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackAndOpenOffer}
                className="group w-44 sm:w-48 shrink-0 rounded-2xl overflow-hidden bg-[#0a0c14] border border-amber-400/20 hover:border-amber-300/70 transition flex flex-col justify-between shadow-lg"
              >
                <div className="relative aspect-square bg-white overflow-hidden">
                  <img
                    src={`/api/shop/img-proxy?url=${encodeURIComponent(it.imageUrl)}&q=${encodeURIComponent(it.title)}`}
                    alt={it.title}
                    loading="lazy"
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/85 border border-amber-400/35 text-amber-200 text-[9px] font-black">
                    {it.storeName}
                  </span>
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="text-[11px] font-bold text-white line-clamp-2 leading-snug">
                    {it.title}
                  </div>
                  <div className="w-full py-1.5 px-2 rounded-full lux-btn-gold text-[10px] font-black flex items-center justify-center gap-1">
                    <span>Comprar · Comissão</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Complete Luxury Curated Grid with REAL Brand Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const offerUrl = buildCommissionUrl(item.searchQuery, item.category);
          const photoFailed = Boolean(brokenPhotoIds[item.id]);
          const realPhotoUrl = `/api/shop/photo?q=${encodeURIComponent(item.searchQuery)}`;
          const promo = getPromoInfo(item);
          return (
            <div
              key={item.id}
              className="group rounded-3xl cosmic-card-3d overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Real Brand/Product Photo Frame */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#0f1320] to-[#06070c] overflow-hidden border-b border-amber-400/20">
                  {!photoFailed ? (
                    <img
                      src={realPhotoUrl}
                      alt={`${item.brand} — ${item.name}`}
                      loading="lazy"
                      onError={() =>
                        setBrokenPhotoIds((prev) => ({
                          ...prev,
                          [item.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${item.accent} flex flex-col items-center justify-center gap-1.5 p-4`}
                    >
                      <span className="text-5xl select-none drop-shadow-lg">{item.emoji}</span>
                      <span className="font-logo text-xs font-black tracking-[0.2em] lux-gold-text uppercase">
                        {item.brand}
                      </span>
                    </div>
                  )}

                  {/* Luxury Dark Gradient Vignette + Brand Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070910] via-black/15 to-black/35 pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-[9px] font-black text-amber-200 tracking-wide truncate">
                      {item.badge}
                    </span>
                    {promo ? (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-black text-[9px] font-black shrink-0 shadow-md">
                        🔥 -{promo.discountPct}% OFF
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-emerald-400/40 text-[9px] font-black text-emerald-300 shrink-0">
                        {item.commissionEst}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/75 border border-white/15 text-[10px] font-black uppercase tracking-wider text-white">
                      {item.brand}
                    </span>
                    <div className="px-3 py-1 rounded-xl bg-black/85 border border-amber-400/50 text-right shadow-lg">
                      {promo && (
                        <div className="text-[9px] text-slate-400 line-through font-mono leading-none mb-0.5">
                          De R$ {promo.originalBrl.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="font-mono text-sm font-black lux-gold-text leading-none">
                        {item.priceLabel}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pb-2 space-y-1">
                  <h3 className="font-display text-sm font-black text-white leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed">{item.specs}</p>
                </div>
              </div>

              <div className="p-4 pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="py-2 px-3 rounded-full lux-btn-obsidian text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300" /> Na Sacola
                  </button>
                  <a
                    href={offerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackAndOpenOffer}
                    className="py-2 px-3 rounded-full lux-btn-gold text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <span>Comprar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {item.category !== 'motos' && item.category !== 'carros' && (
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <a
                      href={buildStoreUrl(item.searchQuery, 'ml')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackAndOpenOffer}
                      className="py-1.5 rounded-full bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 font-bold text-center transition"
                    >
                      Mercado Livre
                    </a>
                    <a
                      href={buildStoreUrl(item.searchQuery, 'shopee')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackAndOpenOffer}
                      className="py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/25 border border-orange-400/30 text-orange-200 font-bold text-center transition"
                    >
                      Shopee
                    </a>
                    <a
                      href={buildStoreUrl(item.searchQuery, 'amazon')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackAndOpenOffer}
                      className="py-1.5 rounded-full bg-cyan-400/10 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-200 font-bold text-center transition"
                    >
                      Amazon
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                    placeholder="Ex: lenkyx_loja"
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
                    placeholder="Ex: lenkyx-20"
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
                  🔐 Para salvar seus códigos de comissão direto no servidor, ative o <strong>Modo Criador</strong> (5 toques rápidos no logo <strong>LENKYX</strong>) e volte aqui!
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
