ARQUITETURA: # NEXUS — Arquitetura & Fluxos de Tela

> Assistente pessoal de IA para pessoas com TDAH. O app vai ao encontro do usuário, nunca o contrário.

---

## O Problema

Apps de produtividade genéricos (Trello, Notion) falham para pessoas com TDAH porque exigem disciplina para serem usados. O padrão de abandono é sempre o mesmo:

```
Dia 1 → configuração animada
Dia 2 → ignora notificações
Dia 3 → culpa por tarefas acumuladas
Dia 7 → desinstala
```

**Ciclo:** Culpa + Esforço + Passividade = Desinstalação

---

## Os 6 Diferenciais

| # | Diferencial | Descrição |
|---|-------------|-----------|
| 1 | **Onboarding Zero** | Usuário abre e já conversa. Sem cadastros, sem tutoriais. Perfil construído silenciosamente |
| 2 | **App Proativo** | Vai ao encontro do usuário nos horários de pico de energia |
| 3 | **Micro-compromissos** | Sempre pede o menor pedaço possível. Reagenda sem drama se recusar |
| 4 | **Memória Emocional** | Lembra quando o usuário trava. Não propõe tarefas em momentos ruins |
| 5 | **Dopamina Intencional** | Cada micro-tarefa gera celebração personalizada referenciando o feito real |
| 6 | **Floating Overlay** | Botão flutuante sempre visível. Elimina o "fora da vista, fora da mente" |

> **Filosofia:** Apps normais são depósitos de tarefas. O NEXUS é um parceiro que age.

---

## Arquitetura — 4 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1 — INTERFACE                                        │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ Floating Overlay │  │ App Principal (3 telas MVP)      │ │
│  │ Android: Bubble  │  │ Chat | Energia | Conquistas      │ │
│  │ iOS: Widget +    │  │                                  │ │
│  │ Live Activity +  │  │                                  │ │
│  │ Dynamic Island   │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 2 — MOTOR DE CONTEXTO                               │
│  Perfil Vivo (JSON) + Motor de Energia + Histórico          │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 3 — IA                                              │
│  Claude API (principal) · GPT-4o (backup)                   │
│  Prompt Engineering + Quebrador de Tarefas                  │
├─────────────────────────────────────────────────────────────┤
│  CAMADA 4 — DADOS                                           │
│  Supabase: PostgreSQL + Auth + Realtime + Storage           │
└─────────────────────────────────────────────────────────────┘
```

---

## Camada 1 — Interface

### Floating Overlay (Android)
- **Implementação:** Foreground Service + WindowManager
- **Comportamento:** Bolinha recolhe para borda quando inativa, pulsa quando tem mensagem
- **Expande:** Mini-card sem abrir o app completo
- **Permissão:** `SYSTEM_ALERT_WINDOW` — solicitada no onboarding

### iOS — Tríade de Presença
- **Widget** na tela inicial: próxima micro-tarefa + botão check direto
- **Live Activity** na tela de bloqueio durante tarefas ativas
- **Dynamic Island** em modelos compatíveis

### App Principal — 3 Telas MVP

| Tela | Função |
|------|--------|
| **Chat** | Interface conversacional pura, sem menus/abas |
| **Energia** | Configuração de horários de pico + resumo do dia |
| **Conquistas** | Histórico positivo — nunca lista de pendências |

---

## Camada 2 — Motor de Contexto

### Perfil Vivo

JSON dinâmico atualizado silenciosamente com o comportamento real do usuário:

```json
{
  "picos_energia": ["08:00-10:00", "15:00-16:30"],
  "dias_dificeis": ["segunda", "domingo_noite"],
  "tempo_resposta_medio": "4 minutos",
  "trava_em": ["tarefas financeiras", "emails longos"],
  "tom_preferido": "direto com humor leve",
  "streak_atual": 3,
  "ultima_conquista": "finalizou proposta comercial em 2 sessões"
}
```

### Motor de Energia
- Usuário declara picos inicialmente no onboarding
- App cruza declaração com comportamento real (tempo de resposta por horário)
- Precisão cresce com o uso — diferencial impossível em apps genéricos

---

## Camada 3 — IA

### Modelo Principal: Claude (Anthropic)
- Janela de contexto longa → injeta perfil completo + histórico + tarefas ativas
- Tom conversacional superior
- Ideal para memória e personalidade consistente

### Estrutura do Prompt

```
[System Prompt]
Você é assistente pessoal para TDAH.
Papel: quebrar tarefas, celebrar conquistas, nunca gerar culpa.
Tom: direto, humano, sem jargão, português brasileiro.

[Contexto do Usuário — atualizado a cada chamada]
{perfil_vivo_json}
Tarefas ativas: {lista} | Horário: {hora} | Energia: {nível}

[Histórico Recente]
{últimas_10_mensagens}

[Mensagem do usuário]
{input}
```

### Quebrador de Tarefas
Função dedicada que retorna tarefa quebrada com:
- Máximo de 4 micro-etapas de até 15min cada
- Linguagem de ação clara: verbo + objeto (Abrir, Escrever, Ligar, Revisar...)
- Cada etapa vira card no banco com status, tempo estimado, horário sugerido

---

## Camada 4 — Dados (Supabase)

### Schema MVP

```sql
-- Usuários e perfil vivo
CREATE TABLE usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  perfil_vivo JSONB DEFAULT '{}',
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas e micro-etapas
CREATE TABLE tarefas (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo             TEXT NOT NULL,
  micro_etapas       JSONB DEFAULT '[]',
  status             TEXT DEFAULT 'pendente',
  energia_necessaria TEXT,
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  concluido_em       TIMESTAMPTZ
);

-- Histórico de conversas
CREATE TABLE conversas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  mensagem   TEXT NOT NULL,
  papel      TEXT NOT NULL CHECK (papel IN ('usuario', 'assistente')),
  timestamp  TIMESTAMPTZ DEFAULT NOW()
);

-- Gatilhos proativos
CREATE TABLE gatilhos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  horario          TIME NOT NULL,
  tipo             TEXT NOT NULL,
  mensagem_template TEXT,
  ativo            BOOLEAN DEFAULT TRUE,
  ultimo_disparo   TIMESTAMPTZ
);
```

---

## Sistema de Gatilhos Proativos

### Fluxo (job a cada 15min)

```
1. Para cada usuário ativo
2. → Verifica se horário atual é pico de energia
3. → Se sim: verifica micro-tarefa pendente adequada
4. → Gera mensagem personalizada via IA com perfil injetado
5. → Dispara notificação push (Expo Push Notifications)
6. → Registra disparo para não repetir no ciclo
```

### Régua Anti-Spam

- Máximo **3 contatos proativos/dia**
- Nunca dois seguidos com **menos de 90min de intervalo**
- Zero contato fora do intervalo configurável (ex: nunca após 22h)
- Se usuário ignorou 3 contatos seguidos → reduz frequência e muda abordagem

---

## Stack Técnico

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| Framework | React Native + Expo | SDK 51+ | App iOS e Android |
| Linguagem | TypeScript | 5.x | Tipagem e segurança |
| IA Principal | Anthropic Claude | claude-sonnet-4-6 | Assistente conversacional |
| IA Backup | OpenAI GPT-4o | Latest | Fallback e comparativo |
| Backend/DB | Supabase | Latest | Auth + DB + Realtime |
| Notificações | Expo Push | Built-in | Push unificado iOS/Android |
| State | Zustand | 4.x | Estado global simples |
| Navegação | React Navigation | 6.x | Rotas e telas |

---

## Escopo MVP vs V2

### ✅ Entra no MVP
- Assistente conversacional com quebra automática de tarefas
- Sistema de picos de energia com notificações proativas
- Floating Overlay (Android) e Widget/Live Activity (iOS)
- Perfil vivo construído via conversa no onboarding
- Motor de gatilhos com régua anti-spam
- Tela de conquistas com celebração de micro-tarefas

### 🔜 Fica para V2
- Integração Google Calendar e Apple Calendar
- Canal via WhatsApp (API oficial)
- ML avançado no motor de energia
- Modo colaborativo (pais acompanhando filhos)
- Relatórios de produtividade e evolução

---

## Fluxos de Tela — 6 Telas MVP

> **Identidade visual:** Orb animada que pulsa quando fala, fica quieta quando escuta. Sem avatar humano/robô. Só presença.

---

### S1 — Splash (Boas-vindas)

```
┌─────────────────────┐
│                     │
│      ◉ (orb)        │  ← Pulsando
│                     │
│   NEXUS             │
│   Foco quando       │
│   você precisar     │
│                     │
│   [ Começar → ]     │
│                     │
└─────────────────────┘
```

**Regras:**
- Duração máxima: 3 segundos
- Um único botão: sem fricção
- Sem login aqui — conta criada ao fim do onboarding

---

### S2 — Onboarding Conversacional

```
┌─────────────────────┐
│  ● ● ○ ○  (progresso)│
│                     │
│  ◉ "Quando você     │
│   tem mais energia  │
│   durante o dia?"   │
│                     │
│  🌅 De manhã        │
│  ☀️  À tarde        │
│  🌆 À noite         │
│  🌀 Muda muito      │
│                     │
│  🎙️ [falar]         │
└─────────────────────┘
```

**Regras:**
- 4 perguntas conduzidas pela IA
- Voz primeiro — opções visuais são fallback
- Emojis ativam reconhecimento emocional (cérebro TDAH processa emoção antes de texto)
- Perfil vivo inicia aqui
- Login automático ao fim

---

### S3 — Chat Principal

```
┌─────────────────────┐
│ ◉ NEXUS  ● falando  │
│                     │
│ ◉ "Encontrei 3      │
│   micro-etapas para │
│   hoje..."          │
│                     │
│ ┌─ TAREFA ─────────┐│
│ │ ✓ Definir estrut.││
│ │ ◎ Pesquisar dados││
│ │ ○ Montar slides  ││
│ │ ○ Ensaiar        ││
│ └──────────────────┘│
│                     │
│ [📎] [___input___] 🎙│
└─────────────────────┘
```

**Regras:**
- Orb pulsa quando IA fala em voz alta
- Task cards inline na conversa
- Check direto no card → tela de celebração
- Microfone em destaque (maior que campo de texto)
- Histórico limitado a 20 mensagens visíveis

---

### S4 — Hoje (Visão do Dia)

```
┌─────────────────────┐
│ Seu dia de hoje     │
│                     │
│ ⚡ Energia ████░░ 75%│
│ Pico de energia!    │
│                     │
│ // AGORA            │
│ ┌──────────────────┐│
│ │⚡ Pesquisar dados ││
│ │   15 min  [✓]    ││
│ └──────────────────┘│
│                     │
│ // MAIS TARDE       │
│ · Montar slides     │
│ · Ensaiar           │
│                     │
│ 🔥 3 dias · 12 feitas│
└─────────────────────┘
```

**Regras:**
- Badge `⚡ agora` em tarefas do pico atual
- Tarefas atrasadas reaparecem sem julgamento
- Sem contagem de pendências visível (nunca "cemitério de tarefas")

---

### S5 — Overlay Flutuante (Android)

```
Sobre qualquer tela:

         ╭──────────────────────────╮
    ◉●   │ ⚡ Pico de energia!      │
  (orb)  │ "Pesquisar dados" — 15min│
         │                          │
         │ [Agora não] [Vamos! 🎯]  │
         ╰──────────────────────────╯
