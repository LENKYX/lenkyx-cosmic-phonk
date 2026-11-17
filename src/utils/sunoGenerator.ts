export type CosmicTheme =
  | 'space_odyssey'
  | 'drift_racing'
  | 'cyber_love'
  | 'dark_nebula'
  | 'festival_finale';

export type LyricLanguage = 'en_pt_chops' | 'bilingual' | 'pt_br';

export interface GeneratorInput {
  title: string;
  theme: CosmicTheme;
  bpm: number;
  language: LyricLanguage;
  vocalStyle: 'emotional_male' | 'aggressive_male' | 'female_ethereal' | 'instrumental';
  energy: 'chill_hypnotic' | 'high_festival' | 'extreme_drift';
}

// Prompt Master Oficial da marca LENKYX Cosmic Phonk (idêntico às faixas 01–20 no Suno)
export const LENKYX_MASTER_SUNO_PROMPT =
  'Futuristic Funk Melody x Brazilian Drift Phonk Fusion, cinematic sci-fi intro, catchy English male vocals, viral sing-along chorus, uplifting futuristic synths, cyberpunk atmosphere, aggressive cowbell melody, distorted 808 bass, heavy sub bass, punchy house kick, dark futuristic synths, hypnotic bassline, Portuguese phonk vocal chops, reverb, nightclub energy, intergalactic dance anthem, festival atmosphere, TikTok viral potential, powerful drops, cinematic sound design, 132 BPM, professional mix and master, Produced by LENKYX.';

const THEME_DESCRIPTORS: Record<
  CosmicTheme,
  { themePhrase: string; fxTag: string; introLines: string[]; imagery: string[]; ptDrop: string[]; breakdown: string[]; outro: string[] }
> = {
  space_odyssey: {
    themePhrase: 'intergalactic space journey, ancient cosmic signals',
    fxTag: 'alien transmission effects, spaceship ignition sounds',
    introLines: ['Signal detected...', 'Unknown transmission...', 'Year 3026...', 'LENKYX...'],
    imagery: [
      'Floating through the neon sky',
      'Stars reflecting in your eyes',
      'Lost between the dark and light',
      'Searching for a place tonight',
      'Drifting past the edge of Mars',
      'Chasing light beyond the stars',
      'Every echo fills the air',
      'Calling out to someone there',
    ],
    ptDrop: ['Outra dimensão...', 'Dimensão...', 'Subgrave...', 'Subgrave...', 'Vai subir...', 'Vai subir...'],
    breakdown: ['Coordinates locked...', 'Hyperdrive charging...', '3...', '2...', '1...', 'LAUNCH!'],
    outro: ['Transmission complete...', 'Course set to infinity...', 'LENKYX...'],
  },
  drift_racing: {
    themePhrase: 'intergalactic racing, sports cars in neon future city, high-speed futuristic adventure',
    fxTag: 'hyperdrive engine sounds, supercar turbo rev effects',
    introLines: ['Engine online...', 'Hyperdrive engaged...', 'Neon circuit unlocked...', 'LENKYX...'],
    imagery: [
      'Turbo burning in the midnight rain',
      'Flying faster through the cyber lane',
      'Purple skyline flashing in the glass',
      'No one in this galaxy can pass',
      'Carbon shadow gliding on the floor',
      'Push the throttle till the engines roar',
      'Every corner lit in neon blue',
      'Built for speed and breaking through',
    ],
    ptDrop: ['Pisa fundo...', 'Acelera...', 'Subgrave...', 'Subgrave...', 'Drift cósmico...', 'Vai!'],
    breakdown: ['Boost level maximum...', 'Gravity disabled...', '3...', '2...', '1...', 'GO!'],
    outro: ['Finish line crossed...', 'Speed of light achieved...', 'LENKYX...'],
  },
  cyber_love: {
    themePhrase: 'emotional futuristic romance, digital neon love across galaxies',
    fxTag: 'heart synchronization effects, shimmering cosmic pads',
    introLines: ['Connection established...', 'Heart synchronization detected...', 'Signal locked...', 'LENKYX...'],
    imagery: [
      'Neon lights across your face',
      'Digital dreams in outer space',
      'Every signal leads to you',
      'Like a code that breaks right through',
      'Two bright stars inside the dark',
      'Turning silence to a spark',
      'Hold my hand across the night',
      'Glowing in magenta light',
    ],
    ptDrop: ['Coração no grave...', 'Frequência...', 'Subgrave...', 'Subgrave...', 'Só nós dois...', 'Vai subir...'],
    breakdown: ['Pulse synchronized...', 'Distance zero...', '3...', '2...', '1...', 'CONNECT!'],
    outro: ['Signal forever online...', 'Across every star...', 'LENKYX...'],
  },
  dark_nebula: {
    themePhrase: 'deep space mystery, dark cosmic void, menacing neon nebula',
    fxTag: 'deep radar telemetry effects, ominous dark ambient space synths',
    introLines: ['Warning...', 'Unknown frequency detected...', 'Entering dark sector...', 'LENKYX...'],
    imagery: [
      'Shadows rising past the silent moon',
      'Heavy thunder coming way too soon',
      'Purple lightning tearing through the black',
      'Once we enter there is no way back',
      'Zero radar locking on our trail',
      'Through the storm we never fail',
      'Feel the bassline shaking every wall',
      'Hear the cosmic frequency call',
    ],
    ptDrop: ['Órbita escura...', 'Peso máximo...', 'Subgrave...', 'Subgrave...', 'Sem freio...', 'Explode!'],
    breakdown: ['Shields critical...', 'Void stabilized...', '3...', '2...', '1...', 'DROP!'],
    outro: ['Entering deep space...', 'Signal fading...', 'LENKYX...'],
  },
  festival_finale: {
    themePhrase: 'epic album finale, gigantic festival anthem, emotional space adventure finale',
    fxTag: 'final spaceship transmission, cinematic rising sweeps',
    introLines: ['Final transmission initiated...', 'All galaxies connected...', 'Prepare for liftoff...', 'LENKYX...'],
    imagery: [
      'One last journey through the stars',
      'Every universe is ours',
      'Hands up high into the neon sky',
      'Feel the rhythm making spirits fly',
      'Every beat tells a story bright',
      'Burning through the endless cosmic night',
      'From the Earth into eternity',
      'This is who we were born to be',
    ],
    ptDrop: ['Som do futuro...', 'Infinito...', 'Subgrave...', 'Subgrave...', 'Vai subir...', 'Explode a pista!'],
    breakdown: ['Final countdown...', 'Dimension unlocked...', '3...', '2...', '1...', 'ENTER!'],
    outro: ['Mission complete...', 'See you in the next galaxy...', 'LENKYX...'],
  },
};

