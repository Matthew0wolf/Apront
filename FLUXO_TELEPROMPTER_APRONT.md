# 📺 Fluxo Completo - Sistema de Teleprompter/Script - Apront
## Do Planejamento ao Ao Vivo

---

## 🎯 Visão Geral do Fluxo

```
PLANEJAMENTO          EDIÇÃO            TREINO           AO VIVO
    ↓                   ↓                 ↓                ↓
┌─────────┐      ┌──────────┐      ┌─────────┐     ┌──────────┐
│ Operador│  →   │  Editor  │  →   │  Modo   │  →  │  Modo    │
│  cria   │      │  Script  │      │ Ensaio  │     │ Ao Vivo  │
│ rundown │      │          │      │         │     │          │
└─────────┘      └──────────┘      └─────────┘     └──────────┘
                      ↑                                   ↑
                      │                                   │
                 Apresentador                        Apresentador
                 também edita                        lê o script
```

---

## 📋 FLUXO DETALHADO

### **FASE 1: CRIAÇÃO DO RUNDOWN** (Operador)

```
┌────────────────────────────────────────────────────────────┐
│  ProjectsView - Criar Novo Rundown                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Nome: Programa Tech News - Episódio 45                   │
│  Tipo: Programa de TV                                     │
│  Data: 15/10/2024                                         │
│                                                            │
│  [Criar Rundown]                                          │
└────────────────────────────────────────────────────────────┘
                         ↓
            Rundown criado com pastas/itens
```

---

### **FASE 2: ADICIONAR ITENS** (Operador)

```
┌────────────────────────────────────────────────────────────┐
│  OperatorView - Timeline do Rundown                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📁 Bloco 1 - Abertura                                    │
│     └─ 🎬 Abertura do Programa (2:30)                     │
│     └─ 🎤 Apresentação do Tema (1:00)                     │
│                                                            │
│  📁 Bloco 2 - Conteúdo Principal                          │
│     └─ 📊 Notícia 1: IA (5:00)                           │
│     └─ 📊 Notícia 2: Startups (4:00)                     │
│                                                            │
│  [+ Nova Pasta]  [+ Novo Item]                           │
└────────────────────────────────────────────────────────────┘
```

---

### **FASE 3: EDITAR SCRIPT DO ITEM** 

#### **Quem Pode Editar?**
- ✅ **Operador**: Sempre pode editar (é quem monta o rundown)
- ✅ **Apresentador**: Pode editar SEU próprio script (personalizar)
- ✅ **Ambos**: Trabalham colaborativamente

#### **Onde Editar?**

**OPÇÃO A: Operador Edita no OperatorView**

