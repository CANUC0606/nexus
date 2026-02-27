// app/(tabs)/index.tsx — Tela de Chat Principal
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { ChatBubble } from '../../components/ChatBubble/ChatBubble';
import { Orb, OrbEstado } from '../../components/Orb/Orb';
import { useTaskStore, Mensagem, Tarefa } from '../../store/taskStore';
import { useUserStore } from '../../store/userStore';
import { enviarMensagem } from '../../services/claude';
import { useVoice } from '../../hooks/useVoice';
import { useEnergy } from '../../hooks/useEnergy';

export default function ChatScreen() {
  const insets     = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const listRef    = useRef<FlatList>(null);

  const historico      = useTaskStore((s) => s.historico);
  const addMensagem    = useTaskStore((s) => s.addMensagem);
  const addTarefa      = useTaskStore((s) => s.addTarefa);
  const carregando     = useTaskStore((s) => s.carregando);
  const setCarregando  = useTaskStore((s) => s.setCarregando);
  const perfil         = useUserStore((s) => s.perfil);
  const energia        = useEnergy();

  const [orbEstado, setOrbEstado] = useState<OrbEstado>('idle');
  const { estado: vozEstado, iniciarGravacao, pararGravacao, falar } = useVoice();

  const enviar = useCallback(async (texto: string) => {
    if (!texto.trim() || carregando) return;

    const msg = texto.trim();
    setInput('');

    // Adicionar mensagem do usuário
    addMensagem({ role: 'user', content: msg, task_card: null });
    setCarregando(true);
    setOrbEstado('pensando');

    try {
      const resposta = await enviarMensagem(msg, perfil, historico);

      // Criar tarefa no store se a IA retornou um task_card
      let tarefa: Tarefa | null = null;
      if (resposta.tarefa) {
        tarefa = addTarefa({
          titulo:  resposta.tarefa.titulo!,
          etapas:  resposta.tarefa.etapas!,
          status:  'pendente',
          energia: 'media',
          horario_sugerido: undefined,
        });
      }

      addMensagem({
        role:      'assistant',
        content:   resposta.texto,
        task_card: tarefa,
      });

      // Falar a resposta
      setOrbEstado('falando');
      falar(resposta.texto);
      setTimeout(() => setOrbEstado('idle'), 3000);

    } catch (err) {
      addMensagem({
        role:      'assistant',
        content:   'Desculpe, tive um problema de conexão. Pode repetir?',
        task_card: null,
      });
      setOrbEstado('idle');
    } finally {
      setCarregando(false);
    }
  }, [carregando, historico, perfil]);

  const toggleVoz = () => {
    if (vozEstado === 'gravando') {
      pararGravacao();
    } else {
      iniciarGravacao();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top bar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topbarLeft}>
          <Orb estado={orbEstado} tamanho={36} onPress={() => {}} />
          <View>
            <Text style={styles.topbarName}>NEXUS</Text>
            <Text style={styles.topbarState}>
              {orbEstado === 'pensando' ? '● PROCESSANDO'
               : orbEstado === 'falando' ? '● FALANDO'
               : '● ESCUTANDO'}
            </Text>
          </View>
        </View>
        <View style={styles.energyPill}>
          <Text style={styles.energyEmoji}>{energia.emoji}</Text>
          <Text style={styles.energyLabel}>{energia.label.toUpperCase()}</Text>
        </View>
      </View>

      {/* Mensagens */}
      {historico.length === 0 ? (
        <Vazio />
      ) : (
        <FlatList
          ref={listRef}
          data={historico}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble mensagem={item} />}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Indicador de carregamento */}
      {carregando && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.violet} />
          <Text style={styles.loadingText}>NEXUS está pensando...</Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Fale ou escreva qualquer coisa..."
            placeholderTextColor={Colors.text3}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => enviar(input)}
            blurOnSubmit
          />
        </View>
        <Pressable
          style={[styles.voiceBtn, vozEstado === 'gravando' && styles.voiceBtnAtivo]}
          onPress={input.trim() ? () => enviar(input) : toggleVoz}
        >
          <Text style={styles.voiceBtnIcon}>
            {input.trim() ? '→' : vozEstado === 'gravando' ? '⏹' : '🎙️'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Vazio() {
  return (
    <View style={styles.vazio}>
      <Orb estado="escutando" tamanho={80} />
      <Text style={styles.vazioTitulo}>Olá, estou aqui.</Text>
      <Text style={styles.vazioSub}>
        Me fale sobre uma tarefa que precisa fazer{'\n'}ou o que está na sua cabeça agora.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.deep,
  },
  topbar: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 20,
    paddingBottom:   12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.deep,
    gap:             12,
  },
  topbarLeft: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  topbarName: {
    fontSize:      15,
    fontWeight:    '700',
    color:         Colors.white,
    letterSpacing: 0.5,
  },
  topbarState: {
    fontFamily: 'monospace',
    fontSize:   10,
    color:      Colors.cyan,
    marginTop:  2,
  },
  energyPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    999,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  energyEmoji: { fontSize: 12 },
  energyLabel: {
    fontFamily: 'monospace',
    fontSize:   9,
    color:      Colors.text2,
    letterSpacing: 0.5,
  },
  lista: {
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     8,
  },
  loadingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 20,
    paddingVertical:   8,
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize:   11,
    color:      Colors.text3,
  },
  inputArea: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    gap:             10,
    paddingHorizontal: 16,
    paddingTop:      12,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.deep,
  },
  inputWrap: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border2,
    borderRadius:    14,
    paddingHorizontal: 14,
    paddingVertical:   10,
    minHeight:       46,
    justifyContent:  'center',
  },
  input: {
    fontSize:  13,
    color:     Colors.text,
    maxHeight: 100,
  },
  voiceBtn: {
    width:           46,
    height:          46,
    borderRadius:    14,
    backgroundColor: Colors.violet,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     Colors.violet,
    shadowOpacity:   0.5,
    shadowRadius:    12,
    elevation:       6,
  },
  voiceBtnAtivo: {
    backgroundColor: Colors.cyan,
    shadowColor:     Colors.cyan,
  },
  voiceBtnIcon: { fontSize: 18 },
  vazio: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            16,
    paddingHorizontal: 32,
  },
  vazioTitulo: {
    fontSize:      22,
    fontWeight:    '800',
    color:         Colors.white,
    letterSpacing: -0.5,
  },
  vazioSub: {
    fontSize:   13,
    color:      Colors.text3,
    textAlign:  'center',
    lineHeight: 20,
  },
});