```

**Regras:**
- Bolinha snap para a borda mais próxima ao soltar
- Pulsa quando há notificação
- "Agora não" sem culpa — reagenda silenciosamente
- Máximo 3 contatos proativos/dia
- iOS: Widget equivalente na tela inicial

---

### S6 — Celebração

```
┌─────────────────────┐
│                     │
│      ◉ (verde)      │  ← Orb muda de roxo para verde
│                     │
│  Missão cumprida.   │
│                     │
│  Você pesquisou os  │
│  dados em 12 min.   │
│                     │
│  🔥 4  dias de      │
│       sequência     │
│                     │
│  [ Próxima etapa →] │
│                     │
└─────────────────────┘
```

**Regras:**
- Duração máxima: 4 segundos (não deixa o usuário parar)
- Mensagem referencia o feito real (não genérica)
- Confetti proporcional ao esforço da tarefa
- Botão de próximo passo aproveita o momentum de dopamina

---

## Navegação

```
Fluxo Primeiro Acesso:
  S1 (Splash) → S2 (Onboarding) → S3 (Chat)

Fluxo Uso Diário:
  S3 (Chat) ↔ S4 (Hoje) → S6 (Celebração)

Fluxo Gatilho Proativo:
  S5 (Overlay) → S3/S4 → S6 (Celebração)
```

**Bottom Nav (3 itens):** Chat · Hoje · Conquistas

---

## Jornada do Usuário

### Primeiro Acesso (5 minutos)
App abre direto no chat. IA conduz conversa curta: "Quando você tem mais energia durante o dia?" Em 3-4 perguntas naturais, perfil básico montado e usuário sente que app o entende.

### Primeiros 3 Dias
App vai ao encontro nos horários declarados com micro-tarefas pequenas e vitórias fáceis. Objetivo: criar hábito de responder — não produtividade máxima.

### Semana 2+
Perfil ajusta-se por comportamento real. App sugere horários com precisão crescente, conhece pontos de trava, adapta tom. Usuário sente que app aprende — porque aprende de verdade.

### Critério de Sucesso MVP
> Se o usuário abrir o app no Dia 3 porque o NEXUS foi até ele com uma mensagem inteligente — a batalha principal de retenção foi ganha.



SETUPWINDOWS: # NEXUS — Setup de Desenvolvimento
### Windows · React Native · Expo · Android + iOS

---

## Visão Geral do Ambiente

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React Native + Expo | SDK 51+ |
| Linguagem | TypeScript | 5.x |
| IA Principal | Claude API (Anthropic) | claude-sonnet-4-6 |
| Backend/DB | Supabase | Latest |
| Notificações | Expo Push | Built-in |
| State | Zustand | 4.x |
| Navegação | React Navigation | 6.x |

---

## Pré-requisitos

Antes de começar, confirme o que já tem instalado:

- [ ] Windows 10 ou 11 (64-bit)
- [ ] Node.js — verificar com: `node -v`
- [ ] VS Code ou editor de preferência
- [ ] Git — verificar com: `git --version`
- [ ] Conta Google (Supabase + Google Calendar)
- [ ] Conta Anthropic (API do Claude)
- [ ] Celular Android com USB **ou** iPhone com Expo Go

> **Dica:** Abra o PowerShell como Administrador para todos os comandos de instalação.
> `Win + X` → "Terminal (Admin)"

---

## Passo 1 — Node.js 20 LTS

Use obrigatoriamente a versão LTS. A versão 20 é a mais estável e compatível com Expo SDK 51+.

### Opção A — Instalação Direta (recomendada)

1. Acesse **https://nodejs.org** e baixe o instalador LTS (botão verde)
2. Execute o `.msi` com opções padrão — marque **"Add to PATH"**
3. Reinicie o PowerShell e verifique:

```powershell
node -v
# v20.x.x

npm -v
# 10.x.x
```

### Opção B — Via winget

```powershell
winget install OpenJS.NodeJS.LTS

# Feche e reabra o terminal após instalar
node -v
```

> ⚠️ Se `node -v` retornar erro após instalar: feche **completamente** o PowerShell e abra novamente. O PATH só atualiza em novas sessões.

---

## Passo 2 — Expo CLI e Criar o Projeto

O Expo abstrai toda a complexidade do React Native. Não precisa configurar Xcode nem Android Studio para começar.

### Instalar Expo CLI

```powershell
npm install -g expo-cli
npm install -g eas-cli

# Verificar
expo --version
# 8.x.x
```

### Criar o projeto NEXUS

```powershell
# Navegue até onde quer criar o projeto
cd C:\Users\SeuUsuario\Projetos

# Criar com template TypeScript
npx create-expo-app nexus --template

# Quando perguntar o template, escolha:
# > Blank (TypeScript)

cd nexus
```

### Instalar todas as dependências de uma vez

```powershell
# Dependências principais
npx expo install expo-router expo-constants expo-status-bar
npx expo install expo-notifications expo-device expo-av
npx expo install expo-speech expo-haptics expo-blur

# Navegação
npm install @react-navigation/native @react-navigation/stack
npm install @react-navigation/bottom-tabs react-native-screens
npm install react-native-safe-area-context react-native-gesture-handler

# IA e dados
npm install @anthropic-ai/sdk
npm install @supabase/supabase-js

# Estado e utilitários
npm install zustand
npm install date-fns
npm install react-native-reanimated
```

> **Regra:** Use `npx expo install` para pacotes nativos (`expo-*`) — garante a versão compatível com o SDK. Para pacotes JS puros, `npm install` funciona normalmente.

---

## Passo 3 — Estrutura do Projeto

```
nexus/
├── app/                        # Telas (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx           # Chat principal
│   │   ├── today.tsx           # Visão do dia
│   │   ├── wins.tsx            # Conquistas
│   │   └── _layout.tsx         # Layout das abas
│   ├── onboarding.tsx          # Fluxo de primeiro acesso
│   └── _layout.tsx             # Layout raiz
├── components/
│   ├── Orb/                    # Orb animada central
│   ├── TaskCard/               # Cards de micro-tarefas
│   ├── ChatBubble/             # Mensagens do chat
│   ├── ArmCard/                # Cards de integração
│   └── Celebration/            # Tela de dopamina
├── services/
│   ├── claude.ts               # Integração API Anthropic
│   ├── supabase.ts             # Cliente Supabase
│   ├── notifications.ts        # Gatilhos proativos
│   └── arms/                   # Cada "braço" = 1 arquivo
│       ├── calendar.ts
│       ├── email.ts
│       └── ...
├── store/
│   ├── userStore.ts            # Perfil vivo do usuário
│   ├── taskStore.ts            # Tarefas e micro-etapas
│   └── sessionStore.ts         # Estado da conversa
├── constants/
│   ├── colors.ts               # Paleta NEXUS
│   └── prompts.ts              # System prompts da IA
├── hooks/
│   ├── useVoice.ts             # Input de voz
│   └── useEnergy.ts            # Motor de energia
└── assets/
```

### Criar a estrutura via PowerShell

```powershell
# Dentro da pasta nexus/
mkdir app\(tabs)
mkdir components\Orb, components\TaskCard, components\ChatBubble
mkdir components\ArmCard, components\Celebration
mkdir services\arms
mkdir store, constants, hooks
```

---

## Passo 4 — Variáveis de Ambiente e APIs

> ⛔ Nunca salve chaves de API diretamente no código.

Crie o arquivo `.env.local` na raiz do projeto:

```env
# .env.local — NUNCA commite este arquivo no Git

# Anthropic (Claude)
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Calendar (OAuth)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

### Proteger as chaves no Git

```powershell
echo .env.local >> .gitignore
```

### Onde obter cada chave

| Chave | URL |
|-------|-----|
| Anthropic API | `console.anthropic.com` |
| Supabase URL + Key | `app.supabase.com` → Projeto → Settings → API |
| Google Client ID | `console.cloud.google.com` → Credenciais OAuth |

---

## Passo 5 — Android Studio (Emulador)

> Este passo é opcional se você vai usar apenas o celular físico com Expo Go.

**Pré-requisito:** Verifique se sua máquina suporta virtualização. No BIOS, `Intel VT-x` ou `AMD-V` deve estar habilitado.

**1. Baixar Android Studio**
Acesse `developer.android.com/studio` e instale com opções padrão.

**2. Instalar SDK e Ferramentas**
Ao abrir pela primeira vez, aceite os termos e aguarde o download (~2GB).

**3. Criar um AVD (Emulador)**
Menu: `Device Manager` → `Create Device` → Pixel 7 → Android 14 (API 34) → Finish

**4. Configurar variáveis de ambiente**

```powershell
# Pesquise "variáveis de ambiente" no menu Iniciar
# Adicionar nova variável de SISTEMA:

ANDROID_HOME = C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk

# Adicionar ao PATH (editar variável Path):
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator

# Testar (nova janela do PowerShell):
adb --version
# Android Debug Bridge version 1.0.xx
```

---

## Passo 6 — Expo Go (Celular Físico)

O Expo Go é a forma mais rápida de ver o app rodando no celular real. Funciona via Wi-Fi na mesma rede — sem cabo.

**Android:** Play Store → buscar `Expo Go` → instalar

**iPhone:** App Store → buscar `Expo Go` → instalar

> ⚠️ **Importante:** O computador e o celular devem estar na **mesma rede Wi-Fi**.
> Se estiver em rede corporativa, use: `npx expo start --tunnel`

---

## Passo 7 — Rodar o Projeto

```powershell
# Entrar na pasta
cd C:\Users\SeuUsuario\Projetos\nexus

# Iniciar o servidor Expo
npx expo start

# Opções no terminal:
# [a] → abrir no emulador Android
# [i] → abrir no simulador iOS (só macOS)
# QR Code → escanear com Expo Go no celular

# Se a rede bloquear o QR Code:
npx expo start --tunnel
```

> **Hot Reload:** Qualquer alteração no código é refletida automaticamente em 1-2 segundos. Para reload completo, agite o celular ou pressione `[r]` no terminal.

---

## Passo 8 — Primeira Tela Funcional

Substitua o conteúdo de `app/(tabs)/index.tsx` para validar o ambiente:

