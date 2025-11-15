# 🔧 Configurar Backend para Desenvolvimento Local

## ❌ Problema

Frontend rodando em `localhost:3000` tentando conectar ao backend em `localhost:5001`, mas backend está na VPS `72.60.56.28`.

## ✅ Solução

Configure a URL do backend para desenvolvimento local.

### **Opção 1: Criar arquivo `.env.local` (Recomendado)**

Na raiz do projeto (`Apront/`), crie o arquivo `.env.local`:

```bash
# Na raiz do projeto Apront/
VITE_API_BASE_URL_DEV=http://72.60.56.28
```

### **Opção 2: Editar `.env` existente**

Se já tiver um `.env` na raiz, adicione:

```env
VITE_API_BASE_URL_DEV=http://72.60.56.28
```

### **Opção 3: Criar `.env` na raiz**

```bash
# Na raiz do projeto
echo "VITE_API_BASE_URL_DEV=http://72.60.56.28" > .env.local
```

## 🚀 Como Funciona

- **Em desenvolvimento (`localhost:3000`):** Usa `VITE_API_BASE_URL_DEV` se configurado
- **Em produção (VPS):** Usa `VITE_API_BASE_URL` ou detecta automaticamente
- **Sem configuração:** Tenta `localhost:5001` (backend local)

## 📋 Passos Completos:

### **1. Criar `.env.local` na raiz:**

```bash
cd /caminho/para/Apront
echo "VITE_API_BASE_URL_DEV=http://72.60.56.28" > .env.local
```

### **2. Reiniciar servidor de desenvolvimento:**

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### **3. Verificar no console do navegador:**

Deve aparecer:
```
🏠 Desenvolvimento local detectado, usando backend configurado: http://72.60.56.28
```

## ⚠️ Importante:

- **`.env.local`** é ignorado pelo Git (não será commitado)
- **`.env`** pode ser commitado (verifique `.gitignore`)
- **Reinicie o servidor** após criar/editar o arquivo
- **Vite** só carrega variáveis que começam com `VITE_`

## 🔍 Verificar se funcionou:

1. **Abra o console do navegador** (F12)
2. **Procure por:** `🔧 API configurada:`
3. **Deve mostrar:** `API_BASE_URL: "http://72.60.56.28"`

## 📝 Exemplo de `.env.local`:

```env
# URL do backend para desenvolvimento local
# Use quando backend está na VPS mas frontend roda localmente
VITE_API_BASE_URL_DEV=http://72.60.56.28

# Ou se backend estiver em outro lugar:
# VITE_API_BASE_URL_DEV=http://seu-ip:5001
```

