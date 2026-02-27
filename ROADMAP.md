# NEXUS — Roadmap de Desenvolvimento

> Documento de referência para todos os avanços a partir de 27/02/2026.
> Atualizar este arquivo conforme cada item for concluído.

---

## Status Atual do Projeto

**Versão:** MVP em desenvolvimento  
**Branch:** `main`  
**Expo Project ID:** `7ad624e1-2ca1-49c3-98e7-2ff7531cfbf4`  
**Stack:** React Native + Expo SDK 51 + TypeScript + Claude API + Supabase + Zustand

---

## ✅ Implementado e Funcional

### Camada 1 — Interface

| Componente | Arquivo | Status |
|------------|---------|--------|
| Orb animada | `components/Orb/Orb.tsx` | ✅ Completo |
| TaskCard interativo | `components/TaskCard/TaskCard.tsx` | ✅ Completo |
| ChatBubble | `components/ChatBubble/ChatBubble.tsx` | ✅ Completo |
| Tela Chat | `app/(tabs)/index.tsx` | ✅ Completo |
| Tela Hoje | `app/(tabs)/today.tsx` | ✅ Completo |
| Tela Conquistas | `app/(tabs)/wins.tsx` | ✅ Completo |
| Onboarding (4 perguntas) | `app/onboarding.tsx` | ✅ Completo |
| Layout raiz + tabs | `app/_layout.tsx`, `app/(tabs)/_layout.tsx` | ✅ Completo |

### Camada 2 — Motor de Contexto

| Componente | Arquivo | Status |
|------------|---------|--------|
| Perfil Vivo (store) | `store/userStore.ts` | ✅ Completo (sem persistência) |
| Tarefas + Mensagens | `store/taskStore.ts` | ✅ Completo (sem persistência) |
| Motor de Energia | `hooks/useEnergy.ts` | ✅ Completo |

### Camada 3 — IA

| Componente | Arquivo | Status |
|------------|---------|--------|
| Integração Claude | `services/claude.ts` | ✅ Funcional (API key exposta) |
| System Prompt | `constants/prompts.ts` | ✅ Completo |
| STT (voz → texto) | `hooks/useVoice.ts` + `services/transcricao.ts` | ✅ Implementado com Claude |
| TTS (texto → voz) | `hooks/useVoice.ts` (expo-speech) | ✅ Completo |

### Camada 4 — Dados

| Componente | Arquivo | Status |
|------------|---------|--------|
| Cliente Supabase | `services/supabase.ts` | ✅ Configurado (não integrado) |
| Notificações | `services/notifications.ts` | ✅ Configurado (não agendado) |

---

## 🔴 Pendente — Prioridade CRÍTICA

### 1. Proteger API Key (Proxy Serverless)

**Problema:** `dangerouslyAllowBrowser: true` + `EXPO_PUBLIC_ANTHROPIC_API_KEY` expõe a chave no bundle JavaScript. Qualquer pessoa pode extrair.

**Solução:** Criar Edge Function no Supabase que:
- Recebe requests do app (autenticado via Supabase Auth)
- Chama Claude API com a chave secreta
- Retorna resposta ao app

**Arquivos a criar:**
```
supabase/
└── functions/
    └── claude-proxy/
        └── index.ts
```

**Arquivos a modificar:**
- `services/claude.ts` — trocar chamada direta por fetch para Edge Function
- `services/transcricao.ts` — idem

**Variáveis de ambiente (Supabase Dashboard):**
```
ANTHROPIC_API_KEY=sk-ant-api03-...  # Secreto, não EXPO_PUBLIC
```

**Checklist:**
- [ ] Criar projeto Supabase (se não existir)
- [ ] Instalar Supabase CLI: `npm install -g supabase`
- [ ] Criar Edge Function `claude-proxy`
- [ ] Deploy: `supabase functions deploy claude-proxy`
- [ ] Atualizar `services/claude.ts` para usar endpoint
- [ ] Atualizar `services/transcricao.ts` para usar endpoint
- [ ] Remover `EXPO_PUBLIC_ANTHROPIC_API_KEY` do `.env.local`
- [ ] Testar chat e transcrição

---

### 2. Persistência Local (Zustand + SecureStore)

**Problema:** Fechar o app = perder todo histórico, tarefas, perfil e onboarding.

**Solução:** Usar middleware `persist` do Zustand com `expo-secure-store`.

**Arquivos a modificar:**
- `store/userStore.ts`
- `store/taskStore.ts`

**Dependências:**
```bash
npx expo install expo-secure-store
```

**Padrão de código:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (name: string) => await SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => await SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => await SecureStore.deleteItemAsync(name),
};

