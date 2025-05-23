@echo off
cd /d "D:\MorphMind"
echo Compiling TypeScript files...
tsc -p ./
if %errorlevel% equ 0 (
    echo Compilation successful!
) else (
    echo Compilation failed with errors.
)
pause
