// components/TaskCard/TaskCard.tsx — Card de micro-tarefas
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { Tarefa, MicroEtapa } from '../../store/taskStore';

interface TaskCardProps {
  tarefa:        Tarefa;
  onConcluirEtapa: (tarefaId: string, etapaId: string) => void;
}

export function TaskCard({ tarefa, onConcluirEtapa }: TaskCardProps) {
  const concluidas = tarefa.etapas.filter((e) => e.concluida).length;
  const total      = tarefa.etapas.length;

  return (
    <View style={styles.card}>
      {/* Linha superior decorativa */}
      <View style={styles.topLine} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo} numberOfLines={1}>
          ◈ {tarefa.titulo.toUpperCase()}
        </Text>
        <Text style={styles.progresso}>
          {concluidas}/{total}
        </Text>
      </View>

      {/* Etapas */}
      {tarefa.etapas.map((etapa, idx) => (
        <EtapaItem
          key={etapa.id}
          etapa={etapa}
          ativa={!etapa.concluida && (idx === 0 || tarefa.etapas[idx - 1].concluida)}
          onConcluir={() => onConcluirEtapa(tarefa.id, etapa.id)}
        />
      ))}
    </View>
  );
}

interface EtapaItemProps {
  etapa:     MicroEtapa;
  ativa:     boolean;
  onConcluir: () => void;
}

function EtapaItem({ etapa, ativa, onConcluir }: EtapaItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.etapa,
        ativa && styles.etapaAtiva,
        pressed && styles.etapaPressionada,
      ]}
      onPress={ativa ? onConcluir : undefined}
      disabled={etapa.concluida}
    >
      {/* Círculo de status */}
      <View style={[
        styles.circulo,
        etapa.concluida && styles.circuloConcluido,
        ativa && !etapa.concluida && styles.circuloAtivo,
      ]}>
        {etapa.concluida && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Texto */}
      <Text style={[
        styles.etapaTexto,
        etapa.concluida && styles.etapaTextoConcluido,
      ]}>
        {etapa.texto}
      </Text>

      {/* Tempo */}
      <Text style={styles.etapaTempo}>{etapa.minutos}min</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
    marginVertical:  4,
  },
  topLine: {
    height:          1,
    backgroundColor: Colors.cyan,
    opacity:         0.5,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 16,
    paddingVertical:  10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titulo: {
    flex:       1,
    fontFamily: 'monospace',
    fontSize:   10,
    color:      Colors.cyan,
    letterSpacing: 1,
  },
  progresso: {
    fontFamily: 'monospace',
    fontSize:   10,
    color:      Colors.text3,
  },
  etapa: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingHorizontal: 16,
    paddingVertical:  10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  etapaAtiva: {
    backgroundColor: 'rgba(139,92,246,0.05)',
  },
  etapaPressionada: {
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  circulo: {
    width:        22,
    height:       22,
    borderRadius: 11,
    borderWidth:  1.5,
    borderColor:  Colors.border2,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  circuloAtivo: {
    borderColor: Colors.violet,
    shadowColor: Colors.violet,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation:   4,
  },
  circuloConcluido: {
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderColor:     Colors.neon,
  },
  checkmark: {
    fontSize: 11,
    color:    Colors.neon,
    fontWeight: '700',
  },
  etapaTexto: {
    flex:     1,
    fontSize: 13,
    color:    Colors.text,
    lineHeight: 18,
  },
  etapaTextoConcluido: {
    textDecorationLine: 'line-through',
    color:              Colors.text3,
  },
  etapaTempo: {
    fontFamily: 'monospace',
    fontSize:   10,
    color:      Colors.text3,
  },
});
