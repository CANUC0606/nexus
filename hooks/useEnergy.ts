// hooks/useEnergy.ts — Motor de energia baseado no perfil e horário
import { useMemo } from 'react';
import { useUserStore } from '../store/userStore';

export type NivelEnergia = 'pico' | 'normal' | 'baixa';

interface EnergyResult {
  nivel:       NivelEnergia;
  label:       string;
  emoji:       string;
  percentual:  number;      // 0–100 para a barra visual
  proximoPico: string | null; // ex: "14:30"
}

function horaAtual(): number {
  return new Date().getHours() + new Date().getMinutes() / 60;
}

export function useEnergy(): EnergyResult {
  const perfil = useUserStore((s) => s.perfil);

  return useMemo(() => {
    const hora = horaAtual();
    const pico  = perfil.pico_energia;

    // Janelas de pico por perfil
    const janelas: Record<string, [number, number][]> = {
      manha: [[7.5, 10.5]],
      tarde: [[13.0, 16.0]],
      noite: [[17.5, 21.0]],
      varia: [[8.0, 10.0], [14.0, 16.0]],
    };

    const minhasJanelas = janelas[pico ?? 'varia'] ?? janelas.varia;
    const emPico = minhasJanelas.some(([ini, fim]) => hora >= ini && hora <= fim);

    // Horário de baixa energia (pós-almoço ou noite tarde)
    const emBaixa = (hora >= 12.5 && hora <= 13.5) || hora >= 22.0;

    // Calcular próximo pico
    const proximoPico = minhasJanelas
      .map(([ini]) => ini)
      .find((h) => h > hora);
    const proximoPicoStr = proximoPico
      ? `${Math.floor(proximoPico)}:${String(Math.round((proximoPico % 1) * 60)).padStart(2, '0')}`
      : null;

    if (emPico) {
      return { nivel: 'pico', label: 'Pico de energia', emoji: '⚡', percentual: 90, proximoPico: null };
    }
    if (emBaixa) {
      return { nivel: 'baixa', label: 'Energia baixa', emoji: '🌙', percentual: 25, proximoPico: proximoPicoStr };
    }
    return { nivel: 'normal', label: 'Energia normal', emoji: '🌿', percentual: 55, proximoPico: proximoPicoStr };
  }, [perfil.pico_energia]);
}
