// services/claude.ts — Integração com a API da Anthropic
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '../constants/prompts';
import { PerfilVivo } from '../store/userStore';
import { Mensagem, Tarefa, MicroEtapa } from '../store/taskStore';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Converte o histórico interno para o formato da API
function formatarHistorico(historico: Mensagem[]) {
  return historico.slice(-10).map((m) => ({       // últimas 10 mensagens
    role:    m.role === 'user' ? 'user' : 'assistant' as const,
    content: m.content,
  }));
}

// Extrai task_card do JSON se a IA retornou um
function extrairTaskCard(texto: string): { texto: string; tarefa: Partial<Tarefa> | null } {
  const match = texto.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return { texto, tarefa: null };

  try {
    const json = JSON.parse(match[1]);
    if (!json.task_card) return { texto, tarefa: null };

    const textoLimpo = texto.replace(/```json[\s\S]*?```/, '').trim();

    const tarefa: Partial<Tarefa> = {
      titulo: json.titulo,
      etapas: (json.etapas as any[]).map((e, i) => ({
        id:        String(i + 1),
        texto:     e.texto,
        minutos:   e.minutos ?? 10,
        concluida: false,
      })),
      status: 'pendente',
    };

    return { texto: textoLimpo, tarefa };
  } catch {
    return { texto, tarefa: null };
  }
}

export interface RespostaClaude {
  texto:  string;
  tarefa: Partial<Tarefa> | null;
}

export async function enviarMensagem(
  mensagem: string,
  perfil:   PerfilVivo,
  historico: Mensagem[]
): Promise<RespostaClaude> {
  const hora = new Date().toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
  });

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT(perfil, hora),
    messages:   formatarHistorico(historico).concat([
      { role: 'user', content: mensagem },
    ]),
  });

  const textoCompleto =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return extrairTaskCard(textoCompleto);
}

// Gera mensagem proativa baseada no perfil e contexto atual
export async function gerarGatilho(
  perfil:     PerfilVivo,
  proximaEtapa?: { tarefa: string; etapa: string; minutos: number }
): Promise<string> {
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const contexto = proximaEtapa
    ? `Próxima etapa disponível: "${proximaEtapa.etapa}" da tarefa "${proximaEtapa.tarefa}" — ${proximaEtapa.minutos} minutos.`
    : 'Nenhuma tarefa ativa no momento.';

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [{
      role:    'user',
      content: `
        Você é NEXUS. Gere UMA mensagem proativa curta (máx 2 linhas) para enviar ao usuário agora.
        Tom preferido: ${perfil.tom_preferido ?? 'amigavel'}.
        Horário: ${hora}.
        ${contexto}
        Regra: nunca gere culpa. Seja direto. Proponha apenas 1 ação.
      `,
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