```
┌────────────────────────────────────────────────────────────────────┐
│  OperatorView - Item: "Abertura do Programa"                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Item da Timeline:                                                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  🎬  Abertura do Programa            [📝 Editar Script]  │    │
│  │  2:30  ▓▓▓▓▓▓░░░░░░                  [✏️] [🗑️]          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Ao clicar em [📝 Editar Script]:                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DIALOG: Editor de Script                                │    │
│  │  ────────────────────────────────────────────────────    │    │
│  │                                                           │    │
│  │  📝 Script Completo (Apresentador lerá):                │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │ Olá e sejam muito bem-vindos ao **Tech News**!│     │    │
│  │  │                                                 │     │    │
│  │  │ [PAUSA]                                        │     │    │
│  │  │                                                 │     │    │
│  │  │ Eu sou __João Silva__ e hoje vamos falar      │     │    │
│  │  │ sobre as últimas novidades do mundo da        │     │    │
│  │  │ tecnologia.                                    │     │    │
│  │  │                                                 │     │    │
│  │  │ [ÊNFASE] Preparamos conteúdo exclusivo!       │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │                                                           │    │
│  │  📋 Pontos-Chave (Talking Points):                      │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │  1. Dar boas-vindas aos espectadores          │     │    │
│  │  │  2. Apresentar-se                             │     │    │
│  │  │  3. Antecipar conteúdo do programa            │     │    │
│  │  │  [+ Adicionar Ponto]                          │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │                                                           │    │
│  │  📢 Guia de Pronúncia:                                   │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │  Tech News → TECH NIUS                        │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │                                                           │    │
│  │  📝 Notas Privadas do Apresentador:                     │    │
│  │  ┌────────────────────────────────────────────────┐     │    │
│  │  │  - Olhar para câmera 2                        │     │    │
│  │  │  - Mencionar patrocinador XYZ                 │     │    │
│  │  │  - Falar com energia!                         │     │    │
│  │  └────────────────────────────────────────────────┘     │    │
│  │                                                           │    │
│  │  [✨ Gerar com IA] [👁️ Preview] [💾 Salvar] [✖ Fechar]  │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**OPÇÃO B: Apresentador Edita em Tela Própria**

```
┌────────────────────────────────────────────────────────────────────┐
│  Menu do Apresentador                                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [🎬 Ir para Apresentação]  [📝 Editar Meus Scripts]              │
│                                                                    │
│  Ao clicar em [📝 Editar Meus Scripts]:                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  TELA: Meus Scripts                                      │    │
│  │  ────────────────────────────────────────────────────    │    │
│  │                                                           │    │
│  │  Rundown: Tech News Ep. 45                               │    │
│  │                                                           │    │
│  │  📁 Bloco 1 - Abertura                                   │    │
│  │                                                           │    │
│  │     🎬 Abertura do Programa (2:30)    [✏️ Editar]        │    │
│  │     🎤 Apresentação do Tema (1:00)     [✏️ Editar]        │    │
│  │                                                           │    │
│  │  📁 Bloco 2 - Conteúdo Principal                         │    │
│  │                                                           │    │
│  │     📊 Notícia 1: IA (5:00)           [✏️ Editar]        │    │
│  │     📊 Notícia 2: Startups (4:00)     [✏️ Editar]        │    │
│  │                                                           │    │
│  │  ──────────────────────────────────────────────          │    │
│  │                                                           │    │
│  │  Ao clicar [✏️ Editar], abre o mesmo dialog do operador │    │
│  │  mas com foco nas NOTAS PRIVADAS                        │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

### **FASE 4: MODO TREINO/ENSAIO** (Apresentador)

#### **Acesso ao Modo Treino**

