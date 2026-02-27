// app/(tabs)/wins.tsx — Tela de Conquistas e Streak
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { useTaskStore } from '../../store/taskStore';

export default function WinsScreen() {
  const insets   = useSafeAreaInsets();
  const perfil   = useUserStore((s) => s.perfil);
  const historico = useTaskStore((s) => s.historico);

  // Tarefas concluídas do histórico da conversa com task_cards
  const tarefasConcluidas = useTaskStore((s) =>
    s.tarefas.filter((t) => t.status === 'concluida')
  );

  const taxaFormatada = Math.round(perfil.taxa_conclusao * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Suas Conquistas</Text>
      <Text style={styles.sub}>Cada micro-passo aqui foi real.</Text>

      {/* Streak hero */}
      <View style={styles.streakHero}>
        <View style={styles.streakGlow} />
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNum}>{perfil.streak_atual}</Text>
        <Text style={styles.streakLabel}>dias de sequência</Text>
        {perfil.streak_atual === perfil.streak_maximo && perfil.streak_maximo > 0 && (
          <View style={styles.recordBadge}>
            <Text style={styles.recordText}>⭐ RECORDE PESSOAL</Text>
          </View>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Micro-tarefas feitas"
          value={String(perfil.total_microtarefas)}
          emoji="✅"
          color={Colors.neon}
        />
        <StatCard
          label="Recorde de streak"
          value={`${perfil.streak_maximo} dias`}
          emoji="🏆"
          color={Colors.amber}
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${taxaFormatada}%`}
          emoji="📈"
          color={Colors.cyan}
        />
        <StatCard
          label="Resposta média"
          value={`${perfil.tempo_resposta_medio_min}min`}
          emoji="⚡"
          color={Colors.violet}
        />
      </View>

      {/* Última conquista */}
      {perfil.ultima_conquista && (
        <View style={styles.ultimaCard}>
          <Text style={styles.ultimaLabel}>// ÚLTIMA CONQUISTA</Text>
          <Text style={styles.ultimaTexto}>{perfil.ultima_conquista}</Text>
        </View>
      )}

      {/* Tarefas concluídas */}
      {tarefasConcluidas.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>// HISTÓRICO</Text>
          {tarefasConcluidas.map((t) => (
            <View key={t.id} style={styles.histItem}>
              <Text style={styles.histCheck}>✓</Text>
              <View style={styles.histInfo}>
                <Text style={styles.histTitulo}>{t.titulo}</Text>
                <Text style={styles.histMeta}>
                  {t.etapas.length} etapas ·{' '}
                  {t.concluido_em?.toLocaleDateString('pt-BR') ?? ''}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {tarefasConcluidas.length === 0 && (
        <View style={styles.vazio}>
          <Text style={styles.vazioEmoji}>🌱</Text>
          <Text style={styles.vazioTexto}>
            Suas conquistas aparecerão aqui.{'\n'}Conclua a primeira micro-tarefa!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  label, value, emoji, color,
}: { label: string; value: string; emoji: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.deep },
  content:   { paddingHorizontal: 20, gap: 16 },
  titulo: {
    fontSize:      24,
    fontWeight:    '800',
    color:         Colors.white,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 13, color: Colors.text3, marginTop: -8 },
  streakHero: {
    backgroundColor: Colors.surface,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(251,191,36,0.3)',
    padding:         28,
    alignItems:      'center',
    gap:             6,
    overflow:        'hidden',
    position:        'relative',
  },
  streakGlow: {
    position:        'absolute',
    top:             -60,
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: 'rgba(251,191,36,0.08)',
  },
  streakEmoji: { fontSize: 40 },
  streakNum: {
    fontSize:      56,
    fontWeight:    '900',
    color:         Colors.amber,
    lineHeight:    60,
    letterSpacing: -2,
  },
  streakLabel: { fontSize: 14, color: Colors.text2 },
  recordBadge: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth:     1,
    borderColor:     'rgba(251,191,36,0.3)',
    borderRadius:    999,
    paddingHorizontal: 12,
    paddingVertical:    4,
    marginTop:         4,
  },
  recordText: {
    fontFamily: 'monospace',
    fontSize:   9,
    color:      Colors.amber,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  statCard: {
    flex:            1,
    minWidth:        '45%',
    backgroundColor: Colors.surface,
    borderRadius:    14,
    borderWidth:     1,
    padding:         14,
    gap:             4,
    alignItems:      'center',
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: Colors.text3, textAlign: 'center' },
  ultimaCard: {
    backgroundColor: Colors.surface,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         16,
    gap:             6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.neon,
  },
  ultimaLabel: {
    fontFamily: 'monospace',
    fontSize:   9,
    color:      Colors.neon,
    letterSpacing: 1.5,
  },
  ultimaTexto: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize:   9,
    color:      Colors.text3,
    letterSpacing: 1.5,
  },
  histItem: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: Colors.surface,
    borderRadius:    12,
    padding:         14,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  histCheck: { fontSize: 16, color: Colors.neon },
  histInfo:  { flex: 1 },
  histTitulo: { fontSize: 13, fontWeight: '600', color: Colors.text },
  histMeta:   { fontSize: 11, color: Colors.text3, marginTop: 2 },
  vazio: {
    alignItems:     'center',
    paddingVertical: 40,
    gap:             12,
  },
  vazioEmoji: { fontSize: 36 },
  vazioTexto: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
});
