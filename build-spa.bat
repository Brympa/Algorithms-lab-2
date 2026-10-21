@echo off
chcp 65001 >nul
setlocal

where dotnet >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ОШИБКА] .NET SDK NOT FOUND IN PATH!
    echo Download .NET SDK 10 from https://dotnet.microsoft.com/download
    echo.
    pause
    exit /b 1
)

:: 2. Cleaning directory dist
if exist "%~dp0dist" (
    echo [1/2] Cleaning directory dist...
    rmdir /s /q "%~dp0dist" 2>nul
)

:: 3. Generating SPA build
echo [2/3] Generating SPA build...
echo       Project: src\AlgorithmsLab2.Web\AlgorithmsLab2.Web.csproj
echo       Directory: dist\
echo.

dotnet publish "%~dp0src\AlgorithmsLab2.Web\AlgorithmsLab2.Web.csproj" -c Release -o "%~dp0dist" --nologo -v m
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ОШИБКА] SPA building error!
    echo.
    pause
    exit /b 1
)
pause