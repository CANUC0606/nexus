// constants/colors.ts — Paleta oficial NEXUS
export const Colors = {
  // Fundos
  void:    '#04040C',
  deep:    '#080816',
  layer:   '#0C0C20',
  surface: '#12122A',
  surface2:'#1A1A32',

  // Bordas
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',

  // Cores principais
  cyan:    '#00C8D4',
  cyanDim: 'rgba(0,200,212,0.15)',
  cyanGlow:'rgba(0,200,212,0.4)',

  violet:      '#8B5CF6',
  violetDim:   'rgba(139,92,246,0.2)',
  violetGlow:  'rgba(139,92,246,0.5)',

  neon:    '#39FF14',
  neonDim: 'rgba(57,255,20,0.12)',

  amber:   '#FBBF24',
  amberDim:'rgba(251,191,36,0.15)',

  rose:    '#FF2D78',
  roseDim: 'rgba(255,45,120,0.15)',

  // Texto
  text:  'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.55)',
  text3: 'rgba(255,255,255,0.25)',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