```
┌────────────────────────────────────────────────────────────────────┐
│  Apresentador - Seleção de Modo                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Rundown: Tech News Ep. 45                                        │
│                                                                    │
│  Escolha o modo:                                                  │
│                                                                    │
│  ┌────────────────────────┐    ┌────────────────────────┐        │
│  │   🎭 MODO TREINO       │    │   🔴 MODO AO VIVO      │        │
│  │                        │    │                        │        │
│  │   Pratique seu script  │    │   Transmissão real     │        │
│  │   sem pressão          │    │   com sincronização    │        │
│  │                        │    │                        │        │
│  │   • Gravar ensaios     │    │   • Timer oficial      │        │
│  │   • Ver análise        │    │   • Chat com operador  │        │
│  │   • Ajustar script     │    │   • Alertas ativados   │        │
│  │                        │    │                        │        │
│  │   [Iniciar Treino]     │    │   [Ir Ao Vivo]         │        │
│  └────────────────────────┘    └────────────────────────┘        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

#### **Tela de Treino**

```
┌────────────────────────────────────────────────────────────────────┐
│  🎭 MODO TREINO - Abertura do Programa                    [✖]     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [📖 Script] [📋 Pontos] [⚙️ Config]        ⏱️ 00:45 / 02:30     │
│                                                                    │
├───────────────────────────────┬────────────────────────────────────┤
│                               │  📊 ANÁLISE EM TEMPO REAL         │
│  ABERTURA DO PROGRAMA         │                                   │
│                               │  Tempo Planejado:    02:30        │
│  Olá e sejam muito           │  Tempo Atual:        00:45        │
│  bem-vindos ao **Tech News**!│  Diferença:          -01:45       │
│                               │                                   │
│  [PAUSA]                     │  ───────────────────────          │
│                               │                                   │
│  Eu sou __João Silva__ e     │  Ritmo:   [●●●○○]                │
│  hoje vamos falar sobre...   │  ✅ Boa velocidade                │
│                               │                                   │
│  [Scroll manual ou auto]     │  Problemas detectados:            │
│                               │  • Nenhum até agora               │
│                               │                                   │
│  ↓ (rolando...)              │  💡 DICAS:                        │
│                               │  • Continue nesse ritmo           │
│                               │  • Respire nas pausas             │
│                               │                                   │
├───────────────────────────────┼────────────────────────────────────┤
│  [⏸️ Pausar] [⏹️ Parar] [⏭️ Próximo]    [⏺️ Gravar Ensaio]       │
└────────────────────────────────────────────────────────────────────┘
```

#### **Após o Treino - Análise**

```
┌────────────────────────────────────────────────────────────────────┐
│  📊 Análise do Ensaio #3                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Item: Abertura do Programa                                       │
│  Data: 15/10/2024 14:30                                           │
│                                                                    │
│  ⏱️ TIMING:                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Tempo Planejado:    02:30                               │    │
│  │  Tempo Real:         02:45                               │    │
│  │  Diferença:          +15s  ⚠️                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  📈 EVOLUÇÃO:                                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Ensaio #1:  03:10  (❌ 40s over)                        │    │
│  │  Ensaio #2:  02:20  (✅ 10s under)                       │    │
│  │  Ensaio #3:  02:45  (⚠️ 15s over)                        │    │
│  │                                                           │    │
│  │  Tendência: Melhorando! 📈                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ⚠️ PONTOS DE ATENÇÃO:                                            │
│  • Você acelerou na parte final                                   │
│  • Pausas muito curtas (respirar mais)                            │
│  • Seção "Tech News" precisa de ênfase                           │
│                                                                    │
│  ✅ PONTOS POSITIVOS:                                             │
│  • Boa dicção geral                                               │
│  • Energia adequada no início                                     │
│  • Poucas hesitações                                              │
│                                                                    │
│  💡 SUGESTÕES:                                                     │
│  1. Pratique a parte final isoladamente                           │
│  2. Conte 2 segundos nas [PAUSA]                                 │
│  3. Destaque mais as palavras com __sublinhado__                 │
│                                                                    │
│  [🔄 Praticar Novamente]  [📝 Ajustar Script]  [✅ Está Bom]     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### **FASE 5: MODO AO VIVO** (Apresentador)

#### **Interface Principal - Teleprompter**

```
┌────────────────────────────────────────────────────────────────────┐
│  🔴 AO VIVO                                     ⏱️ 00:45 / 02:30   │
├────────────────────────────────────────────────────────────────────┤
│  [⏸️] [A+] [A-] [📝] [💬]                       [Sincronizado ✓]  │
├───────────────────────────────┬────────────────────────────────────┤
│                               │  📝 SUAS NOTAS                    │
│                               │                                   │
│  ABERTURA DO PROGRAMA         │  ✓ Olhar câmera 2                │
│                               │  ✓ Mencionar XYZ                 │
│  Olá e sejam muito           │  ✓ Energia!                      │
│  bem-vindos ao Tech News!    │                                   │
│                               │  ⚠️ Lembrar sorteio no fim       │
│  [PAUSA]                     │                                   │
│                               │  ───────────────                 │
│  Eu sou João Silva e hoje    │                                   │
│  vamos falar sobre as        │  ⏭️ PRÓXIMO:                      │
│  últimas novidades do        │  Apresentação do Tema            │
│  mundo da tecnologia.        │  ⏱️ 1:00                         │
│                               │                                   │
│  [ÊNFASE] Preparamos         │  💬 CHAT OPERADOR:               │
│  conteúdo exclusivo!         │  ────────────────                │
│                               │  Operador: Tudo certo! 👍        │
│  ▼ (auto-scroll ativo)       │  Você: [Digitar...]              │
│                               │                                   │
│                               │  Quick: [✋+Tempo] [✅Ok]         │
│                               │                                   │
├───────────────────────────────┴────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░  65% concluído                    │
└────────────────────────────────────────────────────────────────────┘
```

