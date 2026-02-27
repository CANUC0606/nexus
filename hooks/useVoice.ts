// hooks/useVoice.ts — Input de voz (STT via Whisper) e síntese de fala (TTS via expo-speech)
import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { transcreverAudio } from '../services/transcricao';

export type EstadoVoz = 'idle' | 'gravando' | 'processando' | 'falando';

interface UseVoiceReturn {
  estado:          EstadoVoz;
  iniciarGravacao: () => Promise<void>;
  pararGravacao:   () => Promise<void>;
  falar:           (texto: string) => void;
  pararFala:       () => void;
  estaFalando:     boolean;
  erro:            string | null;
}

// Configuração de gravação otimizada para Whisper (m4a / AAC)
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension:        '.m4a',
    outputFormat:     Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder:     Audio.AndroidAudioEncoder.AAC,
    sampleRate:       16000,
    numberOfChannels: 1,
    bitRate:          64000,
  },
  ios: {
    extension:        '.m4a',
    outputFormat:     Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality:     Audio.IOSAudioQuality.MEDIUM,
    sampleRate:       16000,
    numberOfChannels: 1,
    bitRate:          64000,
  },
  web: {
    mimeType:  'audio/webm',
    bitsPerSecond: 64000,
  },
};

export function useVoice(
  onTranscricao?: (texto: string) => void
): UseVoiceReturn {
  const [estado, setEstado] = useState<EstadoVoz>('idle');
  const [erro, setErro]     = useState<string | null>(null);
  const recordingRef        = useRef<Audio.Recording | null>(null);

  // ── TTS (texto → voz) ────────────────────────────────────────────────────

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

  // ── STT (voz → texto) via expo-av + Whisper ──────────────────────────────

  const iniciarGravacao = useCallback(async () => {
    try {
      setErro(null);

      // Solicitar permissão de microfone
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setErro('Permissão de microfone negada.');
        return;
      }

      // Configurar modo de áudio para gravação
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Criar e iniciar gravação
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();

      recordingRef.current = recording;
      setEstado('gravando');
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setErro('Não foi possível iniciar a gravação.');
      setEstado('idle');
    }
  }, []);

  const pararGravacao = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      setEstado('idle');
      return;
    }

    setEstado('processando');

    try {
      // Parar gravação e obter URI do arquivo
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) {
        throw new Error('URI do áudio não encontrada.');
      }

      // Enviar para Whisper API e obter transcrição
      const texto = await transcreverAudio(uri);

      if (texto && onTranscricao) {
        onTranscricao(texto);
      } else if (!texto) {
        setErro('Não consegui entender. Tente novamente.');
      }

      setEstado('idle');
    } catch (err: any) {
      console.error('Erro na transcrição:', err);
      setErro(
        err?.message?.includes('OPENAI_API_KEY')
          ? 'Chave da OpenAI não configurada.'
          : 'Erro ao transcrever áudio. Tente novamente.'
      );
      recordingRef.current = null;
      setEstado('idle');
    }
  }, [onTranscricao]);

  return {
    estado,
    iniciarGravacao,
    pararGravacao,
    falar,
    pararFala,
    estaFalando: estado === 'falando',
    erro,
  };
}
