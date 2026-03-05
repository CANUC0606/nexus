import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type OCRSource = 'camera' | 'gallery';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function inferMediaType(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function selecionarImagem(source: OCRSource = 'gallery'): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
    selectionLimit: 1,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export async function extrairTextoImagem(imageUri: string): Promise<string> {
  if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY não configurada para OCR.');
  }

  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Extraia o texto visível da imagem (OCR).',
              'Retorne APENAS o texto em português brasileiro.',
              'Mantenha quebras de linha úteis e não invente conteúdo.',
              'Se não houver texto legível, retorne exatamente: [sem_texto]'
            ].join(' '),
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: inferMediaType(imageUri),
              data: base64Image,
            },
          },
        ],
      } as any,
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
  if (text === '[sem_texto]') return '';
  return text;
}

export async function capturarTextoComOCR(source: OCRSource = 'gallery') {
  const imageUri = await selecionarImagem(source);
  if (!imageUri) return { canceled: true as const, imageUri: null, texto: '' };

  const texto = await extrairTextoImagem(imageUri);
  return { canceled: false as const, imageUri, texto };
}