```tsx
// app/(tabs)/index.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>NEXUS</Text>
      <Text style={styles.subtitle}>Ambiente configurado!</Text>
      <TouchableOpacity style={styles.btn}>
        <Text style={styles.btnText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title:   { fontSize: 42, fontWeight: '800', color: '#F0F0FF' },
  subtitle:{ fontSize: 16, color: '#00C8D4', marginTop: 8 },
  btn: {
    marginTop: 32,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
```

---

## Passo 9 — Supabase: Criar o Banco

Acesse `app.supabase.com`, crie um novo projeto e execute no Editor SQL:

```sql
-- Schema NEXUS v1.0

CREATE TABLE usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  perfil_vivo JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tarefas (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo             TEXT NOT NULL,
  micro_etapas       JSONB DEFAULT '[]',
  status             TEXT DEFAULT 'pendente',
  energia_necessaria TEXT,
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  concluido_em       TIMESTAMPTZ
);

CREATE TABLE conversas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  mensagem   TEXT NOT NULL,
  papel      TEXT NOT NULL CHECK (papel IN ('usuario', 'assistente')),
  timestamp  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gatilhos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  horario          TIME NOT NULL,
  tipo             TEXT NOT NULL,
  mensagem_template TEXT,
  ativo            BOOLEAN DEFAULT TRUE,
  ultimo_disparo   TIMESTAMPTZ
);

-- Habilitar Row Level Security
ALTER TABLE usuarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatilhos  ENABLE ROW LEVEL SECURITY;
```

---

## Passo 10 — Integração Claude API

Crie `services/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function chat(mensagem: string, perfil: object, historico: any[]) {
  const hora = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });

  const systemPrompt = `
    Você é NEXUS, assistente pessoal para pessoas com TDAH.
    Quebre tarefas grandes em micro-etapas de até 15 minutos.
    Nunca gere culpa. Celebre cada conquista. Tom direto e humano.

    PERFIL DO USUÁRIO: ${JSON.stringify(perfil)}
    HORÁRIO ATUAL: ${hora}
  `;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...historico,
      { role: 'user', content: mensagem },
    ],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
```

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| `'expo' não é reconhecido` | `npm config get prefix` → adicione o resultado + `\node_modules\.bin` ao PATH |
| QR Code não conecta | Mesma rede Wi-Fi? Tente `--tunnel`. Desative firewall temporariamente |
| Emulador Android lento | Habilite VT-x/AMD-V no BIOS. Instale `Android Emulator Hypervisor Driver` |
| `node_modules` corrompido | Delete `node_modules/` e `package-lock.json`, rode `npm install` |
| `Unable to resolve module` | `npx expo start --clear` |
| API Key não funciona | Variáveis `EXPO_PUBLIC_*` só são lidas ao iniciar o servidor. Reinicie após alterar `.env.local` |

---

## Próximos Passos

- [ ] Implementar o Onboarding Conversacional (tela S2)
- [ ] Construir o Chat Principal com voz
- [ ] Montar o Sistema de Micro-Tarefas com task cards
- [ ] Configurar Notificações Proativas
- [ ] Implementar o Floating Overlay Android
- [ ] Integrar Google Calendar (braço de agenda)



CODIGO FONTE: # NEXUS — Código-Fonte Completo

> Todos os arquivos do projeto prontos para colar no VS Code.

---

## Estrutura de Arquivos

```
nexus/
├── constants/
│   ├── colors.ts
│   └── prompts.ts
├── store/
│   ├── userStore.ts
│   └── taskStore.ts
├── services/
│   ├── claude.ts
│   ├── supabase.ts
│   └── notifications.ts
├── hooks/
│   ├── useVoice.ts
│   └── useEnergy.ts
├── components/
│   ├── Orb/Orb.tsx
│   ├── TaskCard/TaskCard.tsx
│   └── ChatBubble/ChatBubble.tsx
├── app/
│   ├── _layout.tsx
│   ├── onboarding.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── today.tsx
│       └── wins.tsx
├── app.json
├── package.json
└── tsconfig.json
```

---

## `constants/colors.ts`

```typescript
// Paleta oficial NEXUS
export const Colors = {
  // Fundos
  void:    '#04040C',
  deep:    '#080816',
  layer:   '#0C0C20',
  surface: '#12122A',
  surface2:'#1A1A32',

  // Bordas
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',

  // Cores principais
  cyan:       '#00C8D4',
  cyanDim:    'rgba(0,200,212,0.15)',
  cyanGlow:   'rgba(0,200,212,0.4)',
  violet:     '#8B5CF6',
  violetDim:  'rgba(139,92,246,0.2)',
  violetGlow: 'rgba(139,92,246,0.5)',
  neon:       '#39FF14',
  neonDim:    'rgba(57,255,20,0.12)',
  amber:      '#FBBF24',
  amberDim:   'rgba(251,191,36,0.15)',
  rose:       '#FF2D78',
  roseDim:    'rgba(255,45,120,0.15)',

  // Texto
  text:  'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.55)',
  text3: 'rgba(255,255,255,0.25)',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
```

---

## `constants/prompts.ts`

```typescript
export const SYSTEM_PROMPT = (perfil: object, hora: string) => `
Você é NEXUS, assistente pessoal para pessoas com TDAH.

## Sua missão
- Quebrar tarefas grandes em micro-etapas de NO MÁXIMO 15 minutos cada
- Nunca gerar culpa, sempre celebrar cada pequena conquista
- Falar em português brasileiro, tom direto, humano, sem jargão
- Propor apenas UMA ação por vez — nunca sobrecarregar
- Se a pessoa parecer travada, reduza o pedido ao mínimo possível

## Formato para tarefas
Quando o usuário mencionar qualquer objetivo, responda com:
1. Uma mensagem curta de acolhimento (1 linha)
2. Um JSON no formato abaixo:

\`\`\`json
{
  "task_card": true,
  "titulo": "Nome da tarefa",
  "etapas": [
    { "id": "1", "texto": "Verbo + o que fazer", "minutos": 10 },
    { "id": "2", "texto": "Próxima etapa clara",  "minutos": 15 }
  ]
}
\`\`\`

## Regras de ouro
- Máximo 4 etapas por task card
- Cada etapa começa com um verbo: Abrir, Escrever, Ligar, Pesquisar...
- Se a pessoa disser "não consigo agora", apenas reagende — zero julgamento

## Perfil do usuário
${JSON.stringify(perfil, null, 2)}

## Contexto atual
Horário: ${hora}
`;

export const ONBOARDING_PROMPTS = [
  {
    id: 'energia',
    pergunta: 'Oi! Sou o NEXUS. Quando você tem mais energia durante o dia?',
    opcoes: [
      { valor: 'manha',  label: 'De manhã, antes das 10h', emoji: '🌅' },
      { valor: 'tarde',  label: 'No começo da tarde',       emoji: '☀️' },
      { valor: 'noite',  label: 'Final de tarde ou noite',  emoji: '🌆' },
      { valor: 'varia',  label: 'Muda muito, sem padrão',   emoji: '🌀' },
    ],
  },
  {
    id: 'bloqueio',
    pergunta: 'Qual tipo de tarefa costuma te travar mais?',
    opcoes: [
      { valor: 'emails',     label: 'Emails e mensagens',      emoji: '📧' },
      { valor: 'financeiro', label: 'Contas e financeiro',     emoji: '💰' },
      { valor: 'criativo',   label: 'Criar coisas do zero',    emoji: '✍️' },
      { valor: 'decisao',    label: 'Tomar decisões difíceis', emoji: '🤔' },
    ],
  },
  {
    id: 'tom',
    pergunta: 'Qual tom você prefere que eu use com você?',
    opcoes: [
      { valor: 'direto',   label: 'Direto e objetivo',       emoji: '⚡' },
      { valor: 'amigavel', label: 'Amigável e com humor',    emoji: '😄' },
      { valor: 'formal',   label: 'Profissional e formal',   emoji: '💼' },
      { valor: 'suave',    label: 'Calmo e encorajador',     emoji: '🌱' },
    ],
  },
  {
    id: 'notificacoes',
    pergunta: 'Posso te chamar nos seus horários de pico de energia?',
    opcoes: [
      { valor: 'sim_3',  label: 'Sim, até 3x por dia', emoji: '✅' },
      { valor: 'sim_1',  label: 'Só 1x no meu pico',  emoji: '🔔' },
      { valor: 'manual', label: 'Só quando eu abrir', emoji: '🔕' },
    ],
  },
];
```

---

## `store/userStore.ts`

```typescript
import { create } from 'zustand';

export type TomPreferido = 'direto' | 'amigavel' | 'formal' | 'suave';
export type PicoEnergia  = 'manha' | 'tarde' | 'noite' | 'varia';
export type TipoNotif    = 'sim_3' | 'sim_1' | 'manual';

export interface PerfilVivo {
  pico_energia:             PicoEnergia | null;
  tom_preferido:            TomPreferido | null;
  bloqueia_em:              string | null;
  notificacoes:             TipoNotif | null;
  horarios_pico_declarados: string[];
  horarios_pico_observados: string[];
  tempo_resposta_medio_min: number;
  dias_dificeis:            string[];
  streak_atual:             number;
  streak_maximo:            number;
  ultima_conquista:         string | null;
  total_microtarefas:       number;
  taxa_conclusao:           number;
}

export interface UserState {
  id:               string | null;
  email:            string | null;
  onboarding_feito: boolean;
  perfil:           PerfilVivo;
  setUser:          (id: string, email: string) => void;
  setPerfil:        (updates: Partial<PerfilVivo>) => void;
  incrementStreak:  () => void;
  resetStreak:      () => void;
  registrarConquista: (descricao: string) => void;
  completarOnboarding: () => void;
}

const perfilInicial: PerfilVivo = {
  pico_energia: null, tom_preferido: null, bloqueia_em: null,
  notificacoes: null, horarios_pico_declarados: [],
  horarios_pico_observados: [], tempo_resposta_medio_min: 5,
  dias_dificeis: [], streak_atual: 0, streak_maximo: 0,
  ultima_conquista: null, total_microtarefas: 0, taxa_conclusao: 0,
};

export const useUserStore = create<UserState>((set) => ({
  id: null, email: null, onboarding_feito: false, perfil: perfilInicial,

  setUser: (id, email) => set({ id, email }),

  setPerfil: (updates) =>
    set((s) => ({ perfil: { ...s.perfil, ...updates } })),

  incrementStreak: () =>
    set((s) => {
      const novo = s.perfil.streak_atual + 1;
      return { perfil: { ...s.perfil, streak_atual: novo,
        streak_maximo: Math.max(novo, s.perfil.streak_maximo) } };
    }),

  resetStreak: () =>
    set((s) => ({ perfil: { ...s.perfil, streak_atual: 0 } })),

  registrarConquista: (descricao) =>
    set((s) => ({ perfil: { ...s.perfil, ultima_conquista: descricao,
      total_microtarefas: s.perfil.total_microtarefas + 1 } })),

  completarOnboarding: () => set({ onboarding_feito: true }),
}));
```

---

## `store/taskStore.ts`

```typescript
import { create } from 'zustand';

