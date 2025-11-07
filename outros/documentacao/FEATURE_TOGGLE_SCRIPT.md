# 🔀 Feature Toggle - Script/Teleprompter

## 💡 Conceito

Sistema flexível que permite ao apresentador escolher entre dois modos de visualização:

### 📖 Modo Script (Completo)
- Mostra título, descrição, ícone
- **+ Script completo do item**
- **+ Notas privadas do apresentador**
- Ideal para: Programas de TV, apresentações formais, eventos com roteiro

### 👁️ Modo Simplificado (Compacto)
- Mostra apenas título, descrição, ícone
- **Sem script detalhado**
- **Sem notas extras**
- Ideal para: Eventos ao vivo, shows, entrevistas espontâneas

---

## 🎯 Casos de Uso

### Exemplo 1: Programa de TV
```
Cliente: Emissora de TV
Evento: Telejornal diário
Necessidade: Script completo com todas as falas
Modo usado: Script (ON)
```

### Exemplo 2: Festival de Música
```
Cliente: Produtora de eventos
Evento: Festival com múltiplos shows
Necessidade: Apenas ordem de apresentações
Modo usado: Simplificado (OFF)

Itens:
- Abertura
- Show: Banda A
- Intervalo
- Show: Banda B
- Entrevista
- Encerramento
```

### Exemplo 3: Conferência Corporativa
```
Cliente: Empresa
Evento: Conferência anual
Necessidade: Misto - alguns palestrantes têm script, outros não
Modo usado: Toggle conforme necessário

Blocos:
- Abertura CEO (com script) → Script ON
- Palestra convidado (sem script) → Script OFF
- Apresentação produto (com script) → Script ON
- Q&A (sem script) → Script OFF
```

---

## 🔧 Como Funciona

### Interface do Apresentador

**Header com botão toggle:**
```
[Sair]  [🔴 AO VIVO]  [📶 Sincronizado]  [📖 Script] ⟵ Ativo
                                           ou
                                         [👁️ Simplificado] ⟵ Desativado
```

### Comportamento

#### Quando Script está ATIVO (📖):
```
┌─────────────────────────────────┐
│  🎬 Abertura do Programa       │
│  Apresentação inicial          │
│                                 │
│  📝 Script                     │
│  ┌─────────────────────────┐  │
│  │ Olá e sejam muito       │  │
│  │ bem-vindos ao Tech News!│  │
│  │ Eu sou João Silva...    │  │
│  └─────────────────────────┘  │
│                                 │
│  📋 Notas Privadas             │
│  • Olhar câmera 2              │
│  • Falar com energia           │
│                                 │
│  ━━━━━━━━━━░░░░░░  65%        │
└─────────────────────────────────┘
```

#### Quando Script está DESATIVADO (👁️):
```
┌─────────────────────────────────┐
│  🎬 Abertura do Programa       │
│  Apresentação inicial          │
│                                 │
│  👁️ Script disponível          │
│     (clique para ver)          │
│                                 │
│  ━━━━━━━━━━░░░░░░  65%        │
└─────────────────────────────────┘
```

### Persistência

A preferência do apresentador é salva no `localStorage`:
- Key: `presenter_show_script`
- Valor: `true` ou `false`
- Persiste entre sessões

### Feedback Visual

Ao alternar o modo:
```
Toast aparece:
📖 "Script Visível"
   "Exibindo scripts dos itens"

ou

👁️ "Script Oculto"
   "Modo simplificado ativado - apenas títulos"
```

---

## 💼 Controle por Plano (Futuro)

### Estrutura no Banco de Dados

```json
// Tabela: plans.features (JSON)
{
  "has_teleprompter": true,
  "has_rehearsal_mode": true,
  "has_analytics": true,
  "has_script_toggle": true  // Nova feature
}
```

### Implementação Futura

```javascript
// Verificar permissão do plano
const canToggleScript = company.plan.features.has_script_toggle;

// Renderizar botão condicionalmente
{canToggleScript && (
  <Button onClick={toggleScript}>
    {showScript ? "Script" : "Simplificado"}
  </Button>
)}
```

### Matriz de Planos (Sugestão)

| Plano      | Script Toggle | Teleprompter | Ensaios |
|------------|---------------|--------------|---------|
| **Free**   | ❌ Não        | ❌ Não       | ❌ Não  |
| **Basic**  | ✅ Sim        | ❌ Não       | ❌ Não  |
| **Pro**    | ✅ Sim        | ✅ Sim       | ✅ Sim  |
| **Enterprise** | ✅ Sim    | ✅ Sim       | ✅ Sim  |

**Free:** Apenas visualização básica de rundown  
**Basic:** Pode escolher se quer ver scripts ou não  
**Pro:** Acesso completo ao teleprompter profissional  
**Enterprise:** Tudo + recursos customizados  

---

## 🔐 Controle de Acesso (Implementação Futura)

### No Backend

