// app/(tabs)/today.tsx — Tela Hoje: visão do dia
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TaskCard } from '../../components/TaskCard/TaskCard';
import { useTaskStore } from '../../store/taskStore';
import { useUserStore } from '../../store/userStore';
import { useEnergy } from '../../hooks/useEnergy';

export default function TodayScreen() {
  const insets        = useSafeAreaInsets();
  const tarefasAtivas = useTaskStore((s) => s.tarefasAtivas)();
  const concluirEtapa = useTaskStore((s) => s.concluirEtapa);
  const adiar         = useTaskStore((s) => s.adiarTarefa);
  const perfil        = useUserStore((s) => s.perfil);
  const energia       = useEnergy();

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.data}>{hoje}</Text>
      <Text style={styles.titulo}>Seu dia de hoje</Text>

      {/* Barra de energia */}
      <View style={styles.energiaRow}>
        <Text style={styles.energiaLabel}>{energia.emoji} Energia</Text>
        <View style={styles.energiaTrack}>
          <View
            style={[
              styles.energiaFill,
              { width: `${energia.percentual}%`,
                backgroundColor: energia.nivel === 'pico' ? Colors.neon
                                : energia.nivel === 'baixa' ? Colors.rose
                                : Colors.cyan }
            ]}
          />
        </View>
        <Text style={styles.energiaValor}>{energia.label}</Text>
      </View>

      {energia.nivel === 'pico' && (
        <View style={styles.picoBanner}>
          <Text style={styles.picoBannerText}>
            ⚡ Você está no seu pico de energia — hora de agir!
          </Text>
        </View>
      )}

      {/* Tarefas */}
      {tarefasAtivas.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioEmoji}>🎉</Text>
          <Text style={styles.vazioTitulo}>Tudo limpo!</Text>
          <Text style={styles.vazioSub}>Converse com o NEXUS para criar novas micro-tarefas.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>// TAREFAS ATIVAS</Text>
          {tarefasAtivas.map((t) => (
            <View key={t.id} style={styles.taskWrap}>
              <TaskCard tarefa={t} onConcluirEtapa={concluirEtapa} />
              <Pressable
                style={styles.adiarBtn}
                onPress={() => adiar(t.id)}
              >
                <Text style={styles.adiarTexto}>Adiar para depois</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {/* Resumo de streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakNum}>{perfil.streak_atual} dias</Text>
          <Text style={styles.streakLabel}>de sequência ativa</Text>
        </View>
        <View style={styles.streakSep} />
        <View>
          <Text style={styles.streakNum}>{perfil.total_microtarefas}</Text>
          <Text style={styles.streakLabel}>micro-tarefas feitas</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deep },
  content:   { paddingHorizontal: 20, gap: 12 },
  data: {
    fontFamily: 'monospace',
    fontSize:   11,
    color:      Colors.text3,
    textTransform: 'capitalize',
  },
  titulo: {
    fontSize:      22,
    fontWeight:    '800',
    color:         Colors.white,
    letterSpacing: -0.5,
    marginBottom:  4,
  },
  energiaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  energiaLabel: { fontSize: 12, color: Colors.text2, minWidth: 90 },
  energiaTrack: {
    flex:            1,
    height:          4,
    backgroundColor: Colors.border,
    borderRadius:    2,
    overflow:        'hidden',
  },
  energiaFill: {
    height:       '100%',
    borderRadius: 2,
  },
  energiaValor: {
    fontSize:   11,
    color:      Colors.text2,
    minWidth:   60,
    textAlign:  'right',
  },
  picoBanner: {
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(57,255,20,0.25)',
    borderRadius:    10,
    padding:         12,
  },
  picoBannerText: { fontSize: 12, color: Colors.neon, fontWeight: '600' },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize:   9,
    color:      Colors.text3,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop:  8,
  },
  taskWrap: { gap: 6 },
  adiarBtn: {
    alignSelf:  'flex-end',
    paddingVertical:   4,
    paddingHorizontal: 12,
  },
  adiarTexto: {
    fontSize:  11,
    color:     Colors.text3,
    textDecorationLine: 'underline',
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  vazioEmoji:  { fontSize: 40 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', color: Colors.white },
  vazioSub:    { fontSize: 13, color: Colors.text3, textAlign: 'center' },
  streakCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     'rgba(251,191,36,0.2)',
    borderRadius:    14,
    padding:         16,
    gap:             14,
    marginTop:       8,
  },
  streakEmoji: { fontSize: 28 },
  streakNum: {
    fontSize:   20,
    fontWeight: '800',
    color:      Colors.amber,
  },
  streakLabel: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  streakSep: {
    width:           1,
    height:          36,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
});