export interface MicroEtapa {
  id:           string;
  texto:        string;
  minutos:      number;
  concluida:    boolean;
  concluida_em?: Date;
}

export interface Tarefa {
  id:            string;
  titulo:        string;
  etapas:        MicroEtapa[];
  status:        'pendente' | 'em_andamento' | 'concluida' | 'adiada';
  energia:       'baixa' | 'media' | 'alta';
  criado_em:     Date;
  concluido_em?: Date;
  horario_sugerido?: string;
}

export interface Mensagem {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  timestamp:  Date;
  task_card?: Tarefa | null;
}

interface TaskState {
  tarefas:    Tarefa[];
  historico:  Mensagem[];
  carregando: boolean;
  addTarefa:       (tarefa: Omit<Tarefa, 'id' | 'criado_em'>) => Tarefa;
  concluirEtapa:   (tarefaId: string, etapaId: string) => void;
  adiarTarefa:     (tarefaId: string) => void;
  addMensagem:     (msg: Omit<Mensagem, 'id' | 'timestamp'>) => void;
  setCarregando:   (v: boolean) => void;
  tarefasAtivas:   () => Tarefa[];
  proximaEtapa:    () => { tarefa: Tarefa; etapa: MicroEtapa } | null;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const useTaskStore = create<TaskState>((set, get) => ({
  tarefas: [], historico: [], carregando: false,

  addTarefa: (dados) => {
    const tarefa: Tarefa = { ...dados, id: uid(), criado_em: new Date() };
    set((s) => ({ tarefas: [...s.tarefas, tarefa] }));
    return tarefa;
  },

  concluirEtapa: (tarefaId, etapaId) =>
    set((s) => ({
      tarefas: s.tarefas.map((t) => {
        if (t.id !== tarefaId) return t;
        const etapas = t.etapas.map((e) =>
          e.id === etapaId ? { ...e, concluida: true, concluida_em: new Date() } : e
        );
        const todasConcluidas = etapas.every((e) => e.concluida);
        return { ...t, etapas, status: todasConcluidas ? 'concluida' : 'em_andamento',
          concluido_em: todasConcluidas ? new Date() : undefined };
      }),
    })),

  adiarTarefa: (tarefaId) =>
    set((s) => ({ tarefas: s.tarefas.map((t) =>
      t.id === tarefaId ? { ...t, status: 'adiada' } : t) })),

  addMensagem: (msg) =>
    set((s) => ({ historico: [...s.historico,
      { ...msg, id: uid(), timestamp: new Date() }] })),

  setCarregando: (v) => set({ carregando: v }),

  tarefasAtivas: () => get().tarefas.filter((t) => t.status !== 'concluida'),

  proximaEtapa: () => {
    for (const tarefa of get().tarefasAtivas()) {
      const etapa = tarefa.etapas.find((e) => !e.concluida);
      if (etapa) return { tarefa, etapa };
    }
    return null;
  },
}));
```

---

## `services/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '../constants/prompts';
import { PerfilVivo } from '../store/userStore';
import { Mensagem, Tarefa } from '../store/taskStore';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

function formatarHistorico(historico: Mensagem[]) {
  return historico.slice(-10).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant' as const,
    content: m.content,
  }));
}

function extrairTaskCard(texto: string): { texto: string; tarefa: Partial<Tarefa> | null } {
  const match = texto.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return { texto, tarefa: null };
  try {
    const json = JSON.parse(match[1]);
    if (!json.task_card) return { texto, tarefa: null };
    const textoLimpo = texto.replace(/```json[\s\S]*?```/, '').trim();
    const tarefa: Partial<Tarefa> = {
      titulo: json.titulo,
      etapas: json.etapas.map((e: any, i: number) => ({
        id: String(i + 1), texto: e.texto,
        minutos: e.minutos ?? 10, concluida: false,
      })),
      status: 'pendente',
    };
    return { texto: textoLimpo, tarefa };
  } catch {
    return { texto, tarefa: null };
  }
}

export interface RespostaClaude {
  texto: string;
  tarefa: Partial<Tarefa> | null;
}

export async function enviarMensagem(
  mensagem: string,
  perfil: PerfilVivo,
  historico: Mensagem[]
): Promise<RespostaClaude> {
  const hora = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT(perfil, hora),
    messages: formatarHistorico(historico).concat([
      { role: 'user', content: mensagem },
    ]),
  });
  const textoCompleto = response.content[0].type === 'text'
    ? response.content[0].text : '';
  return extrairTaskCard(textoCompleto);
}
```

---

## `services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { PerfilVivo } from '../store/userStore';
import { Tarefa, Mensagem } from '../store/taskStore';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// Auth
export const loginComEmail = (email: string, senha: string) =>
  supabase.auth.signInWithPassword({ email, password: senha });

export const cadastrar = (email: string, senha: string) =>
  supabase.auth.signUp({ email, password: senha });

export const sair = () => supabase.auth.signOut();

// Perfil Vivo
export const salvarPerfil = (userId: string, perfil: Partial<PerfilVivo>) =>
  supabase.from('usuarios').upsert({ id: userId, perfil_vivo: perfil }).select().single();

export const carregarPerfil = (userId: string) =>
  supabase.from('usuarios').select('perfil_vivo').eq('id', userId).single();

// Tarefas
export const salvarTarefa = (userId: string, tarefa: Tarefa) =>
  supabase.from('tarefas').upsert({
    id: tarefa.id, usuario_id: userId, titulo: tarefa.titulo,
    micro_etapas: tarefa.etapas, status: tarefa.status,
    energia_necessaria: tarefa.energia, criado_em: tarefa.criado_em,
    concluido_em: tarefa.concluido_em ?? null,
  });

export const carregarTarefas = (userId: string) =>
  supabase.from('tarefas').select('*').eq('usuario_id', userId)
    .neq('status', 'concluida').order('criado_em', { ascending: false });

// Conversas
export const salvarMensagem = (userId: string, msg: Mensagem) =>
  supabase.from('conversas').insert({
    usuario_id: userId, mensagem: msg.content,
    papel: msg.role === 'user' ? 'usuario' : 'assistente',
    timestamp: msg.timestamp,
  });
```

---

## `services/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

export async function solicitarPermissao(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;
  if (existente !== 'granted') {
    const { status: novo } = await Notifications.requestPermissionsAsync();
    status = novo;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nexus-gatilhos', {
      name: 'Gatilhos NEXUS',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#8B5CF6',
    });
  }
  return status === 'granted';
}

export interface ConfigGatilho {
  hora: number; minuto: number; titulo: string; corpo: string;
}

export async function agendarGatilhoDiario(config: ConfigGatilho) {
  return Notifications.scheduleNotificationAsync({
    content: { title: config.titulo, body: config.corpo,
      data: { tipo: 'pico_energia' } },
    trigger: { hour: config.hora, minute: config.minuto, repeats: true },
  });
}

export async function notificarAgora(titulo: string, corpo: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo }, trigger: null,
  });
}

type PicoEnergia = 'manha' | 'tarde' | 'noite' | 'varia';

export function horariosParaPerfil(pico: PicoEnergia): ConfigGatilho[] {
  const configs: Record<PicoEnergia, ConfigGatilho[]> = {
    manha: [
      { hora: 8,  minuto: 0,  titulo: '⚡ NEXUS — Pico de manhã',
        corpo: 'Seu melhor horário. Tenho uma tarefa de 10 min.' },
      { hora: 9,  minuto: 30, titulo: '⚡ NEXUS',
        corpo: 'Ainda no pico! Mais uma micro-etapa?' },
    ],
    tarde: [
      { hora: 13, minuto: 30, titulo: '⚡ NEXUS — Pico da tarde',
        corpo: 'Energia chegando. Topa 10 minutos de foco?' },
      { hora: 15, minuto: 0,  titulo: '⚡ NEXUS',
        corpo: 'Melhor momento da tarde. Uma tarefa rápida?' },
    ],
    noite: [
      { hora: 18, minuto: 0,  titulo: '⚡ NEXUS — Pico da noite',
        corpo: 'Sua hora chegou. Foco por 15 minutos?' },
      { hora: 20, minuto: 0,  titulo: '⚡ NEXUS',
        corpo: 'Uma micro-etapa antes de encerrar o dia?' },
    ],
    varia: [
      { hora: 9,  minuto: 0,  titulo: '⚡ NEXUS — Bom dia',
        corpo: 'Como está sua energia? Tenho algo pra você.' },
      { hora: 14, minuto: 0,  titulo: '⚡ NEXUS',
        corpo: 'Check-in de tarde. Uma micro-tarefa?' },
    ],
  };
  return configs[pico];
}
```

---

## `hooks/useEnergy.ts`

```typescript
import { useMemo } from 'react';
import { useUserStore } from '../store/userStore';

export type NivelEnergia = 'pico' | 'normal' | 'baixa';

interface EnergyResult {
  nivel: NivelEnergia; label: string;
  emoji: string; percentual: number; proximoPico: string | null;
}

export function useEnergy(): EnergyResult {
  const perfil = useUserStore((s) => s.perfil);

  return useMemo(() => {
    const hora = new Date().getHours() + new Date().getMinutes() / 60;
    const pico = perfil.pico_energia;

    const janelas: Record<string, [number, number][]> = {
      manha: [[7.5, 10.5]],
      tarde: [[13.0, 16.0]],
      noite: [[17.5, 21.0]],
      varia: [[8.0, 10.0], [14.0, 16.0]],
    };

    const minhasJanelas = janelas[pico ?? 'varia'];
    const emPico  = minhasJanelas.some(([ini, fim]) => hora >= ini && hora <= fim);
    const emBaixa = (hora >= 12.5 && hora <= 13.5) || hora >= 22.0;

    const proximoPico = minhasJanelas.map(([ini]) => ini).find((h) => h > hora);
    const proximoPicoStr = proximoPico
      ? `${Math.floor(proximoPico)}:${String(Math.round((proximoPico % 1) * 60)).padStart(2,'0')}`
      : null;

    if (emPico)  return { nivel:'pico',   label:'Pico de energia', emoji:'⚡', percentual:90, proximoPico:null };
    if (emBaixa) return { nivel:'baixa',  label:'Energia baixa',   emoji:'🌙', percentual:25, proximoPico:proximoPicoStr };
    return            { nivel:'normal', label:'Energia normal',  emoji:'🌿', percentual:55, proximoPico:proximoPicoStr };
  }, [perfil.pico_energia]);
}
```

---

## `hooks/useVoice.ts`

```typescript
import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

export type EstadoVoz = 'idle' | 'gravando' | 'processando' | 'falando';

