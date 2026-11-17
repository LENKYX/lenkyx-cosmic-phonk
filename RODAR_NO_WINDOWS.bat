@echo off
cd /d "%~dp0"
title LENKYX - Cosmic Phonk App
echo ==================================================
echo    LENKYX COSMIC PHONK - INICIANDO SEU APP...
echo ==================================================
echo.

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"

where node >nul 2>nul
if errorlevel 1 goto no_node

echo [OK] Node.js encontrado!
node -v
echo.

if exist "node_modules" goto check_dist
echo [1/3] Instalando dependencias pela primeira vez - aguarde...
call npm install
if errorlevel 1 goto err_install

:check_dist
if exist "dist\index.html" goto start_server
echo [2/3] Preparando interface do aplicativo LENKYX...
call npm run build
if errorlevel 1 goto err_build

:start_server
echo [3/3] Abrindo o App LENKYX no navegador: http://localhost:3000
echo Senha inicial da Area Criador: lenkyx2026
echo.
echo Deixe esta janela aberta enquanto usa o aplicativo.
echo ==================================================
echo.
start /min "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"
node server/index.js
echo.
echo O servidor LENKYX foi encerrado.
pause
exit /b 0

:no_node
echo [ERRO] Node.js nao foi encontrado neste computador.
echo Baixe e instale gratuitamente em: https://nodejs.org
echo Escolha a versao LTS, instale, e depois abra este arquivo novamente.
echo.
pause
exit /b 1

:err_install
echo.
echo [ERRO] Falha ao instalar dependencias. Verifique sua internet e tente novamente.
echo Dica: mova a pasta lenkyx-app para C:\lenkyx-app fora do OneDrive.
pause
exit /b 1

:err_build
echo.
echo [ERRO] Falha ao compilar o aplicativo.
pause
exit /b 1
