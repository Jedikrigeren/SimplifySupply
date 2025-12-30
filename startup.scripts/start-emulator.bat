@echo off
REM Windows batch file wrapper to start Android emulator
powershell -ExecutionPolicy Bypass -File "%~dp0start-emulator.ps1" %*
