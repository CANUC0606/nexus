// hooks/useVoice.ts — Input de voz e síntese de fala
import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

// NOTA: Para STT (voz → texto) em produção, use:
// - expo-speech com @react-native-voice/voice  OU
// - Whisper API da OpenAI via fetch
// Por ora, este hook gerencia o TTS (texto → voz) com expo-speech
// e o estado de gravação para integrar com a UI

export type EstadoVoz = 'idle' | 'gravando' | 'processando' | 'falando';

interface UseVoiceReturn {
  estado:       EstadoVoz;
  iniciarGravacao: () => void;
  pararGravacao:   () => void;
  falar:           (texto: string) => void;
  pararFala:       () => void;
  estaFalando:     boolean;
}

export function useVoice(
  onTranscricao?: (texto: string) => void
): UseVoiceReturn {
  const [estado, setEstado] = useState<EstadoVoz>('idle');

  const falar = useCallback((texto: string) => {
    // Remove markdown e JSON antes de falar
    const limpo = texto
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`]/g, '')
      .trim();

    if (!limpo) return;

    setEstado('falando');
    Speech.speak(limpo, {
      language:  'pt-BR',
      pitch:     1.0,
      rate:      0.95,
      onDone:    () => setEstado('idle'),
      onStopped: () => setEstado('idle'),
      onError:   () => setEstado('idle'),
    });
  }, []);

  const pararFala = useCallback(() => {
    Speech.stop();
    setEstado('idle');
  }, []);

  // STT simulado — integre @react-native-voice/voice aqui
  const iniciarGravacao = useCallback(() => {
    setEstado('gravando');
    // TODO: iniciar gravação real com @react-native-voice/voice
  }, []);

  const pararGravacao = useCallback(() => {
    setEstado('processando');
    // TODO: parar gravação e processar transcrição
    // Por ora, simula volta ao idle após 1s
    setTimeout(() => setEstado('idle'), 1000);
  }, []);

  return {
    estado,
    iniciarGravacao,
    pararGravacao,
    falar,
    pararFala,
    estaFalando: estado === 'falando',
  };
}
