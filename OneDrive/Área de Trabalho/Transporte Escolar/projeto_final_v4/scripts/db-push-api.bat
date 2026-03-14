@echo off
setlocal
cd /d %~dp0..\packages\api
if not exist .env (
  echo Arquivo .env nao encontrado em packages\api.
  echo Execute scripts\setup-api-env.bat primeiro.
  exit /b 1
)
call npm install
if errorlevel 1 exit /b 1
call npx drizzle-kit push
endlocal