**Recursos Ativos no Modo Ao Vivo:**
- ✅ Auto-scroll sincronizado com timer
- ✅ Alertas sonoros (1min, 30s, 10s)
- ✅ Chat com operador
- ✅ Notas privadas visíveis
- ✅ Preview do próximo item
- ✅ Sincronização WebSocket
- ✅ Comandos do operador ("acelera", "+2min")

---

## 🗂️ ESTRUTURA DE BANCO DE DADOS

```sql
-- Tabela items (já existe, adicionar campos)
ALTER TABLE items ADD COLUMN script TEXT;
ALTER TABLE items ADD COLUMN talking_points TEXT; -- JSON array
ALTER TABLE items ADD COLUMN pronunciation_guide TEXT;
ALTER TABLE items ADD COLUMN presenter_notes TEXT;

-- Nova tabela para ensaios
CREATE TABLE rehearsals (
    id INTEGER PRIMARY KEY,
    item_id INTEGER,
    user_id INTEGER,
    duration INTEGER, -- segundos
    planned_duration INTEGER,
    difference INTEGER, -- diferença em segundos
    recorded_at TIMESTAMP,
    notes TEXT, -- notas sobre o ensaio
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Nova tabela para mensagens de chat
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY,
    rundown_id INTEGER,
    from_user_id INTEGER,
    to_user_id INTEGER,
    message TEXT,
    message_type VARCHAR(20), -- 'text', 'command', 'quick_reply'
    sent_at TIMESTAMP,
    FOREIGN KEY (rundown_id) REFERENCES rundowns(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── PresenterView.jsx              [EXISTENTE - modificar]
│   ├── OperatorView.jsx                [EXISTENTE - modificar]
│   │
│   ├── Teleprompter/                   [NOVO]
│   │   ├── TeleprompterView.jsx       # Tela principal teleprompter
│   │   ├── TeleprompterControls.jsx   # Controles (play, fonte, etc)
│   │   ├── ScriptDisplay.jsx          # Exibe script formatado
│   │   ├── AutoScroller.jsx           # Lógica de auto-scroll
│   │   └── TeleprompterSettings.jsx   # Configurações
│   │
│   ├── ScriptEditor/                   [NOVO]
│   │   ├── ScriptEditorDialog.jsx     # Dialog principal
│   │   ├── ScriptTextArea.jsx         # Editor de texto
│   │   ├── TalkingPointsEditor.jsx    # Editor de pontos-chave
│   │   ├── NotesEditor.jsx            # Editor de notas
│   │   └── ScriptPreview.jsx          # Preview do script
│   │
│   ├── PracticeMode/                   [NOVO]
│   │   ├── PracticeModeView.jsx       # Tela de treino
│   │   ├── PracticeAnalysis.jsx       # Análise de ensaio
│   │   ├── PracticeHistory.jsx        # Histórico de ensaios
│   │   └── PracticeRecorder.jsx       # Gravação
│   │
│   ├── Chat/                           [NOVO]
│   │   ├── LiveChat.jsx               # Chat principal
│   │   ├── ChatMessage.jsx            # Componente de mensagem
│   │   ├── QuickReplies.jsx           # Respostas rápidas
│   │   └── CommandButtons.jsx         # Comandos do operador
│   │
│   └── ModeSelector/                   [NOVO]
│       └── ModeSelectorView.jsx       # Escolher treino/ao vivo
│
├── lib/
│   ├── alertSounds.js                  [NOVO]
│   ├── autoScroll.js                   [NOVO]
│   ├── scriptFormatter.js              [NOVO]
│   └── rehearsalAnalyzer.js            [NOVO]
│
└── contexts/
    ├── TeleprompterContext.jsx         [NOVO]
    └── ChatContext.jsx                 [NOVO]

backend/
├── routes/
│   ├── scripts.py                      [NOVO]
│   ├── rehearsals.py                   [NOVO]
│   └── chat.py                         [NOVO]
│
└── models.py                           [MODIFICAR - add campos]
```

---

## 🔄 FLUXO DE DADOS (API)