export function useVoice(onTranscricao?: (texto: string) => void) {
  const [estado, setEstado] = useState<EstadoVoz>('idle');

  const falar = useCallback((texto: string) => {
    const limpo = texto.replace(/```[\s\S]*?```/g, '').replace(/[*_#`]/g, '').trim();
    if (!limpo) return;
    setEstado('falando');
    Speech.speak(limpo, {
      language: 'pt-BR', pitch: 1.0, rate: 0.95,
      onDone: () => setEstado('idle'),
      onError: () => setEstado('idle'),
    });
  }, []);

  const pararFala    = useCallback(() => { Speech.stop(); setEstado('idle'); }, []);
  const iniciarGravacao = useCallback(() => setEstado('gravando'), []);
  const pararGravacao   = useCallback(() => {
    setEstado('processando');
    // TODO: integrar @react-native-voice/voice
    setTimeout(() => setEstado('idle'), 1000);
  }, []);

  return { estado, iniciarGravacao, pararGravacao, falar, pararFala,
    estaFalando: estado === 'falando' };
}
```

---

## `components/Orb/Orb.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';

export type OrbEstado = 'idle' | 'escutando' | 'pensando' | 'falando';

interface OrbProps {
  estado?: OrbEstado; tamanho?: number; onPress?: () => void;
}

export function Orb({ estado = 'idle', tamanho = 100, onPress }: OrbProps) {
  const escala   = useRef(new Animated.Value(1)).current;
  const rotacao  = useRef(new Animated.Value(0)).current;
  const rotacao2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (estado === 'idle') {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(escala, { toValue:1.04, duration:2000, useNativeDriver:true }),
        Animated.timing(escala, { toValue:1.00, duration:2000, useNativeDriver:true }),
      ]));
    } else if (estado === 'falando') {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(escala, { toValue:1.10, duration:180, useNativeDriver:true }),
        Animated.timing(escala, { toValue:0.97, duration:180, useNativeDriver:true }),
      ]));
    } else {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(escala, { toValue:1.06, duration:600, useNativeDriver:true }),
        Animated.timing(escala, { toValue:0.98, duration:600, useNativeDriver:true }),
      ]));
    }
    anim.start();
    return () => anim.stop();
  }, [estado]);

  useEffect(() => {
    const r1 = Animated.loop(Animated.timing(rotacao,  { toValue:1,  duration:4000, useNativeDriver:true }));
    const r2 = Animated.loop(Animated.timing(rotacao2, { toValue:-1, duration:6000, useNativeDriver:true }));
    r1.start(); r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, []);

  const spin1 = rotacao.interpolate({ inputRange:[0,1],   outputRange:['0deg','360deg'] });
  const spin2 = rotacao2.interpolate({ inputRange:[-1,0], outputRange:['-360deg','0deg'] });
  const cor   = estado === 'falando' ? Colors.cyan : estado === 'pensando' ? Colors.amber : Colors.violet;
  const s = tamanho;

  return (
    <Pressable onPress={onPress} style={{ width:s+40, height:s+40, alignItems:'center', justifyContent:'center' }}>
      <Animated.View style={[styles.ring, { width:s+20, height:s+20, borderRadius:(s+20)/2,
        borderColor:cor, opacity:0.3, transform:[{rotate:spin1}] }]} />
      <Animated.View style={[styles.ring, { width:s+8, height:s+8, borderRadius:(s+8)/2,
        borderColor:Colors.cyan, opacity:0.5, transform:[{rotate:spin2}] }]} />
      <Animated.View style={[styles.core, { width:s, height:s, borderRadius:s/2,
        backgroundColor:cor, shadowColor:cor, transform:[{scale:escala}] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { position:'absolute', borderWidth:1.5, borderStyle:'solid',
    borderTopColor:'transparent', borderBottomColor:'transparent' },
  core: { shadowOpacity:0.7, shadowRadius:20, shadowOffset:{width:0,height:0}, elevation:10 },
});
```

---

## `components/TaskCard/TaskCard.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { Tarefa, MicroEtapa } from '../../store/taskStore';

interface TaskCardProps {
  tarefa: Tarefa;
  onConcluirEtapa: (tarefaId: string, etapaId: string) => void;
}

export function TaskCard({ tarefa, onConcluirEtapa }: TaskCardProps) {
  const concluidas = tarefa.etapas.filter((e) => e.concluida).length;

  return (
    <View style={styles.card}>
      <View style={styles.topLine} />
      <View style={styles.header}>
        <Text style={styles.titulo} numberOfLines={1}>◈ {tarefa.titulo.toUpperCase()}</Text>
        <Text style={styles.progresso}>{concluidas}/{tarefa.etapas.length}</Text>
      </View>
      {tarefa.etapas.map((etapa, idx) => {
        const ativa = !etapa.concluida && (idx === 0 || tarefa.etapas[idx-1].concluida);
        return (
          <Pressable key={etapa.id}
            style={[styles.etapa, ativa && styles.etapaAtiva]}
            onPress={ativa ? () => onConcluirEtapa(tarefa.id, etapa.id) : undefined}
            disabled={etapa.concluida}>
            <View style={[styles.circulo, etapa.concluida && styles.circuloConcluido,
              ativa && !etapa.concluida && styles.circuloAtivo]}>
              {etapa.concluida && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={[styles.etapaTexto, etapa.concluida && styles.etapaTextoConcluido]}>
              {etapa.texto}
            </Text>
            <Text style={styles.etapaTempo}>{etapa.minutos}min</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor:Colors.surface, borderRadius:16, borderWidth:1,
    borderColor:Colors.border, overflow:'hidden', marginVertical:4 },
  topLine: { height:1, backgroundColor:Colors.cyan, opacity:0.5 },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.border },
  titulo: { flex:1, fontFamily:'monospace', fontSize:10, color:Colors.cyan, letterSpacing:1 },
  progresso: { fontFamily:'monospace', fontSize:10, color:Colors.text3 },
  etapa: { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16,
    paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.border },
  etapaAtiva: { backgroundColor:'rgba(139,92,246,0.05)' },
  circulo: { width:22, height:22, borderRadius:11, borderWidth:1.5, borderColor:Colors.border2,
    alignItems:'center', justifyContent:'center', flexShrink:0 },
  circuloAtivo: { borderColor:Colors.violet, shadowColor:Colors.violet,
    shadowOpacity:0.6, shadowRadius:6, elevation:4 },
  circuloConcluido: { backgroundColor:'rgba(57,255,20,0.15)', borderColor:Colors.neon },
  check: { fontSize:11, color:Colors.neon, fontWeight:'700' },
  etapaTexto: { flex:1, fontSize:13, color:Colors.text, lineHeight:18 },
  etapaTextoConcluido: { textDecorationLine:'line-through', color:Colors.text3 },
  etapaTempo: { fontFamily:'monospace', fontSize:10, color:Colors.text3 },
});
```

---

## `app/_layout.tsx`

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const onboardingFeito = useUserStore((s) => s.onboarding_feito);
  return (
    <View style={{ flex:1, backgroundColor:Colors.deep }}>
      <StatusBar style="light" backgroundColor={Colors.deep} />
      <Stack screenOptions={{ headerShown:false, animation:'fade' }}>
        {!onboardingFeito
          ? <Stack.Screen name="onboarding" />
          : <Stack.Screen name="(tabs)" />}
      </Stack>
    </View>
  );
}
```

---

## `app/onboarding.tsx`

```tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { ONBOARDING_PROMPTS } from '../constants/prompts';
import { Orb } from '../components/Orb/Orb';
import { useUserStore } from '../store/userStore';
import { useVoice } from '../hooks/useVoice';

export default function Onboarding() {
  const [etapa, setEtapa]   = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const setPerfil = useUserStore((s) => s.setPerfil);
  const completar = useUserStore((s) => s.completarOnboarding);
  const { falar } = useVoice();
  const promptAtual = ONBOARDING_PROMPTS[etapa];

  React.useEffect(() => { falar(promptAtual.pergunta); }, [etapa]);

  function selecionarOpcao(valor: string) {
    setRespostas((r) => ({ ...r, [promptAtual.id]: valor }));
    Animated.timing(fadeAnim, { toValue:0, duration:200, useNativeDriver:true }).start(() => {
      if (etapa < ONBOARDING_PROMPTS.length - 1) setEtapa((e) => e + 1);
      else finalizarOnboarding({ ...respostas, [promptAtual.id]: valor });
      Animated.timing(fadeAnim, { toValue:1, duration:300, useNativeDriver:true }).start();
    });
  }

  function finalizarOnboarding(r: Record<string, string>) {
    setPerfil({ pico_energia:r.energia as any, tom_preferido:r.tom as any,
      bloqueia_em:r.bloqueio, notificacoes:r.notificacoes as any });
    completar();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Orb estado="escutando" tamanho={72} />
        <View style={styles.dots}>
          {ONBOARDING_PROMPTS.map((_,i) => (
            <View key={i} style={[styles.dot, i===etapa && styles.dotAtivo, i<etapa && styles.dotConcluido]} />
          ))}
        </View>
      </View>
      <Animated.View style={[styles.body, { opacity:fadeAnim }]}>
        <View style={styles.bubble}>
          <Text style={styles.pergunta}>{promptAtual.pergunta}</Text>
        </View>
        <View style={styles.opcoes}>
          {promptAtual.opcoes.map((op) => (
            <Pressable key={op.valor}
              style={[styles.opcao, respostas[promptAtual.id]===op.valor && styles.opcaoSel]}
              onPress={() => selecionarOpcao(op.valor)}>
              <Text style={styles.opcaoEmoji}>{op.emoji}</Text>
              <Text style={styles.opcaoLabel}>{op.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
      <Text style={styles.hint}>🎙️  Pode falar ou tocar na opção</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.deep, paddingHorizontal:24, paddingTop:60, paddingBottom:40 },
  header:    { alignItems:'center', marginBottom:32, gap:20 },
  dots:      { flexDirection:'row', gap:8 },
  dot:       { width:8, height:8, borderRadius:4, backgroundColor:Colors.border2 },
  dotAtivo:  { width:24, borderRadius:4, backgroundColor:Colors.violet },
  dotConcluido: { backgroundColor:Colors.neon },
  body:      { flex:1, gap:20 },
  bubble:    { backgroundColor:Colors.surface2, borderRadius:16, padding:18,
    borderWidth:1, borderColor:Colors.border },
  pergunta:  { fontSize:15, color:Colors.text, lineHeight:22, fontWeight:'500' },
  opcoes:    { gap:10 },
  opcao:     { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:Colors.surface,
    borderRadius:14, padding:16, borderWidth:1, borderColor:Colors.border },
  opcaoSel:  { borderColor:Colors.violet, backgroundColor:Colors.violetDim },
  opcaoEmoji:{ fontSize:22 },
  opcaoLabel:{ fontSize:14, color:Colors.text, fontWeight:'500', flex:1 },
  hint:      { textAlign:'center', fontSize:12, color:Colors.text3 },
});
```

---

## `app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:Colors.deep, borderTopColor:Colors.border,
        borderTopWidth:1, paddingBottom:12, paddingTop:8, height:64 },
      tabBarActiveTintColor:   Colors.violet,
      tabBarInactiveTintColor: Colors.text3,
      tabBarLabelStyle: { fontSize:9, fontFamily:'monospace', letterSpacing:0.5, marginTop:2 },
    }}>
      <Tabs.Screen name="index"  options={{ title:'CHAT',   tabBarIcon:({color}) => <Text style={{fontSize:20,opacity:color===Colors.violet?1:0.4}}>💬</Text> }} />
      <Tabs.Screen name="today"  options={{ title:'HOJE',   tabBarIcon:({color}) => <Text style={{fontSize:20,opacity:color===Colors.violet?1:0.4}}>📋</Text> }} />
      <Tabs.Screen name="wins"   options={{ title:'STREAK', tabBarIcon:({color}) => <Text style={{fontSize:20,opacity:color===Colors.violet?1:0.4}}>⭐</Text> }} />
    </Tabs>
  );
}
```

---

## `app/(tabs)/index.tsx` (Chat Principal)

```tsx
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { ChatBubble } from '../../components/ChatBubble/ChatBubble';
import { Orb, OrbEstado } from '../../components/Orb/Orb';
import { useTaskStore } from '../../store/taskStore';
import { useUserStore } from '../../store/userStore';
import { enviarMensagem } from '../../services/claude';
import { useVoice } from '../../hooks/useVoice';
import { useEnergy } from '../../hooks/useEnergy';

export default function ChatScreen() {
  const insets    = useSafeAreaInsets();
  const [input, setInput]       = useState('');
  const [orbEstado, setOrbEstado] = useState<OrbEstado>('idle');
  const listRef   = useRef<FlatList>(null);

  const historico     = useTaskStore((s) => s.historico);
  const addMensagem   = useTaskStore((s) => s.addMensagem);
  const addTarefa     = useTaskStore((s) => s.addTarefa);
  const carregando    = useTaskStore((s) => s.carregando);
  const setCarregando = useTaskStore((s) => s.setCarregando);
  const perfil        = useUserStore((s) => s.perfil);
  const energia       = useEnergy();
  const { estado: vozEstado, iniciarGravacao, pararGravacao, falar } = useVoice();

  const enviar = useCallback(async (texto: string) => {
    if (!texto.trim() || carregando) return;
    setInput('');
    addMensagem({ role:'user', content:texto.trim(), task_card:null });
    setCarregando(true);
    setOrbEstado('pensando');
    try {
      const resposta = await enviarMensagem(texto.trim(), perfil, historico);
      let tarefa = null;
      if (resposta.tarefa) {
        tarefa = addTarefa({ titulo:resposta.tarefa.titulo!,
          etapas:resposta.tarefa.etapas!, status:'pendente', energia:'media' });
      }
      addMensagem({ role:'assistant', content:resposta.texto, task_card:tarefa });
      setOrbEstado('falando');
      falar(resposta.texto);
      setTimeout(() => setOrbEstado('idle'), 3000);
    } catch {
      addMensagem({ role:'assistant', content:'Desculpe, tive um problema. Pode repetir?', task_card:null });
      setOrbEstado('idle');
    } finally { setCarregando(false); }
  }, [carregando, historico, perfil]);

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS==='ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS==='ios' ? 88 : 0}>
      <View style={[styles.topbar, { paddingTop:insets.top+12 }]}>
        <View style={styles.topbarLeft}>
          <Orb estado={orbEstado} tamanho={36} />
          <View>
            <Text style={styles.topbarName}>NEXUS</Text>
            <Text style={styles.topbarState}>
              {orbEstado==='pensando' ? '● PROCESSANDO' : orbEstado==='falando' ? '● FALANDO' : '● ESCUTANDO'}
            </Text>
          </View>
        </View>
        <View style={styles.energyPill}>
          <Text style={styles.energyEmoji}>{energia.emoji}</Text>
          <Text style={styles.energyLabel}>{energia.label.toUpperCase()}</Text>
        </View>
      </View>
      {historico.length === 0
        ? <View style={styles.vazio}>
            <Orb estado="escutando" tamanho={80} />
            <Text style={styles.vazioTitulo}>Olá, estou aqui.</Text>
            <Text style={styles.vazioSub}>Me fale sobre uma tarefa que precisa fazer.</Text>
          </View>
        : <FlatList ref={listRef} data={historico} keyExtractor={(m) => m.id}
            renderItem={({item}) => <ChatBubble mensagem={item} />}
            contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({animated:true})} />
      }
      {carregando && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.violet} />
          <Text style={styles.loadingText}>NEXUS está pensando...</Text>
        </View>
      )}
      <View style={[styles.inputArea, { paddingBottom:insets.bottom+12 }]}>
        <View style={styles.inputWrap}>
          <TextInput style={styles.input} value={input} onChangeText={setInput}
            placeholder="Fale ou escreva qualquer coisa..." placeholderTextColor={Colors.text3}
            multiline returnKeyType="send" onSubmitEditing={() => enviar(input)} blurOnSubmit />
        </View>
        <Pressable style={[styles.voiceBtn, vozEstado==='gravando' && styles.voiceBtnAtivo]}
          onPress={input.trim() ? () => enviar(input) : () =>
            vozEstado==='gravando' ? pararGravacao() : iniciarGravacao()}>
          <Text style={styles.voiceBtnIcon}>
            {input.trim() ? '→' : vozEstado==='gravando' ? '⏹' : '🎙️'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.deep },
  topbar: { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingBottom:12,
    borderBottomWidth:1, borderBottomColor:Colors.border, gap:12 },
  topbarLeft: { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  topbarName: { fontSize:15, fontWeight:'700', color:Colors.white, letterSpacing:0.5 },
  topbarState:{ fontFamily:'monospace', fontSize:10, color:Colors.cyan, marginTop:2 },
  energyPill: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:Colors.surface,
    borderWidth:1, borderColor:Colors.border, borderRadius:999, paddingHorizontal:10, paddingVertical:5 },
  energyEmoji:{ fontSize:12 },
  energyLabel:{ fontFamily:'monospace', fontSize:9, color:Colors.text2, letterSpacing:0.5 },
  lista:      { paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  loadingRow: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:20, paddingVertical:8 },
  loadingText:{ fontFamily:'monospace', fontSize:11, color:Colors.text3 },
  inputArea:  { flexDirection:'row', alignItems:'flex-end', gap:10, paddingHorizontal:16,
    paddingTop:12, borderTopWidth:1, borderTopColor:Colors.border },
  inputWrap:  { flex:1, backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border2,
    borderRadius:14, paddingHorizontal:14, paddingVertical:10, minHeight:46, justifyContent:'center' },
  input:      { fontSize:13, color:Colors.text, maxHeight:100 },
  voiceBtn:   { width:46, height:46, borderRadius:14, backgroundColor:Colors.violet,
    alignItems:'center', justifyContent:'center', shadowColor:Colors.violet,
    shadowOpacity:0.5, shadowRadius:12, elevation:6 },
  voiceBtnAtivo: { backgroundColor:Colors.cyan, shadowColor:Colors.cyan },
  voiceBtnIcon:  { fontSize:18 },
  vazio:      { flex:1, alignItems:'center', justifyContent:'center', gap:16, paddingHorizontal:32 },
  vazioTitulo:{ fontSize:22, fontWeight:'800', color:Colors.white, letterSpacing:-0.5 },
  vazioSub:   { fontSize:13, color:Colors.text3, textAlign:'center', lineHeight:20 },
});
```

---

## `app.json`

```json
{
  "expo": {
    "name": "NEXUS",
    "slug": "nexus-tdah",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "splash": { "backgroundColor": "#080816" },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.nexus.tdah",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "O NEXUS usa o microfone para você falar suas tarefas.",
        "NSSpeechRecognitionUsageDescription": "Converte sua voz em texto."
      }
    },
    "android": {
      "package": "com.nexus.tdah",
      "permissions": ["RECORD_AUDIO", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SYSTEM_ALERT_WINDOW"]
    },
    "plugins": ["expo-router", "expo-notifications"],
    "scheme": "nexus",
    "experiments": { "typedRoutes": true }
  }
}
```

---

## `package.json`

```json
{
  "name": "nexus-tdah",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start":   "expo start",
    "android": "expo start --android",
    "ios":     "expo start --ios",
    "clear":   "expo start --clear"
  },
  "dependencies": {
    "@anthropic-ai/sdk":             "^0.27.0",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native":      "^6.1.17",
    "@supabase/supabase-js":         "^2.43.4",
    "date-fns":                      "^3.6.0",
    "expo":                          "~51.0.28",
    "expo-av":                       "~14.0.7",
    "expo-blur":                     "~13.0.2",
    "expo-constants":                "~16.0.2",
    "expo-device":                   "~6.0.2",
    "expo-haptics":                  "~13.0.1",
    "expo-notifications":            "~0.28.9",
    "expo-router":                   "~3.5.23",
    "expo-speech":                   "~12.0.2",
    "expo-status-bar":               "~1.12.1",
    "react":                         "18.2.0",
    "react-native":                  "0.74.5",
    "react-native-gesture-handler":  "~2.16.1",
    "react-native-reanimated":       "~3.10.1",
    "react-native-safe-area-context":"4.10.5",
    "react-native-screens":          "3.31.1",
    "zustand":                       "^4.5.4"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.3"
  }
}
```


OVERLAYANDROID: # NEXUS — Floating Overlay Android
### Guia completo de implementação · React Native + Expo Dev Client · Kotlin

---

## Como o Overlay Funciona

O Floating Overlay usa 3 componentes nativos Android que trabalham juntos:

| Componente | Função |
|-----------|--------|
| **WindowManager** | Adiciona views nativas diretamente sobre qualquer tela do sistema. É o que torna o overlay possível fora do app |
| **Foreground Service** | Processo que roda em background com notificação permanente. Sem ele, o Android mata a bolinha quando o app é fechado |
| **SYSTEM_ALERT_WINDOW** | Permissão especial concedida explicitamente pelo usuário. Sem ela, o WindowManager rejeita com `SecurityException` |

> ⚠️ **O Expo Go NÃO suporta módulos nativos customizados.** Para o overlay funcionar, use `expo-dev-client` (recomendado) ou execute em modo bare (`npx expo prebuild`).

---

## Arquivos do Módulo

| Arquivo | Destino no projeto | Função |
|--------|-------------------|--------|
| `FloatingBubbleService.kt` | `android/.../com/nexus/tdah/` | Serviço Android — overlay, animações, touch |
| `FloatingBubbleModule.kt`  | `android/.../com/nexus/tdah/` | Bridge React Native ← Kotlin |
| `FloatingBubblePackage.kt` | `android/.../com/nexus/tdah/` | Registra o módulo no React Native |
| `bubble_layout.xml`        | `android/.../res/layout/`    | Layout XML da bolinha flutuante |
| `expanded_card_layout.xml` | `android/.../res/layout/`    | Layout XML do mini-card |
| `drawables` (7 arquivos)   | `android/.../res/drawable/`  | Visuais do overlay |
| `withFloatingOverlay.js`   | `plugins/`                   | Config Plugin — AndroidManifest |
| `modules/FloatingOverlay/index.ts` | `modules/FloatingOverlay/` | API TypeScript |
| `hooks/useFloatingOverlay.ts`      | `hooks/`                   | Hook integrado ao sistema |
| `OverlayPermissionScreen.tsx`      | `components/`              | Tela de onboarding da permissão |

---

## Passo a Passo — Integração Completa

### Passo 1 — Instalar expo-dev-client

```bash
npx expo install expo-dev-client
npm install
```

### Passo 2 — Gerar o projeto nativo e copiar os arquivos

```bash
# Gerar a pasta android/ nativa
npx expo prebuild --platform android