```python
# routes/scripts.py
@scripts_bp.route('/items/<item_id>/script', methods=['GET'])
@jwt_required()
def get_item_script(item_id):
    current_user = get_current_user()
    company = current_user.company
    
    # Verificar se o plano permite acesso a scripts
    if not has_feature(company.plan, 'has_teleprompter'):
        return jsonify({
            'error': 'Feature não disponível no seu plano',
            'upgrade_required': True
        }), 403
    
    # ... resto do código
```

### No Frontend

```javascript
// Verificar permissão antes de mostrar botão
const checkScriptPermission = async () => {
  const response = await fetch('/api/user/features');
  const features = await response.json();
  
  if (!features.has_script_toggle) {
    // Desabilitar botão
    // Mostrar badge "Pro"
  }
};
```

---

## 📊 Casos de Uso Reais

### 1. Emissora de TV Regional
- Plano: Pro
- Uso: 80% Script ON, 20% Script OFF
- Motivo: Telejornal precisa de script, mas entrevistas são livres

### 2. Produtora de Eventos
- Plano: Basic
- Uso: 100% Script OFF
- Motivo: Apenas coordenação de blocos (shows, intervalos)

### 3. Igreja/Templo
- Plano: Basic
- Uso: 50% Script ON, 50% Script OFF
- Motivo: Liturgia tem script, pregação é livre

### 4. Teatro
- Plano: Pro
- Uso: 100% Script ON
- Motivo: Peças precisam de script completo

### 5. Podcast ao Vivo
- Plano: Basic
- Uso: 20% Script ON, 80% Script OFF
- Motivo: Apenas abertura/encerramento tem script

---

## 🎨 UI/UX

### Estados do Botão

**Estado 1: Script Ativo**
```
┌──────────────┐
│ 📖 Script    │  ← Botão preenchido (variant="default")
└──────────────┘
```

**Estado 2: Script Desativado**
```
┌──────────────────┐
│ 👁️ Simplificado │  ← Botão outline (variant="outline")
└──────────────────┘
```

**Em Telas Pequenas:**
```
┌────┐
│ 📖 │  ou  │ 👁️ │  ← Apenas ícone
└────┘
```

### Posicionamento

```
Header:
[Sair] ... [AO VIVO] [Sincronizado] [Toggle Script] ... [Relógio]
                                          ↑
                                    Fácil acesso
```

---

## 🚀 Vantagens

### Para o Cliente
✅ **Flexibilidade** - Adapta-se a diferentes tipos de evento  
✅ **Economia** - Não paga por feature que não usa  
✅ **Simplicidade** - Interface limpa quando não precisa de script  
✅ **Profissionalismo** - Script completo quando necessário  

### Para o Apresentador
✅ **Controle** - Decide quando quer ver script  
✅ **Menos distração** - Oculta informação desnecessária  
✅ **Rapidez** - Alterna com um clique  
✅ **Personalização** - Preferência salva automaticamente  

### Para a Empresa (SaaS)
✅ **Upsell** - Planos com mais features  
✅ **Diferenciação** - Não é one-size-fits-all  
✅ **Retenção** - Clientes encontram valor no que precisam  
✅ **Competitivo** - Adapta-se a nichos específicos  

---

## 📈 Métricas (Futuro)

Coletar dados de uso para entender comportamento:

```sql
-- Criar tabela de analytics
CREATE TABLE feature_usage (
    id INTEGER PRIMARY KEY,
    company_id INTEGER,
    user_id INTEGER,
    feature_name VARCHAR(50),
    usage_count INTEGER,
    last_used TIMESTAMP
);
```

Perguntas para responder:
- Qual % de clientes usa script?
- Quantas vezes por sessão o toggle é usado?
- Qual tipo de evento mais usa cada modo?
- Correlação entre plano e uso de script?

---

## ✅ Status Atual

- ✅ Toggle funcional
- ✅ Persistência localStorage
- ✅ Feedback visual (toast)
- ✅ Indicador quando script existe mas está oculto
- ✅ Responsivo (texto oculta em telas pequenas)
- ⏳ Controle por plano (preparado, não implementado)
- ⏳ Analytics de uso (futuro)
- ⏳ Configuração por empresa (futuro)

---

## 🔮 Próximas Evoluções

### Versão 2.0
- [ ] Controle por plano ativo
- [ ] Badge "Pro" em features premium
- [ ] Modal de upgrade quando feature bloqueada

### Versão 3.0
- [ ] Configuração default por empresa
- [ ] Configuração por rundown (alguns sempre com script)
- [ ] Modo "Híbrido" - script pequeno no canto

### Versão 4.0
- [ ] IA sugere modo baseado no tipo de evento
- [ ] Analytics de efetividade (script ajudou?)
- [ ] A/B testing de interfaces

---

**Implementado em: Outubro 2024**  
**Versão atual: 1.0 - Toggle básico funcional**