export function generateSunoBlueprint(input: GeneratorInput): { prompt: string; lyrics: string } {
  const title = input.title.trim() || 'Cosmic Pulse';
  const upper = title.toUpperCase();
  const info = THEME_DESCRIPTORS[input.theme];

  const vocalDesc =
    input.vocalStyle === 'emotional_male'
      ? 'catchy English male vocals, massive sing-along chorus'
      : input.vocalStyle === 'aggressive_male'
      ? 'energetic powerful male vocals, viral sing-along chorus'
      : input.vocalStyle === 'female_ethereal'
      ? 'ethereal soaring female vocals with lush reverb, viral sing-along chorus'
      : 'instrumental cosmic phonk, hypnotic chopped vocal textures only';

  const langPart =
    input.language === 'pt_br'
      ? 'Brazilian Portuguese melodic funk vocals, catchy chorus, Portuguese phonk vocal chops'
      : input.language === 'bilingual'
      ? `${vocalDesc}, Brazilian Portuguese funk verses and Portuguese phonk vocal chops`
      : `${vocalDesc}, Portuguese phonk vocal chops`;

  // Mesmo Prompt de Comando Assinatura da LENKYX em TODAS as músicas!
  const prompt = [
    'Futuristic Funk Melody x Brazilian Drift Phonk Fusion',
    `${title} theme`,
    info.themePhrase,
    'cinematic sci-fi intro',
    info.fxTag,
    langPart,
    'uplifting futuristic synths',
    'cyberpunk atmosphere',
    'aggressive cowbell melody',
    'distorted 808 bass',
    'heavy sub bass',
    'punchy house kick',
    'dark futuristic synths',
    'hypnotic bassline',
    'reverb',
    'nightclub energy',
    'intergalactic dance anthem',
    'festival atmosphere',
    'TikTok viral potential',
    'powerful drops',
    'cinematic sound design',
    `${input.bpm} BPM`,
    'professional mix and master',
    'Produced by LENKYX.',
  ].join(', ');

  if (input.vocalStyle === 'instrumental') {
    const lyrics = `${upper}\nLENKYX\n\n[CINEMATIC INTRO]\n${info.introLines.join('\n')}\n\n---\n\n[PHONK DROP]\n${info.ptDrop.join('\n')}\n\n---\n\n[BREAKDOWN]\n${info.breakdown.join('\n')}\n\n---\n\n[FINAL DROP]\n${title}...\n${info.ptDrop.slice(0, 4).join('\n')}\n\n---\n\n[OUTRO]\n${info.outro.join('\n')}`;
    return { prompt, lyrics };
  }

  if (input.language === 'pt_br') {
    const lyrics = `${upper}\nLENKYX\n\n[CINEMATIC INTRO]\n${info.introLines.join('\n')}\n\n---\n\n[VERSE 1]\nAtravessando o céu de neon sem olhar pra trás\nO grave da nave treme forte, acelera mais\nLuz roxa no horizonte brilhando na escuridão\nCada batida do 808 pulsa no coração\nEstrelas refletindo na velocidade da luz\nEssa energia futurista que a galáxia conduz\n\n---\n\n[PRE-CHORUS]\nAcorda...\nSente o som...\nCruza a linha...\nDeixa a gravidade pra trás...\n\n---\n\n[CHORUS]\n${title}...\nChamando a gente...\nPelas dimensões...\nSom do futuro...\n${title}...\nPega minha mão...\nAlém das estrelas...\nSem direção...\nOh oh oh...\n${title}...\nOh oh oh...\nEternidade...\n\n---\n\n[PHONK DROP]\n${title}...\n${title}...\n${info.ptDrop.join('\n')}\n\n---\n\n[VERSE 2]\nPlanetas girando no ritmo do nosso som\nMistura de funk e phonk na vibração de neon\nDa Terra pro infinito o sinal nunca vai cair\nEnquanto o grave bater a gente vai subir\n\n---\n\n[BREAKDOWN]\n${info.breakdown.join('\n')}\n\n---\n\n[FINAL CHORUS]\n${title}...\nBrilhando forte...\nViajando pela luz infinita...\n${title}...\nSegura firme...\nJuntos nessa noite cósmica...\nOh oh oh...\n${title}...\nOh oh oh...\nHoje a gente voa...\n\n---\n\n[OUTRO]\n${info.outro.join('\n')}`;
    return { prompt, lyrics };
  }

  // Estrutura Oficial LENKYX (Idêntica às faixas 01–20 no Suno!)
  const lyrics = `${upper}\nLENKYX\n\n[CINEMATIC INTRO]\n${info.introLines.join('\n')}\n\n---\n\n[VERSE 1]\n${info.imagery.join('\n')}\n\n---\n\n[PRE-CHORUS]\nWake up...\nWake up...\nCross the line...\nLeave gravity behind...\n\n---\n\n[CHORUS]\n${title}...\nCalling me...\nThrough the stars...\nSet me free...\n${title}...\nTake my soul...\nPast the neon sky...\nBeyond control...\nOh oh oh...\n${title}...\nOh oh oh...\nEternity...\n\n---\n\n[PHONK DROP]\n${title}...\n${title}...\n${info.ptDrop.join('\n')}\n\n---\n\n[VERSE 2]\nParallel echoes fill the air\nNeon horizons everywhere\nEvery future, every past\nMoments shining built to last\nPurple shadows start to glow\nLeading where the dreamers go\nEvery heartbeat in the bass\nOpens up another space\n\n---\n\n[BREAKDOWN]\n${info.breakdown.join('\n')}\n\n---\n\n[FINAL CHORUS]\n${title}...\nBurning bright...\nTraveling through endless light...\n${title}...\nHold on tight...\nTogether through the cosmic night...\nOh oh oh...\n${title}...\nOh oh oh...\nTonight we fly...\n\n---\n\n[OUTRO]\n${info.outro.join('\n')}`;

  return { prompt, lyrics };
}
