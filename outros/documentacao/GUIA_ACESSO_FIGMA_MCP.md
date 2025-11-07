# 🎨 Guia: Como Configurar Acesso ao Figma via MCP

## 📋 **PRÉ-REQUISITOS**

1. ✅ **Figma Desktop** instalado (não use o navegador)
2. ✅ **Cursor** instalado e rodando
3. ✅ Projeto Figma aberto no Figma Desktop

---

## 🔧 **PASSO 1: Ativar Servidor MCP no Figma Desktop**

### **Opção A: Através do Menu (Recomendado)**

1. Abra o **Figma Desktop**
2. Abra seu arquivo/projeto: `Apront-Branding`
3. Vá em **Menu** → **Help** → **Account Settings** (ou `Ctrl + ,`)
4. Procure por **"Developer"** ou **"Dev Mode"** no menu lateral
5. Procure por **"MCP Server"** ou **"Model Context Protocol"**
6. **Ative** a opção "Enable MCP Server" ou "Start MCP Server"
7. Anote a **porta** que aparece (geralmente é `3845`)

### **Opção B: Através do Dev Mode**

1. No Figma Desktop, pressione `Ctrl + Shift + D` (ou `Cmd + Shift + D` no Mac)
2. Isso ativa o **Dev Mode**
3. O servidor MCP deve iniciar automaticamente

### **Verificar se o Servidor está Rodando:**

1. Abra o **Terminal/PowerShell**
2. Execute:
```powershell
curl http://127.0.0.1:3845/mcp
```
3. Se retornar algo (mesmo que erro), o servidor está ativo!

---

## ⚙️ **PASSO 2: Configurar MCP no Cursor**

### **Arquivo de Configuração:**

O arquivo `c:\Users\mathe\.cursor\mcp.json` já está configurado:

```json
{
  "mcpServers": {
    "Figma": {
      "url": "http://127.0.0.1:3845/mcp",
      "headers": {}
    }
  }
}
```

### **Reiniciar o Cursor:**

1. **Feche completamente o Cursor**
2. **Abra novamente**
3. Isso fará o Cursor se conectar ao servidor MCP do Figma

---

## 🔗 **PASSO 3: Compartilhar o Link do Figma**

### **Como Obter o Link Correto:**

1. No **Figma Desktop**, abra o arquivo `Apront-Branding`
2. Selecione o **Frame/Quadro** que você quer que eu implemente
   - Exemplo: Dashboard, Login, Sidebar, etc.
3. Clique com o botão direito no frame
4. Escolha **"Copy link"** ou **"Copiar link"**
5. O link será algo como:
   ```
   https://www.figma.com/design/a4SKzmlfMaRZbN2zkrrByt/Apront-Branding?node-id=154-2
   ```

### **Ou use o atalho:**

1. Selecione o frame no Figma
2. Pressione `Ctrl + L` (ou `Cmd + L` no Mac)
3. O link será copiado automaticamente

---

## 📤 **PASSO 4: Enviar para o AI**

### **O que enviar:**

1. **O link do Figma** (do passo 3)
2. **Qual tela/componente** você quer implementar:
   - Exemplo: "Dashboard", "Login", "Sidebar", "ProjectsView", etc.
3. **Se houver múltiplas telas**, compartilhe todos os links

### **Exemplo de mensagem:**

```
@https://www.figma.com/design/a4SKzmlfMaRZbN2zkrrByt/Apront-Branding?node-id=154-2

Quero que você implemente a tela de Dashboard conforme este design do Figma.
```

---

## ✅ **VERIFICAÇÃO: Testar se Está Funcionando**

### **Checklist:**

- [ ] Figma Desktop está aberto
- [ ] Arquivo `Apront-Branding` está aberto no Figma
- [ ] Dev Mode está ativo (se necessário)
- [ ] Servidor MCP está rodando (porta 3845)
- [ ] Cursor foi reiniciado após configurar MCP
- [ ] Link do Figma foi copiado e enviado

---

## 🚨 **TROUBLESHOOTING**

### **Problema: "Não consigo acessar o Figma"**

**Solução 1:** Verificar se o Figma Desktop está rodando
```powershell
# No PowerShell, verifique se a porta 3845 está aberta:
netstat -an | findstr 3845
```

**Solução 2:** Verificar se o servidor MCP está ativo
- No Figma Desktop, vá em **Help** → **Account Settings** → **Developer**
- Certifique-se de que "Enable MCP Server" está marcado

**Solução 3:** Tentar porta diferente
- Se o Figma usar outra porta, atualize o `mcp.json`:
```json
{
  "mcpServers": {
    "Figma": {
      "url": "http://127.0.0.1:PORTA_AQUI/mcp",
      "headers": {}
    }
  }
}
```

### **Problema: "Cursor não reconhece o MCP"**

**Solução:**
1. Feche completamente o Cursor
2. Abra novamente
3. Se ainda não funcionar, verifique se o arquivo `mcp.json` está no local correto:
   - Windows: `C:\Users\SEU_USUARIO\.cursor\mcp.json`

### **Problema: "Link do Figma não funciona"**

**Solução:**
- Certifique-se de que o arquivo está **aberto no Figma Desktop**
- O link deve ser do tipo: `https://www.figma.com/design/...`
- Se o arquivo for privado, você pode precisar torná-lo público temporariamente

---

## 🎯 **PRÓXIMOS PASSOS**

Após configurar tudo:

1. **Compartilhe o link do Figma** comigo
2. **Diga qual tela/componente** você quer implementar
3. **Eu vou:**
   - Acessar o design do Figma
   - Extrair cores, tipografia, espaçamentos
   - Aplicar no código do sistema
   - Garantir que fique idêntico ao design

---

## 📝 **NOTAS IMPORTANTES**

⚠️ **O servidor MCP do Figma funciona apenas com o Figma Desktop**, não com o navegador.

⚠️ **O arquivo Figma precisa estar aberto** no Figma Desktop para que eu consiga acessar.

⚠️ **Se o arquivo for privado**, considere torná-lo público temporariamente ou me dar acesso.

---

## 🎨 **EXEMPLO DE USO**

1. Você abre o Figma Desktop
2. Abre o arquivo `Apront-Branding`
3. Seleciona o frame "Dashboard"
4. Copia o link: `https://www.figma.com/design/...?node-id=154-2`
5. Me envia: `@link_do_figma Implemente a tela Dashboard`
6. Eu acesso o design, extraio tudo e aplico no código! ✨

