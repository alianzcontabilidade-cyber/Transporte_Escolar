@echo off
setlocal
cd /d %~dp0..\packages\api
if exist .env (
  echo O arquivo .env ja existe em packages\api.
  exit /b 0
)
copy .env.example .env >nul
if errorlevel 1 (
  echo Nao foi possivel copiar .env.example.
  exit /b 1
)
echo Arquivo packages\api\.env criado com sucesso.
echo Edite o arquivo e ajuste a DATABASE_URL antes de executar o db-push.
endlocal