### **1. Salvar Script**
```javascript
// Frontend
const saveScript = async (itemId, scriptData) => {
  await fetch(`/api/items/${itemId}/script`, {
    method: 'PUT',
    body: JSON.stringify({
      script: scriptData.script,
      talking_points: scriptData.talkingPoints,
      pronunciation_guide: scriptData.pronunciationGuide,
      presenter_notes: scriptData.presenterNotes
    })
  });
};
```

```python
# Backend - routes/scripts.py
@scripts_bp.route('/items/<int:item_id>/script', methods=['PUT'])
@jwt_required()
def update_item_script(item_id):
    data = request.get_json()
    item = Item.query.get_or_404(item_id)
    
    item.script = data.get('script')
    item.talking_points = json.dumps(data.get('talking_points', []))
    item.pronunciation_guide = data.get('pronunciation_guide')
    item.presenter_notes = data.get('presenter_notes')
    
    db.session.commit()
    
    # Sincronizar via WebSocket
    socketio.emit('script_updated', {
        'item_id': item_id,
        'script': item.script
    }, room=f'rundown_{item.folder.rundown_id}')
    
    return jsonify({'success': True})
```

### **2. Salvar Ensaio**
```javascript
// Frontend
const saveRehearsal = async (itemId, rehearsalData) => {
  await fetch(`/api/rehearsals`, {
    method: 'POST',
    body: JSON.stringify({
      item_id: itemId,
      duration: rehearsalData.duration,
      planned_duration: rehearsalData.plannedDuration,
      notes: rehearsalData.notes
    })
  });
};
```

### **3. Chat em Tempo Real**
```javascript
// Frontend - via WebSocket
socket.emit('chat_message', {
  rundown_id: rundownId,
  to_user_id: userId,
  message: 'Acelera um pouco',
  type: 'command'
});

socket.on('chat_message', (data) => {
  // Mostrar mensagem na interface
  displayChatMessage(data);
});
```

---

## 🎯 IMPLEMENTAÇÃO SUGERIDA (Ordem)

### **SPRINT 1 - Básico (1 semana)**
```
✅ Dia 1-2: Adicionar campos no banco (script, notes, etc)
✅ Dia 3-4: Editor de script básico no OperatorView
✅ Dia 5:   Visualização de script no PresenterView (sem auto-scroll)
```

**Resultado:** Apresentador pode ler scripts estáticos

### **SPRINT 2 - Teleprompter (1 semana)**
```
✅ Dia 1-2: Implementar auto-scroll
✅ Dia 3:   Controles (velocidade, fonte, pause)
✅ Dia 4:   Formatação de texto (negrito, pausas, etc)
✅ Dia 5:   Configurações e polish
```

**Resultado:** Teleprompter profissional funcionando

### **SPRINT 3 - Modo Treino (1 semana)**
```
✅ Dia 1-2: Tela de seleção (treino vs ao vivo)
✅ Dia 3-4: Interface de treino
✅ Dia 5:   Análise básica (tempo, diferença)
```

**Resultado:** Apresentador pode praticar

### **SPRINT 4 - Chat (1 semana)**
```
✅ Dia 1-2: Backend de chat (WebSocket)
✅ Dia 3-4: Interface de chat
✅ Dia 5:   Quick replies e comandos
```

**Resultado:** Comunicação ao vivo funcional

---

## 💡 DECISÕES DE DESIGN

### **1. Quem Edita o Script?**

**RECOMENDAÇÃO:** Ambos (colaborativo)

```
Operador:
✅ Cria estrutura inicial
✅ Define conteúdo base
✅ Adiciona pontos-chave
✅ Guia de pronúncia

Apresentador:
✅ Personaliza texto
✅ Adiciona notas privadas
✅ Ajusta pontos conforme conforto
✅ Pratica e refina
```

### **2. Treino é Obrigatório?**

**RECOMENDAÇÃO:** Não, mas incentivado

```
- Apresentador pode ir direto ao vivo
- Mas ter um badge "Praticado ✓" é legal
- Mostrar número de ensaios no item
- "Este item foi praticado 3 vezes"
```

### **3. Auto-scroll Sempre Ativo?**

**RECOMENDAÇÃO:** Configurável

