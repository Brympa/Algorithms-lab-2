@echo off
where dotnet >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ОШИБКА] .NET SDK NOT FOUND IN PATH!
    echo Download .NET SDK 10 from https://dotnet.microsoft.com/download
    echo.
    pause
    exit /b 1
)
echo [1/2] Build test...
dotnet build src\AlgorithmsLab2.Web\AlgorithmsLab2.Web.csproj -c Debug --nologo -v q
if %ERRORLEVEL% neq 0 (
    echo [ERROR] The build failed with an error!
    pause
    exit /b 1
)
echo [2/2] Start...
dotnet run --project src\AlgorithmsLab2.Web\AlgorithmsLab2.Web.csproj --no-build -c Debug
pause