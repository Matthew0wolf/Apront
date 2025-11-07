# 📡 API de Scripts - Documentação

## Rotas implementadas no Sprint 1

### 1. GET `/items/<item_id>/script`
Obtém o script completo de um item específico.

**Autenticação:** JWT Required

**Resposta de sucesso (200):**
```json
{
  "id": 123,
  "title": "Abertura do Programa",
  "duration": 150,
  "script": "Olá e sejam muito bem-vindos...",
  "talking_points": [
    "Dar boas-vindas",
    "Apresentar-se"
  ],
  "pronunciation_guide": "Tech News → TECH NIUS",
  "presenter_notes": "Olhar para câmera 2"
}
```

---

### 2. PUT `/items/<item_id>/script`
Atualiza o script de um item.

**Autenticação:** JWT Required

**Body:**
```json
{
  "script": "Texto do script...",
  "talking_points": ["Ponto 1", "Ponto 2"],
  "pronunciation_guide": "Guia...",
  "presenter_notes": "Notas privadas..."
}
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "message": "Script atualizado com sucesso",
  "data": { ... }
}
```

---

### 3. GET `/rundowns/<rundown_id>/scripts`
Obtém todos os scripts de um rundown (útil para o apresentador ver tudo).

**Autenticação:** JWT Required

**Resposta de sucesso (200):**
```json
{
  "rundown_id": 1,
  "rundown_name": "Tech News Ep. 45",
  "scripts": [
    {
      "folder_id": 1,
      "folder_title": "Bloco 1 - Abertura",
      "items": [
        {
          "id": 123,
          "title": "Abertura",
          "duration": 150,
          "has_script": true,
          "script": "...",
          "talking_points": [...],
          "pronunciation_guide": "...",
          "presenter_notes": "..."
        }
      ]
    }
  ]
}
```

---

### 4. POST `/rehearsals`
Registra um novo ensaio de um item.

**Autenticação:** JWT Required

**Body:**
```json
{
  "item_id": 123,
  "duration": 165,
  "planned_duration": 150,
  "notes": "Melhorou! Quase perfeito"
}
```

**Resposta de sucesso (201):**
```json
{
  "success": true,
  "message": "Ensaio registrado com sucesso",
  "data": {
    "id": 1,
    "item_id": 123,
    "duration": 165,
    "planned_duration": 150,
    "difference": 15,
    "recorded_at": "2024-10-15T14:30:00"
  }
}
```

---

### 5. GET `/items/<item_id>/rehearsals`
Obtém histórico de ensaios de um item.

**Autenticação:** JWT Required

**Resposta de sucesso (200):**
```json
{
  "item_id": 123,
  "item_title": "Abertura",
  "rehearsals": [
    {
      "id": 2,
      "duration": 140,
      "planned_duration": 150,
      "difference": -10,
      "recorded_at": "2024-10-15T14:15:00",
      "notes": "Melhorou!",
      "status": "under"
    },
    {
      "id": 1,
      "duration": 190,
      "planned_duration": 150,
      "difference": 40,
      "recorded_at": "2024-10-15T14:00:00",
      "notes": "Muito rápido",
      "status": "over"
    }
  ],
  "stats": {
    "total_rehearsals": 2,
    "average_difference": 15,
    "best_attempt": {
      "id": 2,
      "difference": -10,
      "recorded_at": "2024-10-15T14:15:00"
    }
  }
}
```

---

### 6. DELETE `/rehearsals/<rehearsal_id>`
Remove um ensaio.

**Autenticação:** JWT Required

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "message": "Ensaio removido com sucesso"
}
```

---

### 7. GET `/users/<user_id>/rehearsals/stats`
Obtém estatísticas gerais de ensaios de um usuário.

**Autenticação:** JWT Required

**Resposta de sucesso (200):**
```json
{
  "user_id": 1,
  "total_rehearsals": 15,
  "total_time_practiced": 3600,
  "average_accuracy": 8.5,
  "items_practiced": 5,
  "recent_rehearsals": [
    {
      "id": 15,
      "item_title": "Abertura",
      "duration": 145,
      "difference": -5,
      "recorded_at": "2024-10-15T16:00:00"
    }
  ]
}
```

---

## Como usar no Frontend

### Exemplo: Salvar script
```javascript
const saveScript = async (itemId, scriptData) => {
  const response = await fetch(`/api/items/${itemId}/script`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      script: scriptData.script,
      talking_points: scriptData.talkingPoints,
      pronunciation_guide: scriptData.pronunciationGuide,
      presenter_notes: scriptData.presenterNotes
    })
  });
  
  return await response.json();
};
```

### Exemplo: Registrar ensaio
```javascript
const saveRehearsal = async (itemId, duration, notes) => {
  const response = await fetch('/api/rehearsals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      item_id: itemId,
      duration: duration,
      notes: notes
    })
  });
  
  return await response.json();
};
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro do servidor

---

**Sprint 1 - Backend completo! ✅**

