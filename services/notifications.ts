// services/notifications.ts — Sistema de gatilhos proativos
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar como as notificações aparecem com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

// ── PERMISSÕES ────────────────────────────────────────────────────────────────

export async function solicitarPermissao(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notificações só funcionam em dispositivo físico');
    return false;
  }

  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;

  if (existente !== 'granted') {
    const { status: novo } = await Notifications.requestPermissionsAsync();
    status = novo;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nexus-gatilhos', {
      name:           'Gatilhos NEXUS',
      importance:     Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:     '#8B5CF6',
    });
  }

  return status === 'granted';
}

// ── AGENDAR GATILHOS DE PICO ──────────────────────────────────────────────────

export interface ConfigGatilho {
  hora:    number;   // 0–23
  minuto:  number;   // 0–59
  titulo:  string;
  corpo:   string;
}

export async function agendarGatilhoDiario(config: ConfigGatilho) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: config.titulo,
      body:  config.corpo,
      data:  { tipo: 'pico_energia' },
    },
    trigger: {
      hour:    config.hora,
      minute:  config.minuto,
      repeats: true,
    },
  });
}

export async function cancelarTodosGatilhos() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

// ── NOTIFICAÇÃO IMEDIATA ──────────────────────────────────────────────────────

export async function notificarAgora(titulo: string, corpo: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo },
    trigger: null,
  });
}

// ── HORÁRIOS PADRÃO POR PERFIL ────────────────────────────────────────────────

type PicoEnergia = 'manha' | 'tarde' | 'noite' | 'varia';

export function horariosParaPerfil(pico: PicoEnergia): ConfigGatilho[] {
  const configs: Record<PicoEnergia, ConfigGatilho[]> = {
    manha: [
      { hora: 8,  minuto: 0,  titulo: '⚡ NEXUS — Pico de manhã', corpo: 'Seu melhor horário do dia. Tenho uma tarefa de 10 min pra você.' },
      { hora: 9,  minuto: 30, titulo: '⚡ NEXUS',                 corpo: 'Ainda no pico! Mais uma micro-etapa?' },
    ],
    tarde: [
      { hora: 13, minuto: 30, titulo: '⚡ NEXUS — Pico da tarde', corpo: 'Energia chegando. Topa 10 minutos de foco?' },
      { hora: 15, minuto: 0,  titulo: '⚡ NEXUS',                 corpo: 'Melhor momento da tarde. Uma tarefa rápida?' },
    ],
    noite: [
      { hora: 18, minuto: 0,  titulo: '⚡ NEXUS — Pico da noite', corpo: 'Sua hora chegou. Foco por 15 minutos?' },
      { hora: 20, minuto: 0,  titulo: '⚡ NEXUS',                 corpo: 'Uma micro-etapa antes de encerrar o dia?' },
    ],
    varia: [
      { hora: 9,  minuto: 0,  titulo: '⚡ NEXUS — Bom dia',       corpo: 'Como está sua energia agora? Tenho algo pra você.' },
      { hora: 14, minuto: 0,  titulo: '⚡ NEXUS',                  corpo: 'Check-in de tarde. Pronto para uma micro-tarefa?' },
    ],
  };

  return configs[pico] ?? configs.varia;
}

// ── LISTENER ─────────────────────────────────────────────────────────────────

export function ouvirNotificacoes(
  onReceber:   (n: Notifications.Notification) => void,
  onInteragir: (r: Notifications.NotificationResponse) => void
) {
  const sub1 = Notifications.addNotificationReceivedListener(onReceber);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onInteragir);
  return () => { sub1.remove(); sub2.remove(); };
}
