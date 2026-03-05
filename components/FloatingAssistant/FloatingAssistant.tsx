import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useTaskStore, Tarefa } from '../../store/taskStore';
import { useUserStore } from '../../store/userStore';
import { enviarMensagem } from '../../services/claude';
import { useVoice } from '../../hooks/useVoice';

const BUBBLE_SIZE = 62;
const EDGE_PADDING = 14;
const CHAT_WIDTH = 300;
const CHAT_HEIGHT = 280;
const POSITION_KEY = 'nexus.floatingAssistant.position.v1';

export function FloatingAssistant() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState('Segure para conversar');

  const position = useRef(
    new Animated.ValueXY({
      x: Math.max(EDGE_PADDING, width - BUBBLE_SIZE - EDGE_PADDING),
      y: Math.max(100, height - BUBBLE_SIZE - 140),
    })
  ).current;

  const currentPos = useRef({
    x: Math.max(EDGE_PADDING, width - BUBBLE_SIZE - EDGE_PADDING),
    y: Math.max(100, height - BUBBLE_SIZE - 140),
  });
  const startOffset = useRef({ x: 0, y: 0 });
  const collapsedRef = useRef(false);

  const historico = useTaskStore((s) => s.historico);
  const addMensagem = useTaskStore((s) => s.addMensagem);
  const addTarefa = useTaskStore((s) => s.addTarefa);
  const perfil = useUserStore((s) => s.perfil);

  const previewMsgs = useMemo(() => historico.slice(-4), [historico]);
  const { estado: vozEstado, iniciarGravacao, pararGravacao, erro: vozErro } = useVoice((texto) => {
    const transcrito = texto.trim();
    if (!transcrito) return;
    setInput(transcrito);
    setHint('Texto transcrito');
  });

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  useEffect(() => {
    let mounted = true;

    async function restorePosition() {
      try {
        const raw = await AsyncStorage.getItem(POSITION_KEY);
        if (!raw || !mounted) return;

        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return;

        const maxX = Math.max(EDGE_PADDING, width - BUBBLE_SIZE - EDGE_PADDING);
        const maxY = Math.max(100, height - BUBBLE_SIZE - 90);
        const next = {
          x: clamp(parsed.x, EDGE_PADDING, maxX),
          y: clamp(parsed.y, 70, maxY),
        };

        currentPos.current = next;
        position.setValue(next);
      } catch {
        // Ignore invalid persisted values.
      }
    }

    restorePosition();

    return () => {
      mounted = false;
    };
  }, [width, height, position]);

  async function persistPosition(pos: { x: number; y: number }) {
    try {
      await AsyncStorage.setItem(POSITION_KEY, JSON.stringify(pos));
    } catch {
      // Non-fatal: keep runtime position even if persistence fails.
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          startOffset.current = { x: currentPos.current.x, y: currentPos.current.y };
        },
        onPanResponderMove: (_, g) => {
          const maxX = Math.max(EDGE_PADDING, width - BUBBLE_SIZE - EDGE_PADDING);
          const maxY = Math.max(100, height - BUBBLE_SIZE - 90);

          const next = {
            x: clamp(startOffset.current.x + g.dx, EDGE_PADDING, maxX),
            y: clamp(startOffset.current.y + g.dy, 70, maxY),
          };

          currentPos.current = next;
          position.setValue(next);
        },
        onPanResponderRelease: () => {
          const current = currentPos.current;
          const maxX = Math.max(EDGE_PADDING, width - BUBBLE_SIZE - EDGE_PADDING);
          const snapX = current.x > width / 2 ? maxX : EDGE_PADDING;

          currentPos.current = { x: snapX, y: current.y };
          Animated.spring(position, {
            toValue: { x: snapX, y: current.y },
            useNativeDriver: false,
            bounciness: 7,
          }).start(({ finished }) => {
            if (finished) {
              persistPosition({ x: snapX, y: current.y });
            }
          });
        },
      }),
    [position, width, height]
  );

  async function enviarNoOverlay() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    addMensagem({ role: 'user', content: text, task_card: null });

    try {
      const resposta = await enviarMensagem(text, perfil, historico);

      let tarefa: Tarefa | null = null;
      if (resposta.tarefa?.titulo && resposta.tarefa?.etapas) {
        tarefa = addTarefa({
          titulo: resposta.tarefa.titulo,
          etapas: resposta.tarefa.etapas,
          status: 'pendente',
          energia: 'media',
          horario_sugerido: undefined,
        });
      }

      addMensagem({
        role: 'assistant',
        content: resposta.texto || 'Pronto. Te ajudo com a proxima micro-acao?',
        task_card: tarefa,
      });
      setHint('Mensagem enviada');
    } catch {
      addMensagem({
        role: 'assistant',
        content: 'Falhei aqui. Tenta de novo em alguns segundos.',
        task_card: null,
      });
      setHint('Falha de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {expanded && (
        <View pointerEvents="box-none" style={styles.chatWrap}>
          <View style={styles.chatBox}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>NEXUS FLUTUANTE</Text>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => {
                    setExpanded(false);
                    router.push('/' as never);
                  }}
                >
                  <Text style={styles.openText}>Abrir chat</Text>
                </Pressable>
                <Pressable onPress={() => setExpanded(false)}>
                  <Text style={styles.closeText}>Fechar</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.chatBody}>
              {previewMsgs.length === 0 ? (
                <Text style={styles.emptyText}>Segura a bolha para abrir e manda o que voce precisa agora.</Text>
              ) : (
                previewMsgs.map((m) => (
                  <View key={m.id} style={[styles.msg, m.role === 'user' ? styles.msgUser : styles.msgAI]}>
                    <Text style={styles.msgText} numberOfLines={3}>
                      {m.content}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.inputRow}>
              <Pressable
                style={[styles.micBtn, vozEstado === 'gravando' && styles.micBtnActive]}
                onPress={() => {
                  if (vozEstado === 'gravando') {
                    pararGravacao();
                  } else if (!loading) {
                    iniciarGravacao();
                    setHint('Gravando... toque novamente para enviar');
                  }
                }}
                disabled={loading || vozEstado === 'processando'}
              >
                <Text style={styles.micText}>{vozEstado === 'gravando' ? 'Stop' : 'Mic'}</Text>
              </Pressable>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Nexus, me ajuda com..."
                placeholderTextColor={Colors.text3}
                onSubmitEditing={enviarNoOverlay}
              />
              <Pressable style={styles.sendBtn} onPress={enviarNoOverlay} disabled={loading}>
                <Text style={styles.sendText}>{loading ? '...' : 'Enviar'}</Text>
              </Pressable>
            </View>
            {!!vozErro && <Text style={styles.voiceError}>{vozErro}</Text>}
          </View>
        </View>
      )}

      <Animated.View
        style={[styles.bubbleWrap, { transform: [{ translateX: position.x }, { translateY: position.y }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          delayLongPress={500}
          onLongPress={() => {
            collapsedRef.current = false;
            setExpanded((v) => !v);
            setHint('');
          }}
          onPress={() => {
            setHint('Segure 0.5s para abrir');
            collapsedRef.current = true;
            setTimeout(() => {
              if (collapsedRef.current) setHint('Segure para conversar');
            }, 1400);
          }}
          style={styles.bubble}
        >
          <Text style={styles.bubbleIcon}>N</Text>
        </Pressable>
        <Text style={styles.hint}>{hint}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: {
    position: 'absolute',
    width: BUBBLE_SIZE + 6,
    alignItems: 'center',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: Colors.violet,
    borderWidth: 2,
    borderColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.violet,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  bubbleIcon: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    marginTop: 6,
    fontSize: 10,
    color: Colors.text3,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  chatWrap: {
    position: 'absolute',
    right: EDGE_PADDING,
    bottom: 96,
  },
  chatBox: {
    width: CHAT_WIDTH,
    minHeight: CHAT_HEIGHT,
    maxHeight: CHAT_HEIGHT,
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: 12,
    gap: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatTitle: {
    color: Colors.cyan,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
  },
  openText: {
    color: Colors.cyan,
    fontSize: 12,
  },
  closeText: {
    color: Colors.text3,
    fontSize: 12,
  },
  chatBody: {
    flex: 1,
    gap: 8,
  },
  emptyText: {
    color: Colors.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  msg: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  msgUser: {
    backgroundColor: Colors.violetDim,
    alignSelf: 'flex-end',
  },
  msgAI: {
    backgroundColor: Colors.surface,
    alignSelf: 'stretch',
  },
  msgText: {
    color: Colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  micBtnActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  micText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendText: {
    color: Colors.deep,
    fontSize: 12,
    fontWeight: '700',
  },
  voiceError: {
    color: Colors.amber,
    fontSize: 11,
  },
});