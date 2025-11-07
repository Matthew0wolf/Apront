@echo off
echo ========================================
echo LIMPANDO CACHE E REINICIANDO FRONTEND
echo ========================================
echo.

echo [1] Limpando cache do Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo     Cache limpo!
) else (
    echo     Nenhum cache encontrado
)

echo.
echo [2] Limpando cache do navegador...
echo     Por favor, no navegador:
echo     - Pressione Ctrl + Shift + Delete
echo     - Marque "Imagens e arquivos em cache"
echo     - Clique em "Limpar dados"
echo.
pause

echo.
echo [3] Iniciando frontend...
echo.
npm run dev

pause

