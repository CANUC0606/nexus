// services/transcricao.ts — Transcrição de áudio via Claude (Anthropic)
import * as FileSystem from 'expo-file-system';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Lê o arquivo de áudio como base64 e envia ao Claude para transcrição.
 * @param audioUri  URI local do arquivo gravado (ex: file:///…/recording.m4a)
 * @returns Texto transcrito em português
 */
export async function transcreverAudio(audioUri: string): Promise<string> {
  if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_ANTHROPIC_API_KEY não configurada. Defina no .env para usar voz → texto.'
    );
  }

  // Ler arquivo de áudio como base64
  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Determinar media type (expo-av grava m4a/AAC)
  const mediaType = audioUri.endsWith('.wav') ? 'audio/wav' : 'audio/mp4';

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Transcreva o áudio a seguir para texto em português brasileiro. Retorne APENAS o texto transcrito, sem explicações, aspas ou formatação adicional. Se não houver fala ou o áudio estiver vazio, retorne exatamente: [silêncio]',
          },
          {
            type: 'input_audio',
            source: {
              type:       'base64',
              media_type: mediaType,
              data:       base64Audio,
            },
          } as any,
        ],
      },
    ],
  });

  const texto =
    response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  // Se o Claude indicou silêncio, retornar vazio
  if (texto === '[silêncio]' || texto === '[silencio]') {
    return '';
  }

  return texto;
}
