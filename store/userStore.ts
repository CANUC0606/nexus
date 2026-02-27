// store/userStore.ts — Perfil Vivo do usuário
import { create } from 'zustand';

export type TomPreferido = 'direto' | 'amigavel' | 'formal' | 'suave';
export type PicoEnergia  = 'manha' | 'tarde' | 'noite' | 'varia';
export type TipoNotif    = 'sim_3' | 'sim_1' | 'manual';

export interface PerfilVivo {
  // Configurações declaradas no onboarding
  pico_energia:    PicoEnergia | null;
  tom_preferido:   TomPreferido | null;
  bloqueia_em:     string | null;
  notificacoes:    TipoNotif | null;

  // Calculados pelo comportamento real
  horarios_pico_declarados:  string[];   // ex: ['08:00', '09:30']
  horarios_pico_observados:  string[];   // aprendido com o tempo
  tempo_resposta_medio_min:  number;     // em minutos
  dias_dificeis:             string[];   // ex: ['segunda', 'domingo']
  streak_atual:              number;
  streak_maximo:             number;
  ultima_conquista:          string | null;
  total_microtarefas:        number;
  taxa_conclusao:            number;     // 0–1
}

export interface UserState {
  id:               string | null;
  email:            string | null;
  onboarding_feito: boolean;
  perfil:           PerfilVivo;

  // Actions
  setUser:          (id: string, email: string) => void;
  setPerfil:        (updates: Partial<PerfilVivo>) => void;
  incrementStreak:  () => void;
  resetStreak:      () => void;
  registrarConquista: (descricao: string) => void;
  completarOnboarding: () => void;
}

const perfilInicial: PerfilVivo = {
  pico_energia:              null,
  tom_preferido:             null,
  bloqueia_em:               null,
  notificacoes:              null,
  horarios_pico_declarados:  [],
  horarios_pico_observados:  [],
  tempo_resposta_medio_min:  5,
  dias_dificeis:             [],
  streak_atual:              0,
  streak_maximo:             0,
  ultima_conquista:          null,
  total_microtarefas:        0,
  taxa_conclusao:            0,
};

export const useUserStore = create<UserState>((set) => ({
  id:               null,
  email:            null,
  onboarding_feito: false,
  perfil:           perfilInicial,

  setUser: (id, email) => set({ id, email }),

  setPerfil: (updates) =>
    set((state) => ({
      perfil: { ...state.perfil, ...updates },
    })),

  incrementStreak: () =>
    set((state) => {
      const novo = state.perfil.streak_atual + 1;
      return {
        perfil: {
          ...state.perfil,
          streak_atual:  novo,
          streak_maximo: Math.max(novo, state.perfil.streak_maximo),
        },
      };
    }),

  resetStreak: () =>
    set((state) => ({
      perfil: { ...state.perfil, streak_atual: 0 },
    })),

  registrarConquista: (descricao) =>
    set((state) => ({
      perfil: {
        ...state.perfil,
        ultima_conquista:   descricao,
        total_microtarefas: state.perfil.total_microtarefas + 1,
      },
    })),

  completarOnboarding: () => set({ onboarding_feito: true }),
}));
