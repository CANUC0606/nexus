import { executarBraco } from './arms';
import { responderComandoRapido } from './claude';

interface VoiceCommandResult {
  handled: boolean;
  assistantText?: string;
  passthroughText?: string;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractWakeBody(input: string): string | null {
  const cleaned = input.trim();
  const lower = normalizeText(cleaned);

  if (!lower.startsWith('nexus')) return null;

  // Remove only the first token (wake word) preserving original casing for the body.
  const body = cleaned.replace(/^\s*n[ée]xus\b[,:-]?\s*/i, '').trim();
  return body;
}

function extractQuotedText(source: string): string | null {
  const quoted = source.match(/["“”']([^"“”']{2,})["“”']/);
  return quoted?.[1]?.trim() ?? null;
}

function extractAfterKeyword(raw: string, keyword: string): string | null {
  const idx = normalizeText(raw).indexOf(keyword);
  if (idx < 0) return null;
  const slice = raw.slice(idx + keyword.length).replace(/^\s*[:,.-]?\s*/, '').trim();
  return slice.length > 0 ? slice : null;
}

async function explicarTelaComOCR(): Promise<string> {
  const ocr = await executarBraco<{ source: 'camera' }, { canceled: boolean; texto: string }>('ocr_vision', {
    source: 'camera',
  });

  if (ocr.canceled) {
    return 'Sem problema. Quando quiser, me chama e aponta a camera para a tela que eu explico.';
  }

  if (!ocr.texto.trim()) {
    return 'Nao consegui ler texto suficiente nessa imagem. Tenta um print mais nítido e com mais contraste.';
  }

  return responderComandoRapido(
    [
      'Voce e NEXUS, um assistente direto e humano.',
      'Explique o conteudo da tela em portugues brasileiro.',
      'Formato:',
      '1) Resumo em 1 frase',
      '2) Ate 3 bullets com o que importa',
      '3) Proxima acao sugerida em 1 linha',
      'Sem jargao e sem enrolacao.'
    ].join(' '),
    ocr.texto,
    550
  );
}

async function analisarMensagemSuspeita(rawBody: string): Promise<string> {
  const quoted = extractQuotedText(rawBody);
  const after = extractAfterKeyword(rawBody, 'mensagem');
  const textoAlvo = quoted ?? after ?? '';

  if (!textoAlvo.trim()) {
    const ocr = await executarBraco<{ source: 'camera' }, { canceled: boolean; texto: string }>('ocr_vision', {
      source: 'camera',
    });

    if (ocr.canceled || !ocr.texto.trim()) {
      return 'Me passe o texto da mensagem ou fotografe ela com boa nitidez para eu analisar o risco.';
    }

    return responderComandoRapido(
      [
        'Voce e um analista de seguranca digital para usuarios comuns.',
        'Analise se a mensagem parece golpe/phishing.',
        'Responda em portugues BR com:',
        '- Nivel de risco: Baixo/Medio/Alto',
        '- 3 sinais de risco encontrados',
        '- Acao recomendada imediata',
        'Nao invente informacoes fora do texto enviado.'
      ].join(' '),
      ocr.texto,
      500
    );
  }

  return responderComandoRapido(
    [
      'Voce e um analista de seguranca digital para usuarios comuns.',
      'Analise se a mensagem parece golpe/phishing.',
      'Responda em portugues BR com:',
      '- Nivel de risco: Baixo/Medio/Alto',
      '- 3 sinais de risco encontrados',
      '- Acao recomendada imediata',
      'Nao invente informacoes fora do texto enviado.'
    ].join(' '),
    textoAlvo,
    500
  );
}

async function traduzirMensagem(rawBody: string): Promise<string> {
  const quoted = extractQuotedText(rawBody);
  const afterTraduz = extractAfterKeyword(rawBody, 'traduza');
  const textoAlvo = quoted ?? afterTraduz ?? '';

  if (!textoAlvo.trim()) {
    const ocr = await executarBraco<{ source: 'camera' }, { canceled: boolean; texto: string }>('ocr_vision', {
      source: 'camera',
    });

    if (ocr.canceled || !ocr.texto.trim()) {
      return 'Me diga o texto ou fotografe a mensagem e eu traduzo na hora.';
    }

    return responderComandoRapido(
      [
        'Voce e um tradutor preciso.',
        'Traduza o texto para portugues.',
        'Retorne somente a traducao final e uma observacao curta de tom se necessario.'
      ].join(' '),
      ocr.texto,
      350
    );
  }

  const bodyNorm = normalizeText(rawBody);
  const idiomaDestino = bodyNorm.includes('para ingles')
    ? 'ingles'
    : bodyNorm.includes('para espanhol')
      ? 'espanhol'
      : bodyNorm.includes('para portugues')
        ? 'portugues'
        : 'portugues';

  return responderComandoRapido(
    [
      'Voce e um tradutor preciso.',
      `Traduza o texto para ${idiomaDestino}.`,
      'Retorne somente a traducao final e, abaixo, uma linha curta com observacao de tom se necessario.'
    ].join(' '),
    textoAlvo,
    350
  );
}

export function hasWakeWord(input: string): boolean {
  return extractWakeBody(input) !== null;
}

export async function processarComandoNexus(rawInput: string): Promise<VoiceCommandResult> {
  const body = extractWakeBody(rawInput);
  if (body === null) return { handled: false };

  const norm = normalizeText(body);
  if (!norm) {
    return {
      handled: true,
      assistantText: 'Sempre com voce. Manda o comando que eu executo agora.',
    };
  }

  if (
    norm.includes('explique o que esta na minha tela') ||
    norm.includes('explique oque esta na minha tela') ||
    norm.includes('me explique o que esta na minha tela') ||
    norm.includes('me explique oque esta na minha tela')
  ) {
    return {
      handled: true,
      assistantText: await explicarTelaComOCR(),
    };
  }

  if (norm.includes('olha isso') || norm.includes('ve isso') || norm.includes('analise essa tela')) {
    return {
      handled: true,
      assistantText: await explicarTelaComOCR(),
    };
  }

  if (
    norm.includes('analise essa mensagem') ||
    norm.includes('parece suspeita') ||
    norm.includes('mensagem suspeita')
  ) {
    return {
      handled: true,
      assistantText: await analisarMensagemSuspeita(body),
    };
  }

  if (norm.startsWith('traduza') || norm.includes('traduza o que esta escrito')) {
    return {
      handled: true,
      assistantText: await traduzirMensagem(body),
    };
  }

  return {
    handled: true,
    passthroughText: body,
  };
}