# Copiar os arquivos Kotlin para:
# android/app/src/main/java/com/nexus/tdah/
#   FloatingBubbleService.kt
#   FloatingBubbleModule.kt
#   FloatingBubblePackage.kt

# Copiar layouts para:
# android/app/src/main/res/layout/
#   bubble_layout.xml
#   expanded_card_layout.xml

# Copiar cada drawable para:
# android/app/src/main/res/drawable/
#   bubble_core_bg.xml
#   bubble_ring_glow.xml
#   badge_bg.xml
#   card_bg.xml
#   orb_mini_bg.xml
#   btn_accept_bg.xml
#   btn_dismiss_bg.xml
```

### Passo 3 — Adicionar o Config Plugin ao app.json

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-notifications",
      "./plugins/withFloatingOverlay"
    ]
  }
}
```

### Passo 4 — Registrar o Package no MainApplication.kt

```kotlin
// android/app/src/main/java/com/nexus/tdah/MainApplication.kt
// Encontrar getPackages() e adicionar:

override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(FloatingBubblePackage())  // <- ADICIONAR ESTA LINHA
    }
```

### Passo 5 — Criar ícone de notificação

```bash
# Criar ícone PNG 24x24px branco com fundo transparente
# Salvar em:
# android/app/src/main/res/drawable/ic_nexus_notif.png

# Gerador online:
# romannurik.github.io/AndroidAssetStudio/
```

