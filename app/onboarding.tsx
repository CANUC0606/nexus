// app/onboarding.tsx — Tela de primeiro acesso
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { ONBOARDING_PROMPTS } from '../constants/prompts';
import { Orb } from '../components/Orb/Orb';
import { useUserStore } from '../store/userStore';
import { useVoice } from '../hooks/useVoice';

const { width: W } = Dimensions.get('window');

export default function Onboarding() {
  const [etapa, setEtapa]       = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const setPerfil = useUserStore((s) => s.setPerfil);
  const completar = useUserStore((s) => s.completarOnboarding);
  const { falar }  = useVoice();

  const promptAtual = ONBOARDING_PROMPTS[etapa];

  // Falar a pergunta ao mudar de etapa
  React.useEffect(() => {
    falar(promptAtual.pergunta);
  }, [etapa]);

  function selecionarOpcao(valor: string) {
    setRespostas((r) => ({ ...r, [promptAtual.id]: valor }));

    // Animação de transição
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => {
      if (etapa < ONBOARDING_PROMPTS.length - 1) {
        setEtapa((e) => e + 1);
      } else {
        finalizarOnboarding({ ...respostas, [promptAtual.id]: valor });
      }
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }).start();
    });
  }

  function finalizarOnboarding(r: Record<string, string>) {
    // Salvar respostas no perfil vivo
    setPerfil({
      pico_energia:  r.energia as any,
      tom_preferido: r.tom as any,
      bloqueia_em:   r.bloqueio,
      notificacoes:  r.notificacoes as any,
    });
    completar();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      {/* Fundo com gradiente sutil */}
      <View style={styles.bgGlow} />

      {/* Header com orb */}
      <View style={styles.header}>
        <Orb estado="escutando" tamanho={72} />
        <View style={styles.progressDots}>
          {ONBOARDING_PROMPTS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === etapa && styles.dotAtivo, i < etapa && styles.dotConcluido]}
            />
          ))}
        </View>
      </View>

      {/* Pergunta */}
      <Animated.View style={[styles.perguntaWrap, { opacity: fadeAnim }]}>
        <View style={styles.bubble}>
          <Text style={styles.pergunta}>{promptAtual.pergunta}</Text>
        </View>

        {/* Opções */}
        <View style={styles.opcoes}>
          {promptAtual.opcoes.map((op) => (
            <Pressable
              key={op.valor}
              style={({ pressed }) => [
                styles.opcao,
                respostas[promptAtual.id] === op.valor && styles.opcaoSelecionada,
                pressed && styles.opcaoPressionada,
              ]}
              onPress={() => selecionarOpcao(op.valor)}
            >
              <Text style={styles.opcaoEmoji}>{op.emoji}</Text>
              <Text style={styles.opcaoLabel}>{op.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Indicador de voz */}
      <View style={styles.voiceHint}>
        <Text style={styles.voiceHintText}>🎙️  Pode falar ou tocar na opção</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.deep,
    paddingHorizontal: 24,
    paddingTop:      60,
    paddingBottom:   40,
  },
  bgGlow: {
    position:        'absolute',
    top:             -100,
    left:            -100,
    right:           -100,
    height:          400,
    backgroundColor: Colors.violetDim,
    borderRadius:    200,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap:           8,
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: Colors.border2,
  },
  dotAtivo: {
    width:           24,
    borderRadius:    4,
    backgroundColor: Colors.violet,
  },
  dotConcluido: {
    backgroundColor: Colors.neon,
  },
  perguntaWrap: {
    flex: 1,
    gap:  20,
  },
  bubble: {
    backgroundColor: Colors.surface2,
    borderRadius:    4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding:         18,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  pergunta: {
    fontSize:   15,
    color:      Colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  opcoes: {
    gap: 10,
  },
  opcao: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: Colors.surface,
    borderRadius:    14,
    padding:         16,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  opcaoSelecionada: {
    borderColor:     Colors.violet,
    backgroundColor: Colors.violetDim,
  },
  opcaoPressionada: {
    backgroundColor: Colors.surface2,
  },
  opcaoEmoji: {
    fontSize: 22,
  },
  opcaoLabel: {
    fontSize:   14,
    color:      Colors.text,
    fontWeight: '500',
    flex:       1,
  },
  voiceHint: {
    alignItems: 'center',
    paddingTop:  16,
  },
  voiceHintText: {
    fontSize: 12,
    color:    Colors.text3,
  },
});
