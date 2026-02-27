// components/ChatBubble/ChatBubble.tsx — Balão de mensagem
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Mensagem } from '../../store/taskStore';
import { TaskCard } from '../TaskCard/TaskCard';
import { useTaskStore } from '../../store/taskStore';

interface ChatBubbleProps {
  mensagem: Mensagem;
}

export function ChatBubble({ mensagem }: ChatBubbleProps) {
  const concluirEtapa = useTaskStore((s) => s.concluirEtapa);
  const isUser        = mensagem.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>⬡</Text>
        </View>
      )}

      <View style={[styles.container, isUser && styles.containerUser]}>
        {/* Balão de texto */}
        {mensagem.content ? (
          <View style={[styles.bubble, isUser && styles.bubbleUser]}>
            <Text style={styles.texto}>{mensagem.content}</Text>
          </View>
        ) : null}

        {/* Task Card embutido */}
        {mensagem.task_card && (
          <TaskCard
            tarefa={mensagem.task_card}
            onConcluirEtapa={concluirEtapa}
          />
        )}

        {/* Timestamp */}
        <Text style={[styles.tempo, isUser && styles.tempoUser]}>
          {mensagem.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Avatar usuário */}
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Text style={styles.avatarText}>🧑</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  12,
    alignItems:    'flex-start',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: Colors.violetDim,
    borderWidth:     1,
    borderColor:     Colors.violet,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       2,
    flexShrink:      0,
  },
  avatarUser: {
    backgroundColor: 'rgba(100,116,139,0.2)',
    borderColor:     'rgba(100,116,139,0.4)',
  },
  avatarText: {
    fontSize: 14,
  },
  container: {
    maxWidth: '75%',
    gap:       4,
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: Colors.surface2,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  bubbleUser: {
    backgroundColor:      Colors.violetDim,
    borderColor:          'rgba(139,92,246,0.3)',
    borderRadius:         14,
    borderTopRightRadius: 4,
    borderTopLeftRadius:  14,
  },
  texto: {
    fontSize:   13.5,
    color:      Colors.text,
    lineHeight: 20,
  },
  tempo: {
    fontSize:   10,
    color:      Colors.text3,
    fontFamily: 'monospace',
    marginLeft: 4,
  },
  tempoUser: {
    marginLeft:  0,
    marginRight: 4,
  },
});