export const useUserStore = create(
  persist<UserState>(
    (set) => ({ /* ... */ }),
    {
      name: 'nexus-user-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

**Checklist:**
- [ ] Instalar `expo-secure-store`
- [ ] Criar helper `lib/secureStorage.ts`
- [ ] Atualizar `userStore.ts` com persist
- [ ] Atualizar `taskStore.ts` com persist
- [ ] Testar: fechar app, reabrir, dados devem persistir
- [ ] Testar: limpar dados manualmente (função de reset)

---

### 3. Integrar Supabase (Sync com Backend)

**Problema:** Dados vivem só em memória local. Sem backup, sem sync entre dispositivos.

**Solução:** Conectar stores ao Supabase:
- Ao concluir onboarding → salvar perfil no banco
- Ao criar tarefa → salvar no banco
- Ao enviar mensagem → salvar no banco
- Ao abrir app → carregar dados do banco (se logado)

**Fluxo de autenticação (simplificado para MVP):**
1. Onboarding conclui → criar conta anônima ou com email
2. Perfil salvo no Supabase
3. Próximas sessões: carregar perfil do banco

**Arquivos a modificar:**
- `app/onboarding.tsx` — chamar `salvarPerfil` ao finalizar
- `app/_layout.tsx` — carregar perfil ao iniciar (se logado)
- `store/taskStore.ts` — chamar `salvarTarefa` e `salvarMensagem`

**Checklist:**
- [ ] Executar schema SQL no Supabase (tabelas usuarios, tarefas, conversas, gatilhos)
- [ ] Habilitar Row Level Security (RLS) com policies
- [ ] Criar fluxo de auth (anônimo ou email) no onboarding
- [ ] Salvar perfil após onboarding
- [ ] Salvar tarefas ao criar
- [ ] Salvar mensagens ao enviar/receber
- [ ] Carregar dados ao abrir (se sessão ativa)
- [ ] Testar sync em dois dispositivos (opcional MVP)

---

## 🟡 Pendente — Prioridade ALTA

### 4. Agendar Notificações Após Onboarding

**Problema:** `agendarGatilhoDiario` existe mas nunca é chamado.

**Solução:** Ao finalizar onboarding, agendar notificações baseadas no `pico_energia` selecionado.

**Arquivo a modificar:**
- `app/onboarding.tsx`

**Código a adicionar:**
```typescript
import { solicitarPermissao, agendarGatilhoDiario, horariosParaPerfil } from '../services/notifications';

async function finalizarOnboarding(r: Record<string, string>) {
  // Salvar perfil
  setPerfil({ pico_energia: r.energia, ... });
  
  // Agendar notificações
  const permissao = await solicitarPermissao();
  if (permissao && r.notificacoes !== 'manual') {
    const horarios = horariosParaPerfil(r.energia);
    for (const h of horarios) {
      await agendarGatilhoDiario(h);
    }
  }
  
  completar();
  router.replace('/(tabs)');
}
```

**Checklist:**
- [ ] Solicitar permissão de notificação no onboarding
- [ ] Agendar gatilhos baseados no perfil
- [ ] Testar: receber notificação no horário configurado
- [ ] Implementar régua anti-spam (máx 3/dia)

---

### 5. Tela de Celebração (S6)

**Problema:** Não existe componente/tela de celebração quando o usuário conclui uma etapa.

**Solução:** Criar `components/Celebration/Celebration.tsx` e integrar ao fluxo de `concluirEtapa`.

**Arquivos a criar:**
```
components/
└── Celebration/
    └── Celebration.tsx
```

**Comportamento:**
- Orb muda de roxo para verde
- Mensagem referencia o feito real (ex: "Você pesquisou os dados em 12 min")
- Confetti proporcional ao esforço
- Duração máxima: 4 segundos
- Botão "Próxima etapa" para aproveitar momentum

**Checklist:**
- [ ] Criar componente `Celebration.tsx`
- [ ] Adicionar modal/overlay no Chat ou Today
- [ ] Disparar ao concluir etapa
- [ ] Incrementar streak ao concluir tarefa completa
- [ ] Testar animações e timing

---

## 🟢 Pendente — Prioridade MÉDIA (V2)

### 6. Floating Overlay Android

**Problema:** Feature documentada no guia mas requer código Kotlin e `expo-dev-client`.

**Solução:** Seguir seção `OVERLAYANDROID` do guia.md.

**Pré-requisitos:**
- `npx expo install expo-dev-client`
- `npx expo prebuild --platform android`
- Android Studio para build

**Checklist:**
- [ ] Instalar expo-dev-client
- [ ] Rodar prebuild
- [ ] Copiar arquivos Kotlin para `android/app/src/main/java/com/nexus/tdah/`
- [ ] Copiar layouts XML para `android/app/src/main/res/layout/`
- [ ] Copiar drawables para `android/app/src/main/res/drawable/`
- [ ] Adicionar config plugin ao `app.json`
- [ ] Registrar package no `MainApplication.kt`
- [ ] Build com `npx expo run:android`
- [ ] Testar no device físico

---

### 7. Tela de Login/Cadastro

**Problema:** Auth Supabase existe mas sem UI.

**Solução:** Criar tela `app/login.tsx` para email/senha ou auth anônimo.

**Checklist:**
- [ ] Criar tela `login.tsx`
- [ ] Integrar com Supabase Auth
- [ ] Permitir login anônimo para onboarding sem fricção
- [ ] Permitir upgrade para conta com email depois

---

### 8. iOS — Widget + Live Activity

**Problema:** Equivalente iOS do Floating Overlay não implementado.

**Solução:** Usar WidgetKit + ActivityKit (requer código Swift nativo).

**Status:** Deixar para V2.

---

## Comandos Úteis

```bash
# Iniciar desenvolvimento
npx expo start --tunnel

# Limpar cache
npx expo start --clear

# Build Android (dev client)
npx expo run:android

# Deploy Edge Function
supabase functions deploy claude-proxy

# Verificar erros TypeScript
npx tsc --noEmit
```

---

## Variáveis de Ambiente

### `.env.local` (cliente — NÃO commitar)
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# (remover após implementar proxy)
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

### Supabase Dashboard (servidor — secreto)
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 27/02/2026 | Criação do roadmap |
| 27/02/2026 | STT implementado com Claude |
| 27/02/2026 | Orb interativo (toggle voz) |
| 27/02/2026 | Sync visual Orb-estado de voz |

---

## Critério de Sucesso MVP

> Se o usuário abrir o app no Dia 3 porque o NEXUS foi até ele com uma mensagem inteligente — a batalha principal de retenção foi ganha.

**Métricas:**
- [ ] Onboarding em < 5 minutos
- [ ] Primeira tarefa criada na sessão 1
- [ ] Notificação proativa recebida no horário certo
- [ ] Usuário retorna no dia 3
