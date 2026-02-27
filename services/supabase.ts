// services/supabase.ts — Cliente Supabase e helpers de banco
import { createClient } from '@supabase/supabase-js';
import { PerfilVivo } from '../store/userStore';
import { Tarefa, Mensagem } from '../store/taskStore';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginComEmail(email: string, senha: string) {
  return supabase.auth.signInWithPassword({ email, password: senha });
}

export async function cadastrar(email: string, senha: string) {
  return supabase.auth.signUp({ email, password: senha });
}

export async function sair() {
  return supabase.auth.signOut();
}

export function sessaoAtual() {
  return supabase.auth.getSession();
}

// ── PERFIL VIVO ───────────────────────────────────────────────────────────────

export async function salvarPerfil(userId: string, perfil: Partial<PerfilVivo>) {
  return supabase
    .from('usuarios')
    .upsert({ id: userId, perfil_vivo: perfil })
    .select()
    .single();
}

export async function carregarPerfil(userId: string) {
  return supabase
    .from('usuarios')
    .select('perfil_vivo')
    .eq('id', userId)
    .single();
}

// ── TAREFAS ───────────────────────────────────────────────────────────────────

export async function salvarTarefa(userId: string, tarefa: Tarefa) {
  return supabase.from('tarefas').upsert({
    id:                 tarefa.id,
    usuario_id:         userId,
    titulo:             tarefa.titulo,
    micro_etapas:       tarefa.etapas,
    status:             tarefa.status,
    energia_necessaria: tarefa.energia,
    criado_em:          tarefa.criado_em,
    concluido_em:       tarefa.concluido_em ?? null,
  });
}

export async function carregarTarefas(userId: string) {
  return supabase
    .from('tarefas')
    .select('*')
    .eq('usuario_id', userId)
    .neq('status', 'concluida')
    .order('criado_em', { ascending: false });
}

// ── CONVERSAS ─────────────────────────────────────────────────────────────────

export async function salvarMensagem(userId: string, msg: Mensagem) {
  return supabase.from('conversas').insert({
    usuario_id: userId,
    mensagem:   msg.content,
    papel:      msg.role === 'user' ? 'usuario' : 'assistente',
    timestamp:  msg.timestamp,
  });
}

export async function carregarHistorico(userId: string, limite = 20) {
  return supabase
    .from('conversas')
    .select('*')
    .eq('usuario_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limite);
}

// ── GATILHOS ─────────────────────────────────────────────────────────────────

export async function salvarGatilho(userId: string, horario: string, tipo: string) {
  return supabase.from('gatilhos').insert({
    usuario_id: userId,
    horario,
    tipo,
    ativo: true,
  });
}

export async function carregarGatilhos(userId: string) {
  return supabase
    .from('gatilhos')
    .select('*')
    .eq('usuario_id', userId)
    .eq('ativo', true);
}
