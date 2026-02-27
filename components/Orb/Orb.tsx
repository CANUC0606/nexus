// components/Orb/Orb.tsx — Orb animada central do NEXUS
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';

export type OrbEstado = 'idle' | 'escutando' | 'pensando' | 'falando';

interface OrbProps {
  estado?:    OrbEstado;
  tamanho?:   number;
  onPress?:   () => void;
}

export function Orb({ estado = 'idle', tamanho = 100, onPress }: OrbProps) {
  const escala      = useRef(new Animated.Value(1)).current;
  const opacidadeRing = useRef(new Animated.Value(0.4)).current;
  const rotacao     = useRef(new Animated.Value(0)).current;
  const rotacao2    = useRef(new Animated.Value(0)).current;

  // Animação de respiração (idle)
  useEffect(() => {
    let anim: Animated.CompositeAnimation;

    if (estado === 'idle') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
        ])
      );
    } else if (estado === 'falando') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.10, duration: 180, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 0.97, duration: 180, useNativeDriver: true }),
        ])
      );
    } else if (estado === 'pensando') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 0.98, duration: 600, useNativeDriver: true }),
        ])
      );
    } else {
      // escutando
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 1.02, duration: 400, useNativeDriver: true }),
        ])
      );
    }

    anim.start();
    return () => anim.stop();
  }, [estado]);

  // Rotação dos rings
  useEffect(() => {
    const r1 = Animated.loop(
      Animated.timing(rotacao, { toValue: 1, duration: 4000, useNativeDriver: true })
    );
    const r2 = Animated.loop(
      Animated.timing(rotacao2, { toValue: -1, duration: 6000, useNativeDriver: true })
    );
    r1.start();
    r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, []);

  const spin1 = rotacao.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = rotacao2.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  const corPrincipal = estado === 'falando'   ? Colors.cyan
                     : estado === 'pensando'  ? Colors.amber
                     : estado === 'escutando' ? Colors.violet
                     : Colors.violet;

  const s = tamanho;

  return (
    <Pressable onPress={onPress} style={[styles.container, { width: s + 40, height: s + 40 }]}>
      {/* Ring externo */}
      <Animated.View style={[
        styles.ring,
        { width: s + 20, height: s + 20, borderRadius: (s + 20) / 2,
          borderColor: corPrincipal, opacity: 0.3,
          transform: [{ rotate: spin1 }] }
      ]} />

      {/* Ring interno */}
      <Animated.View style={[
        styles.ring,
        { width: s + 8, height: s + 8, borderRadius: (s + 8) / 2,
          borderColor: Colors.cyan, opacity: 0.5,
          transform: [{ rotate: spin2 }] }
      ]} />

      {/* Núcleo */}
      <Animated.View style={[
        styles.core,
        { width: s, height: s, borderRadius: s / 2,
          backgroundColor: corPrincipal,
          shadowColor: corPrincipal,
          transform: [{ scale: escala }] }
      ]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  ring: {
    position:   'absolute',
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderTopColor:    'transparent',
    borderBottomColor: 'transparent',
  },
  core: {
    shadowOpacity: 0.7,
    shadowRadius:  20,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     10,
  },
});
