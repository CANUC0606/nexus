// store/taskStore.ts — Tarefas e micro-etapas
import { create } from 'zustand';

export interface MicroEtapa {
  id:         string;
  texto:      string;
  minutos:    number;
  concluida:  boolean;
  concluida_em?: Date;
}

export interface Tarefa {
  id:           string;
  titulo:       string;
  etapas:       MicroEtapa[];
  status:       'pendente' | 'em_andamento' | 'concluida' | 'adiada';
  energia:      'baixa' | 'media' | 'alta';
  criado_em:    Date;
  concluido_em?: Date;
  horario_sugerido?: string;
}

export interface Mensagem {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  task_card?: Tarefa | null;
}

interface TaskState {
  tarefas:    Tarefa[];
  historico:  Mensagem[];
  carregando: boolean;

  // Actions
  addTarefa:       (tarefa: Omit<Tarefa, 'id' | 'criado_em'>) => Tarefa;
  concluirEtapa:   (tarefaId: string, etapaId: string) => void;
  adiarTarefa:     (tarefaId: string) => void;
  addMensagem:     (msg: Omit<Mensagem, 'id' | 'timestamp'>) => void;
  setCarregando:   (v: boolean) => void;
  limparHistorico: () => void;

  // Getters
  tarefasAtivas:   () => Tarefa[];
  proximaEtapa:    () => { tarefa: Tarefa; etapa: MicroEtapa } | null;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tarefas:    [],
  historico:  [],
  carregando: false,

  addTarefa: (dados) => {
    const tarefa: Tarefa = {
      ...dados,
      id:        uid(),
      criado_em: new Date(),
    };
    set((s) => ({ tarefas: [...s.tarefas, tarefa] }));
    return tarefa;
  },

  concluirEtapa: (tarefaId, etapaId) =>
    set((s) => ({
      tarefas: s.tarefas.map((t) => {
        if (t.id !== tarefaId) return t;
        const etapas = t.etapas.map((e) =>
          e.id === etapaId
            ? { ...e, concluida: true, concluida_em: new Date() }
            : e
        );
        const todasConcluidas = etapas.every((e) => e.concluida);
        return {
          ...t,
          etapas,
          status:       todasConcluidas ? 'concluida' : 'em_andamento',
          concluido_em: todasConcluidas ? new Date() : undefined,
        };
      }),
    })),

  adiarTarefa: (tarefaId) =>
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        t.id === tarefaId ? { ...t, status: 'adiada' } : t
      ),
    })),

  addMensagem: (msg) =>
    set((s) => ({
      historico: [
        ...s.historico,
        { ...msg, id: uid(), timestamp: new Date() },
      ],
    })),

  setCarregando: (v) => set({ carregando: v }),

  limparHistorico: () => set({ historico: [] }),

  tarefasAtivas: () =>
    get().tarefas.filter((t) => t.status !== 'concluida'),

  proximaEtapa: () => {
    const ativas = get().tarefasAtivas();
    for (const tarefa of ativas) {
      const etapa = tarefa.etapas.find((e) => !e.concluida);
      if (etapa) return { tarefa, etapa };
    }
    return null;
  },
}));
