# NEXUS — Setup de Desenvolvimento

## Visão Geral

Este documento descreve o ambiente e passos para rodar o projeto **NEXUS** em desenvolvimento (Windows + Expo). Ele reúne pré-requisitos, instalação de dependências, configuração de variáveis de ambiente e passos rápidos para iniciar o app no celular ou emulador.

> Resumo: React Native + Expo (SDK 51+), TypeScript, Anthropic Claude como IA principal, Supabase como backend.

---

## Pré-requisitos

- Windows 10/11 (64-bit)
- Node.js 20 LTS
- Git
- VS Code (ou editor de sua preferência)
- Conta Anthropic (Claude)
- Conta Supabase
- Celular Android com Expo Go **ou** emulador Android/iOS

Verifique versões:

```powershell
node -v
npm -v
git --version
```

---

## Instalação rápida de ferramentas

1. Instale Node.js LTS (recomendado via instalador em https://nodejs.org).
2. Abra PowerShell (como Administrador) e instale as CLIs:

```powershell
npm install -g expo-cli
npm install -g eas-cli
```

3. Verifique:

```powershell
expo --version
eas --version
```

---

## Clonar e preparar o projeto

```powershell
# clonar
git clone <repo-url>
cd nexus

# instalar dependências
npm install

# instalar pacotes nativos compatíveis com o SDK
npx expo install expo-router expo-constants expo-status-bar
npx expo install expo-notifications expo-device expo-av expo-file-system

# pacotes JS
npm install @anthropic-ai/sdk @supabase/supabase-js zustand date-fns react-native-reanimated
```

---

## Variáveis de ambiente

Crie `.env.local` na raiz (NUNCA commite este arquivo):

```env
# Anthropic
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-...

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# (opcional) OpenAI se usar fallback
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

Adicione `.env.local` ao `.gitignore`:

```powershell
echo .env.local >> .gitignore
```

---

## Rodando o app

```powershell
# iniciar servidor expo
npx expo start

# opções no terminal do Expo
# a -> abrir em emulador Android
# i -> abrir em simulador iOS (macOS somente)
# QR -> escanear com Expo Go

# alternativa para redes restritas
npx expo start --tunnel
```

---

## Teste rápido da tela principal

Substitua temporariamente `app/(tabs)/index.tsx` com um componente simples para validar o ambiente (já incluso no guia). Rode `npx expo start` e abra no celular.

---

## Banco (Supabase) — Schema MVP

Use o SQL no painel do Supabase para criar as tabelas principais (usuários, tarefas, conversas, gatilhos). O esquema recomendado está no diretório `docs/` ou na seção de arquitetura do projeto.

---

## Segurança das chaves (importante)

- Nunca exponha chaves secretas no bundle do app. Não use `dangerouslyAllowBrowser: true` em produção.
- Recomendo criar um proxy (Edge Function ou serverless) que mantenha a chave da Anthropic no servidor e ofereça endpoints autenticados que seu app consome.

---

## Recursos úteis

- Expo docs: https://docs.expo.dev
- Supabase docs: https://supabase.com/docs
- Anthropic docs: https://console.anthropic.com/docs

---

## Próximos passos recomendados

1. Proteger a chave Anthropic com proxy/serverless
2. Adicionar persistência local (`zustand` + `expo-secure-store`)
3. Integrar salvamento/carregamento com Supabase nas stores
4. Implementar Floating Overlay (Android) — foreground service

---

Se quiser, eu gero também um arquivo `.env.example`, scripts de npm úteis e um checklist automatizado para configurar a máquina (PowerShell script).
