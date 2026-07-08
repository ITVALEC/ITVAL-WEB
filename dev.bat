@echo off
REM Inicia el servidor de desarrollo SIN borrar la cache ni matar procesos.
REM Si hay errores raros (ENOENT, Turbopack), usa: npm run dev:clean

cd /d "%~dp0"

npm.cmd run dev
