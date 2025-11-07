# 🎬 Sistema de Controle Apresentador/Operador

## 📋 Visão Geral

Sistema totalmente reorganizado onde:
- **Apresentador**: Tem painel de configurações visual (botão) para ajustar suas preferências
- **Operador**: Tem comandos de teclado rápidos para controlar o apresentador em tempo real
- **Sincronização**: Todas as alterações são sincronizadas via WebSocket entre operador e apresentador

---

## 👨‍💼 APRESENTADOR

### Botão de Configurações
O apresentador tem um **botão "Config"** no canto superior direito que abre um painel completo com:

#### Configurações Disponíveis:
1. **Tamanho da Fonte**: 16px - 48px (slider)
2. **Espaçamento**: 1.2 - 2.5 (slider)
3. **Família da Fonte**: Sans-serif, Serif, Monospace
4. **Auto-scroll**: Ativar/Desativar
5. **Velocidade do Scroll**: 0.5x - 2.0x (quando auto-scroll ativo)
6. **Preview**: Visualização em tempo real das mudanças

### Atalhos de Teclado (Apresentador):
| Tecla | Função |
|-------|--------|
| `F` | Toggle Fullscreen |
| `S` | Toggle Script (Mostrar/Ocultar) |
| `A` | Toggle Auto-scroll |
| `H` | Ocultar/Mostrar Interface |

### Botões Visuais:
- **Script/Simplificado**: Toggle de visualização de scripts
- **Config**: Abre painel de configurações
- **Sair**: Volta para lista de projetos

---

## 🎛️ OPERADOR

### Painel Visual de Controle
O operador tem um botão **"Controlar Apresentador"** que abre um painel lateral completo com TODAS as configurações do apresentador (igual ao painel do apresentador).

### Comandos de Teclado Rápidos (Operador):
| Tecla | Função | Descrição |
|-------|--------|-----------|
| `Space` / `P` | Play/Pause | Iniciar/pausar transmissão |
| `N` / `→` | Próximo | Avançar para próximo item |
| `Ctrl+S` | Stop | Parar e resetar transmissão |
| `S` | **Toggle Script** | Mostrar/ocultar script do apresentador |
| `A` | **Toggle Auto-scroll** | Ativar/desativar auto-scroll do apresentador |
| `+` / `=` | **Aumentar Fonte** | Aumenta fonte do apresentador (+2px) |
| `-` / `_` | **Diminuir Fonte** | Diminui fonte do apresentador (-2px) |
| `V` | **+Velocidade** | Aumenta velocidade do scroll (+0.1x) |
| `B` | **-Velocidade** | Diminui velocidade do scroll (-0.1x) |
| `Ctrl+F` | Adicionar Pasta | Cria nova pasta no rundown |

### Indicadores Visuais:
- **Atalhos visíveis**: Barra superior mostra comandos principais
- **Toast notifications**: Feedback visual de cada comando executado
- **Status de sincronização**: Indicador de conexão WebSocket

---

## 🔄 Sincronização em Tempo Real

### Como Funciona:
1. **Operador** altera uma configuração (teclado ou painel visual)
2. **Context** (`PresenterConfigContext`) atualiza o estado local
3. **WebSocket** envia a mudança para o backend
4. **Backend** transmite para todos os clientes conectados
5. **Apresentador** recebe e aplica a mudança instantaneamente

### Arquitetura:
```
Operador/Apresentador
    ↓
PresenterConfigContext
    ↓
Socket.emit('presenter_config_update')
    ↓
Backend (websocket_server.py)
    ↓
Socket.broadcast('presenter_config_update')
    ↓
Todos os Apresentadores/Operadores
```

---

## 🎯 Casos de Uso

### Cenário 1: Ajuste Rápido Durante Transmissão
**Situação**: Apresentador avisa que a fonte está pequena
**Solução**: Operador pressiona `+` algumas vezes (2 segundos)

### Cenário 2: Ativar Teleprompter
**Situação**: Apresentador precisa ler um script longo
**Solução**: Operador pressiona `A` para ativar auto-scroll

### Cenário 3: Ocultar Script
**Situação**: Parte do programa sem script
**Solução**: Operador pressiona `S` para ocultar script