```
- Modo Manual: Scroll com mouse/teclado
- Modo Auto: Sincronizado com timer
- Modo Híbrido: Auto mas permite ajuste manual
- Salvar preferência do apresentador
```

### **4. Múltiplos Apresentadores?**

**RECOMENDAÇÃO:** Sim, suportar

```
- Cada item pode ter apresentador designado
- Scripts diferentes para cada apresentador
- Notas privadas por apresentador
- Em rundowns com múltiplos apresentadores
```

---

## 📊 EXEMPLO COMPLETO DE DADOS

```json
{
  "item": {
    "id": 123,
    "title": "Abertura do Programa",
    "duration": 150,
    "description": "Abertura oficial do programa",
    
    "script": "Olá e sejam muito bem-vindos ao **Tech News**!\n\n[PAUSA]\n\nEu sou __João Silva__ e hoje vamos falar sobre as últimas novidades do mundo da tecnologia.\n\n[ÊNFASE] Preparamos conteúdo exclusivo para você!",
    
    "talking_points": [
      "Dar boas-vindas aos espectadores",
      "Apresentar-se",
      "Antecipar conteúdo do programa",
      "Mencionar patrocinador"
    ],
    
    "pronunciation_guide": "Tech News → TECH NIUS\nJoão Silva → JOU-ow SIL-vah",
    
    "presenter_notes": "- Olhar para câmera 2\n- Mencionar patrocinador XYZ\n- Falar com energia!\n- Lembrar do sorteio no final",
    
    "rehearsals": [
      {
        "id": 1,
        "duration": 190,
        "difference": 40,
        "recorded_at": "2024-10-15T14:00:00",
        "notes": "Muito rápido no final"
      },
      {
        "id": 2,
        "duration": 140,
        "difference": -10,
        "recorded_at": "2024-10-15T14:15:00",
        "notes": "Melhorou! Quase perfeito"
      }
    ]
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Backend**
```
□ Adicionar campos no modelo Item
□ Criar migration
□ Criar rota PUT /items/:id/script
□ Criar rota POST /rehearsals
□ Criar rota GET /rehearsals/:itemId
□ Implementar chat via WebSocket
□ Criar modelo Rehearsal
□ Criar modelo ChatMessage
```

### **Frontend - Editor**
```
□ ScriptEditorDialog component
□ Textarea com formatação
□ Editor de talking points
□ Editor de notas privadas
□ Preview do script
□ Integração com IA (opcional)
```

### **Frontend - Teleprompter**
```
□ TeleprompterView component
□ Auto-scroll engine
□ Controles (play, pause, velocidade)
□ Ajuste de fonte
□ Formatação de texto (negrito, pausas)
□ Sidebar com notas
□ Indicador de progresso
```

### **Frontend - Modo Treino**
```
□ ModeSelectorView (escolher treino/ao vivo)
□ PracticeModeView
□ Timer de ensaio
□ Análise em tempo real
□ Salvar histórico de ensaios
□ Gráficos de evolução
```

### **Frontend - Chat**
```
□ LiveChat component
□ Mensagens em tempo real
□ Quick replies
□ Command buttons
□ Notificações
□ Som discreto
```

---

## 🎬 CONCLUSÃO

### **Resumo do Sistema:**

1. **Operador** cria rundown e adiciona estrutura inicial dos scripts
2. **Apresentador** pode editar e personalizar seus scripts
3. **Apresentador** pratica no **Modo Treino** quantas vezes quiser
4. **Sistema** analisa ensaios e dá feedback
5. **Apresentador** vai **Ao Vivo** com teleprompter profissional
6. **Operador** e **Apresentador** se comunicam via chat durante transmissão
7. **Sistema** sincroniza tudo em tempo real via WebSocket

### **Benefícios:**

✅ Apresentador **sempre sabe o que falar**
✅ Pode **praticar sem pressão**
✅ Tem **feedback automático**
✅ **Comunicação direta** com operador
✅ **Scripts editáveis** por ambos
✅ **Flexível**: manual ou auto-scroll
✅ **Profissional**: notas privadas, guia de pronúncia

---

*Fluxo criado em: Outubro 2024*  
*Sistema: Apront*  
*Versão: 1.0*