### Passo 6 — Build e instalar no celular

```bash
# Conectar o celular Android via USB com depuração ativa
adb devices
# List of devices attached
# XXXXXX  device

# Build e instala (3-5 minutos na primeira vez)
npx expo run:android

# Próximas vezes: apenas iniciar o servidor
npx expo start --dev-client
```

> **Ativar depuração USB:** Configurações → Sobre o telefone → toque 7x em "Número de compilação" → Opções do desenvolvedor → Depuração USB

---

## Código — FloatingBubbleService.kt

```kotlin
package com.nexus.tdah

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.*
import android.view.*
import android.view.animation.*
import android.widget.*
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class FloatingBubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var bubbleView: View
    private lateinit var expandedView: View
    private var isExpanded = false
    private var currentMessage = ""
    private var hasNotification = false
    private var initialX = 0; private var initialY = 0
    private var initialTouchX = 0f; private var initialTouchY = 0f

    companion object {
        const val CHANNEL_ID      = "nexus_overlay"
        const val NOTIF_ID        = 1001
        const val ACTION_UPDATE   = "com.nexus.ACTION_UPDATE_MESSAGE"
        const val ACTION_HIDE     = "com.nexus.ACTION_HIDE_BUBBLE"
        const val ACTION_SHOW     = "com.nexus.ACTION_SHOW_BUBBLE"
        const val EXTRA_MESSAGE   = "message"
        const val EXTRA_HAS_NOTIF = "has_notification"
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        buildBubble()
        buildExpandedCard()
        startForeground(NOTIF_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            when (it.action) {
                ACTION_UPDATE -> {
                    currentMessage  = it.getStringExtra(EXTRA_MESSAGE) ?: ""
                    hasNotification = it.getBooleanExtra(EXTRA_HAS_NOTIF, false)
                    updateBubbleState()
                }
                ACTION_HIDE -> collapseBubble()
                ACTION_SHOW -> expandBubble()
            }
        }
        return START_STICKY
    }

    private fun buildBubble() {
        bubbleView = LayoutInflater.from(this).inflate(R.layout.bubble_layout, null)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply { gravity = Gravity.TOP or Gravity.START; x = 20; y = 300 }
        windowManager.addView(bubbleView, params)
        animateBubbleFloat(bubbleView)
        setupBubbleTouchListener(params)
    }

    private fun buildExpandedCard() {
        expandedView = LayoutInflater.from(this).inflate(R.layout.expanded_card_layout, null)
        val params = WindowManager.LayoutParams(
            (280 * resources.displayMetrics.density).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply { gravity = Gravity.BOTTOM or Gravity.END; x = 16; y = 120 }
        expandedView.visibility = View.GONE
        windowManager.addView(expandedView, params)
        expandedView.findViewById<View>(R.id.btn_accept)?.setOnClickListener {
            sendBroadcastToApp("ACCEPTED"); collapseCard()
        }
        expandedView.findViewById<View>(R.id.btn_dismiss)?.setOnClickListener { collapseCard() }
    }

    private fun setupBubbleTouchListener(params: WindowManager.LayoutParams) {
        var isDragging = false
        bubbleView.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    isDragging = false; initialX = params.x; initialY = params.y
                    initialTouchX = event.rawX; initialTouchY = event.rawY; true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (abs(dx) > 8 || abs(dy) > 8) isDragging = true
                    if (isDragging) {
                        params.x = initialX + dx; params.y = initialY + dy
                        windowManager.updateViewLayout(bubbleView, params)
                    }; true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) { if (isExpanded) collapseCard() else expandCard() }
                    else snapToEdge(params); true
                }
                else -> false
            }
        }
    }

    private fun animateBubbleFloat(view: View) {
        TranslateAnimation(0f, 0f, 0f, -6f).apply {
            duration = 2000; repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE; interpolator = DecelerateInterpolator()
        }.also { view.startAnimation(it) }
    }

    private fun animatePulse(view: View) {
        ScaleAnimation(1f, 1.12f, 1f, 1.12f,
            Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 600; repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE; interpolator = DecelerateInterpolator()
        }.also { view.startAnimation(it) }
    }

    private fun snapToEdge(params: WindowManager.LayoutParams) {
        val display = windowManager.defaultDisplay
        val size = android.graphics.Point(); display.getSize(size)
        val targetX = if (params.x + bubbleView.width / 2 < size.x / 2) 12
                      else size.x - bubbleView.width - 12
        android.animation.ValueAnimator.ofInt(params.x, targetX).apply {
            duration = 250; interpolator = DecelerateInterpolator()
            addUpdateListener { params.x = it.animatedValue as Int
                windowManager.updateViewLayout(bubbleView, params) }
        }.start()
    }

    private fun expandCard() {
        isExpanded = true
        expandedView.apply {
            visibility = View.VISIBLE; alpha = 0f; scaleX = 0.85f; scaleY = 0.85f
            animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(220)
                .setInterpolator(DecelerateInterpolator()).start()
        }
        expandedView.findViewById<TextView>(R.id.card_message)?.text = currentMessage
    }

    private fun collapseCard() {
        isExpanded = false
        expandedView.animate().alpha(0f).scaleX(0.85f).scaleY(0.85f).setDuration(180)
            .withEndAction { expandedView.visibility = View.GONE }.start()
    }

    private fun collapseBubble() {
        bubbleView.animate().alpha(0f).scaleX(0f).scaleY(0f).setDuration(200)
            .withEndAction { bubbleView.visibility = View.GONE }.start()
        collapseCard()
    }

    private fun expandBubble() {
        bubbleView.visibility = View.VISIBLE
        bubbleView.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(200).start()
    }

    private fun updateBubbleState() {
        val badge = bubbleView.findViewById<View>(R.id.notification_badge)
        badge?.visibility = if (hasNotification) View.VISIBLE else View.GONE
        if (hasNotification) animatePulse(bubbleView)
        else { bubbleView.clearAnimation(); animateBubbleFloat(bubbleView) }
        if (hasNotification && !isExpanded) expandCard()
    }

    private fun sendBroadcastToApp(action: String) {
        sendBroadcast(Intent("com.nexus.OVERLAY_ACTION").apply {
            putExtra("action", action); putExtra("message", currentMessage)
        })
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(NotificationChannel(
                    CHANNEL_ID, "NEXUS Overlay", NotificationManager.IMPORTANCE_LOW
                ).apply { description = "Mantém o assistente visível"; setShowBadge(false) })
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NEXUS ativo")
            .setContentText("Assistente rodando em segundo plano")
            .setSmallIcon(R.drawable.ic_nexus_notif)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true).build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        if (::bubbleView.isInitialized)   windowManager.removeView(bubbleView)
        if (::expandedView.isInitialized) windowManager.removeView(expandedView)
    }
}
```

---

## Código — FloatingBubbleModule.kt

```kotlin
package com.nexus.tdah

import android.content.*; import android.net.Uri; import android.os.Build; import android.provider.Settings
import com.facebook.react.bridge.*; import com.facebook.react.modules.core.DeviceEventManagerModule

class FloatingBubbleModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    private var overlayReceiver: BroadcastReceiver? = null
    override fun getName() = "FloatingBubble"

    @ReactMethod
    fun hasPermission(promise: Promise) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            Settings.canDrawOverlays(reactApplicationContext) else true
        promise.resolve(granted)
    }

    @ReactMethod
    fun requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !Settings.canDrawOverlays(reactApplicationContext)) {
            reactApplicationContext.startActivity(Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK })
        }
    }

    @ReactMethod
    fun show(message: String, hasNotification: Boolean) {
        val ctx = reactApplicationContext
        val intent = Intent(ctx, FloatingBubbleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            ctx.startForegroundService(intent) else ctx.startService(intent)
        updateMessage(message, hasNotification)
    }

    @ReactMethod
    fun updateMessage(message: String, hasNotification: Boolean) {
        reactApplicationContext.startService(
            Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_UPDATE
                putExtra(FloatingBubbleService.EXTRA_MESSAGE,   message)
                putExtra(FloatingBubbleService.EXTRA_HAS_NOTIF, hasNotification)
            })
    }

    @ReactMethod fun hide() {
        reactApplicationContext.startService(
            Intent(reactApplicationContext, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_HIDE })
    }

    @ReactMethod fun stop() {
        reactApplicationContext.stopService(
            Intent(reactApplicationContext, FloatingBubbleService::class.java))
    }

    @ReactMethod
    fun addListener(eventName: String) {
        if (overlayReceiver != null) return
        overlayReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val params = Arguments.createMap().apply {
                    putString("action",  intent.getStringExtra("action") ?: return)
                    putString("message", intent.getStringExtra("message") ?: "")
                }
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("NexusOverlayAction", params)
            }
        }
        val filter = IntentFilter("com.nexus.OVERLAY_ACTION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            reactApplicationContext.registerReceiver(overlayReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else reactApplicationContext.registerReceiver(overlayReceiver, filter)
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        overlayReceiver?.let { reactApplicationContext.unregisterReceiver(it); overlayReceiver = null }
    }
}
```

