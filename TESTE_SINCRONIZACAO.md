# 🧪 Guia de Teste de Sincronização

## Problemas Identificados e Soluções

### 1. ✅ Problema da Duração Total (NaN:NaN:NaN)
**Causa:** O campo `duration` dos itens pode ser string ou number, causando NaN no cálculo.

**Solução Implementada:**
- Adicionada verificação de tipo no cálculo da duração total
- Conversão segura para número com fallback para 0

### 2. 🔍 Problema de Sincronização entre Operador e Apresentador
**Possíveis Causas:**
- IDs de rundown não correspondem (string vs number)
- WebSocket não está conectando corretamente
- Eventos não estão sendo disparados

**Soluções Implementadas:**
- Logs de debug detalhados para rastrear eventos
- Comparação de IDs usando `==` em vez de `===` para flexibilidade de tipos
- Indicadores visuais de status de conexão

## Como Testar a Sincronização

### Passo 1: Verificar Conexão WebSocket
1. Abra o console do navegador (F12)
2. Verifique se aparece: `✅ Conectado ao servidor WebSocket`
3. Se não aparecer, verifique se o backend está rodando com `socketio.run()`

### Passo 2: Testar Sincronização Básica
1. **Abra duas abas:**
   - Aba 1: Operador (`/project/{id}/operator`)
   - Aba 2: Apresentador (`/project/{id}/presenter`)

2. **Verifique indicadores visuais:**
   - Ambas as abas devem mostrar "Sincronizado" (ícone verde)
   - Se mostrar "Desconectado" (ícone vermelho), há problema de conexão

### Passo 3: Testar Mudanças de Status
1. Na aba do operador, altere o status de um projeto para "Ao Vivo"
2. Verifique se a mudança aparece na aba do apresentador
3. Observe os logs no console para ver os eventos sendo disparados

### Passo 4: Testar Reordenação
1. Na aba do operador, arraste e solte itens para reordenar
2. Verifique se a mudança aparece na aba do apresentador
3. Observe os logs no console

## Logs de Debug Esperados

### No Console do Operador:
```
✅ Conectado ao servidor WebSocket
🔄 Operador: Reordenando itens: {rundownId: 1, folderIndex: 0, newOrder: [...]}
📤 Operador: Enviando reordenação de itens para backend
📡 Reordenação enviada via WebSocket para outros clientes
```

### No Console do Apresentador:
```
✅ Conectado ao servidor WebSocket
📥 Evento itemReordered recebido: {rundownId: 1, folderIndex: 0, newOrder: [...]}
🔍 Verificando sincronização de itens: {activeRundownId: 1, eventRundownId: 1, isMatch: true}
✅ Atualizando ordem dos itens: {folderIndex: 0, newOrder: [...]}
```

## Solução de Problemas

### Se a Sincronização Não Funcionar:

1. **Verifique a conexão WebSocket:**
   ```javascript
   // No console do navegador
   console.log('WebSocket status:', websocketManager.getConnectionStatus());
   ```

2. **Verifique se os IDs correspondem:**
   - Os logs mostrarão se `activeRundownId` e `eventRundownId` são iguais
   - Se não forem, há problema na conversão de tipos

3. **Verifique se o backend está enviando eventos:**
   - No terminal do backend, deve aparecer logs de clientes conectados
   - Deve aparecer logs quando eventos são enviados

4. **Teste com uma única aba primeiro:**
   - Faça mudanças na mesma aba e verifique se os eventos são disparados
   - Se não funcionar, há problema na lógica de eventos

### Se a Duração Ainda Mostrar NaN:

1. **Verifique os dados do rundown:**
   ```javascript
   // No console do navegador
   console.log('Rundown data:', rundown);
   console.log('Items:', rundown?.items);
   ```

2. **Verifique se os itens têm duration:**
   ```javascript
   rundown?.items?.forEach((folder, i) => {
     folder.children?.forEach((item, j) => {
       console.log(`Item ${i}-${j}:`, item.title, 'duration:', item.duration, 'type:', typeof item.duration);
     });
   });
   ```

## Próximos Passos

1. **Teste com dados reais:** Crie um rundown com itens que tenham durações válidas
2. **Teste com múltiplos usuários:** Abra várias abas e teste mudanças simultâneas
3. **Monitore performance:** Verifique se não há vazamentos de memória ou loops infinitos

## Status da Implementação

- ✅ WebSocket integrado
- ✅ Indicadores visuais de conexão
- ✅ Logs de debug detalhados
- ✅ Correção do problema de duração total
- ✅ Comparação flexível de IDs
- 🔄 Testando sincronização em tempo real