### Cenário 4: Ajuste Fino de Velocidade
**Situação**: Auto-scroll está muito rápido
**Solução**: Operador pressiona `B` várias vezes para reduzir velocidade

### Cenário 5: Apresentador Prefere Configurar
**Situação**: Apresentador quer ajustar suas preferências
**Solução**: Apresentador clica no botão "Config" e faz ajustes pessoais

---

## 🛠️ Arquivos Modificados

### Frontend:
1. **`src/contexts/PresenterConfigContext.jsx`** (NOVO)
   - Context para gerenciar configurações sincronizadas

2. **`src/components/views/PresenterView.jsx`**
   - Mantém painel de configurações com botão visual
   - Usa configurações do context
   - Mantém atalhos de teclado próprios

3. **`src/components/views/OperatorView.jsx`**
   - Adiciona painel de controle do apresentador
   - Adiciona comandos de teclado para controlar apresentador
   - Indicadores visuais de atalhos

4. **`src/main.jsx`**
   - Adiciona `PresenterConfigProvider` na árvore de contexts

### Backend:
5. **`backend/websocket_server.py`**
   - Adiciona handler `presenter_config_update`
   - Transmite configurações para todos os clientes

---

## ✅ Vantagens do Sistema

### Para o Operador:
✅ Controle total e rápido via teclado
✅ Não precisa navegar em menus durante transmissão
✅ Feedback visual imediato de cada ação
✅ Painel visual disponível quando necessário

### Para o Apresentador:
✅ Mantém autonomia para configurar suas preferências
✅ Interface familiar com botão de configurações
✅ Pode ajustar durante ensaios
✅ Recebe atualizações do operador em tempo real

### Para a Produção:
✅ Flexibilidade total
✅ Dois pontos de controle (operador E apresentador)
✅ Sincronização automática
✅ Sem necessidade de comunicação verbal constante

---

## 🚀 Como Usar

### Início da Transmissão:
1. **Apresentador** abre a tela do apresentador (link copiado pelo operador)
2. **Apresentador** ajusta configurações pessoais (botão Config)
3. **Operador** inicia transmissão (Space)
4. **Operador** faz ajustes rápidos conforme necessário (teclas S, A, +, -, etc)

### Durante a Transmissão:
- **Operador** monitora e ajusta apresentador via teclado
- **Apresentador** foca na apresentação (TV de referência)
- Mudanças são sincronizadas instantaneamente

---

## 📊 Estados Sincronizados

Todas as configurações abaixo são sincronizadas em tempo real:

| Configuração | Valor Padrão | Range/Opções |
|--------------|--------------|--------------|
| `fontSize` | 24px | 16-48px |
| `lineHeight` | 1.8 | 1.2-2.5 |
| `fontFamily` | 'sans-serif' | sans-serif, serif, mono |
| `backgroundColor` | '#000000' | Cor hex |
| `textColor` | '#FFFFFF' | Cor hex |
| `showScript` | true | true/false |
| `autoScroll` | false | true/false |
| `scrollSpeed` | 1.0 | 0.5-2.0 |

---

## 🎓 Guia de Comandos Rápidos

### Memorize Estes Atalhos (Operador):
```
S = Script (Show/hide)
A = Auto-scroll
+ = Mais fonte
- = Menos fonte
V = Velocidade+ (Velocity)
B = Baixar velocidade (Bottom)
```

**Dica**: Todos os comandos mostram toast com feedback visual!

---

## 🔧 Desenvolvimento

### Adicionar Nova Configuração:
1. Adicionar propriedade em `PresenterConfigContext.jsx`
2. Adicionar controle no painel de `PresenterView.jsx`
3. Adicionar controle no painel de `OperatorView.jsx`
4. (Opcional) Adicionar atalho de teclado em `OperatorView.jsx`

---

## ✨ Resumo

**Apresentador**: Botão de Config + Atalhos próprios  
**Operador**: Comandos de teclado rápidos + Painel visual opcional  
**Sincronização**: WebSocket em tempo real  
**Resultado**: Sistema flexível, rápido e profissional! 🎉