---

## Código — FloatingBubblePackage.kt

```kotlin
package com.nexus.tdah

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class FloatingBubblePackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(FloatingBubbleModule(ctx))

    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
```

---

## Layout — `bubble_layout.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="64dp" android:layout_height="64dp">

    <View android:layout_width="64dp" android:layout_height="64dp"
        android:layout_gravity="center"
        android:background="@drawable/bubble_ring_glow" />

    <View android:id="@+id/bubble_core"
        android:layout_width="52dp" android:layout_height="52dp"
        android:layout_gravity="center"
        android:background="@drawable/bubble_core_bg"
        android:elevation="8dp" />

    <TextView android:id="@+id/notification_badge"
        android:layout_width="18dp" android:layout_height="18dp"
        android:layout_gravity="top|end"
        android:layout_marginTop="2dp" android:layout_marginEnd="2dp"
        android:background="@drawable/badge_bg"
        android:gravity="center" android:text="!"
        android:textColor="#000000" android:textSize="9sp"
        android:textStyle="bold" android:elevation="10dp"
        android:visibility="gone" />
</FrameLayout>
```

---

## Layout — `expanded_card_layout.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="280dp" android:layout_height="wrap_content"
    android:orientation="vertical" android:background="@drawable/card_bg"
    android:padding="16dp" android:elevation="16dp">

    <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content"
        android:orientation="horizontal" android:gravity="center_vertical"
        android:layout_marginBottom="10dp">
        <View android:layout_width="24dp" android:layout_height="24dp"
            android:background="@drawable/orb_mini_bg" android:layout_marginEnd="10dp" />
        <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:text="NEXUS" android:textColor="#FFFFFF"
            android:textSize="13sp" android:textStyle="bold" />
    </LinearLayout>

    <TextView android:id="@+id/card_message"
        android:layout_width="match_parent" android:layout_height="wrap_content"
        android:textColor="#C8C8E8" android:textSize="12sp"
        android:lineSpacingExtra="3dp" android:layout_marginBottom="14dp" />

    <LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content"
        android:orientation="horizontal" android:gravity="end" android:weightSum="2">
        <TextView android:id="@+id/btn_dismiss"
            android:layout_width="0dp" android:layout_height="36dp" android:layout_weight="1"
            android:gravity="center" android:text="Agora não"
            android:textColor="#6060A0" android:textSize="12sp"
            android:background="@drawable/btn_dismiss_bg"
            android:layout_marginEnd="8dp" android:clickable="true" android:focusable="true" />
        <TextView android:id="@+id/btn_accept"
            android:layout_width="0dp" android:layout_height="36dp" android:layout_weight="1"
            android:gravity="center" android:text="Vamos! 🎯"
            android:textColor="#FFFFFF" android:textSize="12sp" android:textStyle="bold"
            android:background="@drawable/btn_accept_bg"
            android:clickable="true" android:focusable="true" />
    </LinearLayout>
</LinearLayout>
```

---

## Drawables — Criar um arquivo para cada

### `bubble_core_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <gradient android:type="radial" android:gradientRadius="100%"
        android:startColor="#C4B5FD" android:centerColor="#8B5CF6" android:endColor="#1E1040"
        android:centerX="0.35" android:centerY="0.35" />
</shape>
```

### `bubble_ring_glow.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#338B5CF6" />
</shape>
```

### `badge_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <solid android:color="#FBBF24" />
</shape>
```

### `card_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#F01A1A32" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#2A2A45" />
</shape>
```

### `btn_accept_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:type="linear" android:angle="135"
        android:startColor="#8B5CF6" android:endColor="#6D28D9" />
    <corners android:radius="8dp" />
</shape>
```

### `btn_dismiss_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#1A1A2E" />
    <corners android:radius="8dp" />
    <stroke android:width="1dp" android:color="#2A2A45" />
</shape>
```

### `orb_mini_bg.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <gradient android:type="radial" android:gradientRadius="100%"
        android:startColor="#C4B5FD" android:endColor="#8B5CF6"
        android:centerX="0.35" android:centerY="0.35" />
</shape>
```

---

## Código — `plugins/withFloatingOverlay.js`

```javascript
const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

function withOverlayManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // Permissões
    const permissoes = [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ];
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];
    permissoes.forEach((perm) => {
      if (!manifest['uses-permission'].some((p) => p.$?.['android:name'] === perm))
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
    });

    // Serviço
    const app = manifest.application[0];
    if (!app.service) app.service = [];
    if (!app.service.some((s) => s.$?.['android:name'] === '.FloatingBubbleService')) {
      app.service.push({
        $: {
          'android:name': '.FloatingBubbleService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
      });
    }

    return mod;
  });
}

module.exports = function withFloatingOverlay(config) {
  return withOverlayManifest(config);
};
```

---

## Código — `modules/FloatingOverlay/index.ts`

```typescript
import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';

const { FloatingBubble } = NativeModules;

export interface OverlayConfig {
  message: string;
  hasNotification?: boolean;
}

export interface OverlayActionEvent {
  action:  'ACCEPTED' | 'DISMISSED';
  message: string;
}

const emitter = FloatingBubble ? new NativeEventEmitter(FloatingBubble) : null;

const FloatingOverlay = {
  hasPermission: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    return FloatingBubble?.hasPermission() ?? false;
  },

  requestPermission: (): void => {
    if (Platform.OS !== 'android') return;
    FloatingBubble?.requestPermission();
  },

  show: (config: OverlayConfig): void => {
    if (Platform.OS !== 'android') return;
    FloatingBubble?.show(config.message, config.hasNotification ?? false);
  },

  updateMessage: (config: OverlayConfig): void => {
    if (Platform.OS !== 'android') return;
    FloatingBubble?.updateMessage(config.message, config.hasNotification ?? false);
  },

  hide: (): void => {
    if (Platform.OS !== 'android') return;
    FloatingBubble?.hide();
  },

  stop: (): void => {
    if (Platform.OS !== 'android') return;
    FloatingBubble?.stop();
  },

  onAction: (callback: (event: OverlayActionEvent) => void): EmitterSubscription | null => {
    if (Platform.OS !== 'android' || !emitter) return null;
    return emitter.addListener('NexusOverlayAction', callback);
  },
};

export default FloatingOverlay;
```

---

## Código — `hooks/useFloatingOverlay.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import FloatingOverlay from '../modules/FloatingOverlay';
import { useTaskStore } from '../store/taskStore';
import { useEnergy } from './useEnergy';

interface UseFloatingOverlayOptions {
  onAccept?:  (message: string) => void;
  onDismiss?: () => void;
}

export function useFloatingOverlay(options: UseFloatingOverlayOptions = {}) {
  const appState     = useRef<AppStateStatus>('active');
  const permGranted  = useRef(false);
  const proximaEtapa = useTaskStore((s) => s.proximaEtapa)();
  const energia      = useEnergy();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    async function init() {
      const temPermissao = await FloatingOverlay.hasPermission();
      permGranted.current = temPermissao;
      if (!temPermissao) { FloatingOverlay.requestPermission(); return; }
      FloatingOverlay.show({ message: buildContextMessage(), hasNotification: false });
    }
    init();

    const sub = FloatingOverlay.onAction((event) => {
      if (event.action === 'ACCEPTED') options.onAccept?.(event.message);
      else options.onDismiss?.();
    });

    return () => { sub?.remove(); FloatingOverlay.stop(); };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active';
      appState.current = nextState;
      if (wasActive && nextState === 'background') {
        const temNotif = energia.nivel === 'pico' && proximaEtapa !== null;
        FloatingOverlay.show({ message: buildContextMessage(), hasNotification: temNotif });
      }
      if (nextState === 'active') FloatingOverlay.hide();
    });
    return () => sub.remove();
  }, [proximaEtapa, energia.nivel]);

  const dispararGatilho = useCallback((mensagem: string) => {
    if (Platform.OS !== 'android' || !permGranted.current) return;
    FloatingOverlay.updateMessage({ message: mensagem, hasNotification: true });
  }, []);

  function buildContextMessage(): string {
    if (energia.nivel === 'pico' && proximaEtapa)
      return `${energia.emoji} Pico de energia! "${proximaEtapa.etapa.texto}" — ${proximaEtapa.etapa.minutos} min. Topa?`;
    if (proximaEtapa)
      return `Próxima etapa: "${proximaEtapa.etapa.texto}" (${proximaEtapa.etapa.minutos} min)`;
    return 'NEXUS ativo. Toque para abrir o assistente.';
  }

  return { dispararGatilho };
}
```

---

## Usando o hook no Chat Principal

```typescript
// app/(tabs)/index.tsx — adicionar 3 linhas
import { useFloatingOverlay } from '../../hooks/useFloatingOverlay';

export default function ChatScreen() {
  // Hook gerencia tudo automaticamente:
  // - Solicita permissão no primeiro uso
  // - Exibe overlay quando app vai para background
  // - Oculta quando app volta ao foreground
  // - Atualiza mensagem baseado em energia + próxima tarefa
  const { dispararGatilho } = useFloatingOverlay({
    onAccept: (msg) => {
      addMensagem({ role: 'user', content: 'Aceito! Vamos começar.', task_card: null });
    },
    onDismiss: () => console.log('Usuário dispensou o gatilho'),
  });

  // Para disparar um gatilho manualmente:
  // dispararGatilho("São 9h! Topa 10 minutos de foco?");

  // ... resto igual
}
```

---

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `SecurityException: permission denied` | Permissão não concedida | Verificar `hasPermission()` antes de chamar `show()`. Redirecionar para `requestPermission()` se `false` |
| Overlay some após fechar o app | Foreground Service não está rodando | Verificar se a notificação permanente aparece na barra de status |
| `FloatingBubble is undefined` | Package não registrado ou dev client desatualizado | Adicionar `FloatingBubblePackage()` no `MainApplication.kt` e rodar `npx expo run:android` novamente |
| Overlay não responde ao toque | `FLAG_NOT_FOCUSABLE` incorreto | Para inputs no card expandido, usar `FLAG_NOT_TOUCH_MODAL` |
| Layout aparece como quadrado | Drawable XML não encontrado | Verificar se cada arquivo está em `res/drawable/` com o nome exato referenciado no XML |
| Ícone quebrado na notificação | `ic_nexus_notif.png` ausente | Criar PNG 24x24 branco com fundo transparente em `res/drawable/` 
